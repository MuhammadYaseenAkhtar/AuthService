/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants/index.ts";
import { Tenant } from "../../src/entity/Tenant.ts";

describe("PATCH /tenants/:tenantId", () => {
    let connection: DataSource;
    let privateKey: string;
    let adminToken: string;
    let managerToken: string;
    let tenantId: number;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();

        // Load private key from certs folder
        try {
            const encoded = process.env.PRIVATE_KEY;
            if (!encoded) {
                throw new Error("Env PRIVATE_KEY is not set");
            }

            privateKey = Buffer.from(encoded, "base64").toString("utf8");
        } catch (err) {
            throw createHttpError(
                500,
                "Private key is not configured correctly",
                { cause: err },
            );
        }

        // Generate REAL RS256 tokens
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

        // Seed DB with a test tenant
        const tenantRepo = connection.getRepository(Tenant);
        const savedTenant = await tenantRepo.save(
            tenantRepo.create({
                name: "Original Tenant",
                address: "123 Original Street",
            }),
        );
        tenantId = savedTenant.id;
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("When updating tenant as admin", () => {
        it("returns 200 and updated tenant when both name and address are provided", async () => {
            // Act
            const response = await request(app)
                .patch(`/tenants/${tenantId}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "Updated Tenant",
                    address: "456 Updated Ave",
                });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message");
            expect(response.body).toHaveProperty("data");
            expect(response.body.data.name).toBe("Updated Tenant");
            expect(response.body.data.address).toBe("456 Updated Ave");
            expect(response.body.message).toContain("updated successfully");
        });

        it("returns 404 when tenant does not exist", async () => {
            // Act
            const response = await request(app)
                .patch("/tenants/9999")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "Updated Name",
                    address: "Updated Address",
                });

            // Assert
            expect(response.statusCode).toBe(404);
            expect(response.body.errors[0]).toHaveProperty("msg");
            expect(response.body.errors[0].msg).toContain("not found");
        });
    });

    describe("Validation", () => {
        it("returns 400 when required fields are missing", async () => {
            // Act - missing name
            const response1 = await request(app)
                .patch(`/tenants/${tenantId}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    address: "123 Test St",
                });

            // Assert
            expect(response1.statusCode).toBe(400);
            expect(response1.body).toHaveProperty("errors");

            // Act - missing address
            const response2 = await request(app)
                .patch(`/tenants/${tenantId}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "Updated Tenant",
                });

            // Assert
            expect(response2.statusCode).toBe(400);
            expect(response2.body).toHaveProperty("errors");
        });

        it("returns 400 when tenant ID is not a positive integer", async () => {
            // Act
            const response = await request(app)
                .patch("/tenants/invalid")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "Updated Name",
                    address: "Updated Address",
                });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
        });

        it("returns 400 when tenant ID is negative", async () => {
            // Act
            const response = await request(app)
                .patch("/tenants/-1")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "Updated Name",
                    address: "Updated Address",
                });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
        });

        it("returns 400 when name is empty string", async () => {
            // Act
            const response = await request(app)
                .patch(`/tenants/${tenantId}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "",
                    address: "123 Test St",
                });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
        });

        it("returns 400 when address is empty string", async () => {
            // Act
            const response = await request(app)
                .patch(`/tenants/${tenantId}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send({
                    name: "Updated Tenant",
                    address: "",
                });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
        });
    });

    describe("Authorization", () => {
        it("returns 401 when the user is not authenticated", async () => {
            // Act
            const response = await request(app)
                .patch(`/tenants/${tenantId}`)
                .send({
                    name: "Updated Name",
                    address: "Updated Address",
                });

            // Assert
            expect(response.status).toBe(401);
        });

        it("returns 403 when the user is authenticated but not an admin", async () => {
            // Act
            const response = await request(app)
                .patch(`/tenants/${tenantId}`)
                .set("Cookie", [`accessToken=${managerToken}`])
                .send({
                    name: "Updated Name",
                    address: "Updated Address",
                });

            // Assert
            expect(response.status).toBe(403);
        });
    });
});
