import path from "path";
import fs from "fs";
import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants/index.ts";
import { Tenant } from "../../src/entity/Tenant.ts";

describe("GET /tenants", () => {
    let connection: DataSource;
    let privateKey: string;
    let adminToken: string;
    let managerToken: string;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();

        // Load private key from certs folder
        try {
            privateKey = fs.readFileSync(
                path.resolve(process.cwd(), "certs/private.pem"),
                "utf8",
            );
        } catch (err) {
            throw createHttpError(
                500,
                "Private key is not configured correctly",
                { cause: err },
            );
        }

        // Act: Generate REAL RS256 token
        adminToken = jsonwebtoken.sign(
            {
                sub: "1",
                role: Roles.ADMIN,
            },
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            },
        );

        managerToken = jsonwebtoken.sign(
            {
                sub: "1",
                role: Roles.MANAGER,
            },
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            },
        );
    });

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("When requesting tenant list as admin", () => {
        it("returns 200 and an empty array when no tenants exist", async () => {
            // Act
            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(0);
        });

        it("returns 200 and a list of tenants when tenants exist", async () => {
            // Arrange: seed DB with tenants
            const tenantRepo = connection.getRepository(Tenant);
            await tenantRepo.save([
                tenantRepo.create({
                    name: "Drop Night Pizza",
                    address: "Village Chopala, District Gujrat",
                }),
                tenantRepo.create({
                    name: "Moonlight Burgers",
                    address: "Town Square, City Center",
                }),
            ]);

            // Act
            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(2);

            const tenantNames = (response.body as Array<{ name: string }>).map(
                (tenant) => tenant.name,
            );

            expect(tenantNames).toEqual(
                expect.arrayContaining([
                    "Drop Night Pizza",
                    "Moonlight Burgers",
                ]),
            );
        });
    });

    describe("Authorization", () => {
        it("returns 401 when the user is not authenticated", async () => {
            // Act
            const response = await request(app).get("/tenants").send();

            // Assert
            expect(response.status).toBe(401);
        });

        it("returns 403 when the user is authenticated but not an admin", async () => {
            // Act
            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${managerToken}`])
                .send();

            // Assert
            expect(response.status).toBe(403);
        });
    });
});
