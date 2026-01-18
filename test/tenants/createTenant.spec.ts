/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

        it("should return 403 status code if the user is not authorized (admin)", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Village Chopala, District Gujrat",
            };

            //Act

            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${managerToken}`])
                .send(tenantData);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();

            //Assert
            expect(response.status).toBe(403);
            expect(tenants).toHaveLength(0);
        });
    });

    describe("Tenant creation validation", () => {
        it("rejects request when tenant name is empty", async () => {
            // Arrange
            const tenantData = {
                name: "",
                address: "Village Chopala, District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert: HTTP
            expect(response.statusCode).toBe(400);

            // Assert: DB state
            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();

            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant name is only whitespace", async () => {
            // Arrange
            const tenantData = {
                name: "   ",
                address: "Village Chopala, District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant name is shorter than 5 characters", async () => {
            // Arrange
            const tenantData = {
                name: "Abc",
                address: "Village Chopala, District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");

            const messages = (
                response.body.errors as Array<{ msg: string }>
            ).map((e) => e.msg);
            expect(messages).toContain(
                "Tenant name must be between 5 and 100 characters",
            );

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant name is longer than 100 characters", async () => {
            // Arrange
            const longName = "A".repeat(101);
            const tenantData = {
                name: longName,
                address: "Village Chopala, District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant name contains numbers or special characters", async () => {
            // Arrange
            const tenantData = {
                name: "Tenant 123!",
                address: "Village Chopala, District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("trims tenant name before persisting", async () => {
            // Arrange
            const tenantData = {
                name: "   Drop Night Pizza   ",
                address: "Village Chopala, District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(201);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();
            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe("Drop Night Pizza");
        });

        it("rejects request when tenant address is empty", async () => {
            // Arrange
            const tenantData = {
                name: "drop night pizza",
                address: "",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert: HTTP
            expect(response.statusCode).toBe(400);

            // Assert: DB state
            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();

            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant address is only whitespace", async () => {
            // Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "   ",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant address is shorter than 5 characters", async () => {
            // Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Abc",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant address is longer than 255 characters", async () => {
            // Arrange
            const longAddress = "A".repeat(256);
            const tenantData = {
                name: "Drop Night Pizza",
                address: longAddress,
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("rejects request when tenant address contains invalid special characters", async () => {
            // Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Village Chopala @ District Gujrat",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("accepts address with allowed punctuation and numbers", async () => {
            // Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "123 Main St, Block-A / Phase-1",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(201);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();
            expect(tenants).toHaveLength(1);
            expect(tenants[0].address).toBe("123 Main St, Block-A / Phase-1");
        });

        it("trims tenant address before persisting", async () => {
            // Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "   Village Chopala, District Gujrat   ",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(201);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();
            expect(tenants).toHaveLength(1);
            expect(tenants[0].address).toBe("Village Chopala, District Gujrat");
        });

        it("rejects request when both name and address are missing", async () => {
            // Arrange
            const tenantData = {};

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])

                .send(tenantData as never);

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(response.body).toHaveProperty("errors");

            expect(Array.isArray(response.body.errors)).toBe(true);

            const tenantRepo = connection.getRepository(Tenant);
            const tenantCount = await tenantRepo.count();
            expect(tenantCount).toBe(0);
        });

        it("ignores unexpected extra fields in the payload", async () => {
            // Arrange
            const tenantData = {
                name: "Drop Night Pizza",
                address: "Village Chopala, District Gujrat",
                isAdmin: true,
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(201);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();
            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe("Drop Night Pizza");
            expect(tenants[0].address).toBe("Village Chopala, District Gujrat");
            expect(
                tenants[0] as unknown as Record<string, unknown>,
            ).not.toHaveProperty("isAdmin");
        });

        it("returns a consistent JSON error shape for validation errors", async () => {
            // Arrange
            const tenantData = {
                name: "",
                address: "",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(response.body).toHaveProperty("errors");

            expect(Array.isArray(response.body.errors)).toBe(true);
        });
    });
});
