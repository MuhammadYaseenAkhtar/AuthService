import path from "path";
import fs from "fs";
import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { Tenant } from "../../src/entity/Tenant.ts";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants/index.ts";

describe("POST /tenant", () => {
    let connection: DataSource;
    let privateKey: string;
    let adminToken: string;
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
    });

    beforeEach(async () => {
        //Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given All fields", () => {
        it("should return 201 status code", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Village Chopala, District Gujrat",
            };

            //Act

            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            //Assert
            expect(response.statusCode).toBe(201);
        });

        it("should create a tenant in the database", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Village Chopala, District Gujrat",
            };

            //Act

            await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();

            //Assert
            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenantData.name);
        });

        it("should return 401 status code if the user is not authenticated", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Village Chopala, District Gujrat",
            };

            //Act

            const response = await request(app)
                .post("/tenants")
                .send(tenantData);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();

            //Assert
            expect(response.status).toBe(401);
            expect(tenants).toHaveLength(0);
        });
    });
});
