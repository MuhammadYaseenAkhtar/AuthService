/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import app from "../../src/app.ts";
import { Tenant } from "../../src/entity/Tenant.ts";
import { User } from "../../src/entity/User.ts";
import { Roles } from "../../src/constants/index.ts";
import { DataSource } from "typeorm";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";

describe("DELETE /tenants/:tenantId", () => {
    let connection: DataSource;
    let adminToken: string;
    let managerToken: string;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();

        // Load private key from certs folder
        let privateKey: string;
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

        // Generate REAL RS256 tokens consistent with other tests
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
                sub: "2",
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

    it("should delete a tenant if the user is an admin", async () => {
        // Arrange
        const tenantRepo = connection.getRepository(Tenant);
        const tenant = await tenantRepo.save({
            name: "Test Tenant",
            address: "123 Test St",
        });

        // Act
        const response = await request(app)
            .delete(`/tenants/${tenant.id}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).toContain(
            `Tenant ${tenant.name} with id ${tenant.id} has been deleted successfully`,
        );

        const deletedTenant = await tenantRepo.findOne({
            where: { id: tenant.id },
        });
        expect(deletedTenant).toBeNull();
    });

    it("should return 500 if tenant has users", async () => {
        // Arrange
        const tenantRepo = connection.getRepository(Tenant);
        const tenant = await tenantRepo.save({
            name: "Test Tenant",
            address: "123 Test St",
        });

        const userRepo = connection.getRepository(User);
        await userRepo.save({
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            password: "password",
            role: Roles.MANAGER,
            tenant,
        });

        // Act: Try to delete a tenant that still has a user associated with it.
        const response = await request(app)
            .delete(`/tenants/${tenant.id}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        // Assert: The database should prevent this, leading to an unhandled error and a 500.
        // This test documents the current (unsafe) behavior.
        expect(response.status).toBe(500);
        expect(response.body.errors[0].msg).toContain(
            "Something went wrong while deleting tenant by ID from DB",
        );
    });

    it("should return 403 if the user is not an admin", async () => {
        // Arrange
        const tenantRepo = connection.getRepository(Tenant);
        const tenant = await tenantRepo.save({
            name: "Test Tenant",
            address: "123 Test St",
        });

        // Act
        const response = await request(app)
            .delete(`/tenants/${tenant.id}`)
            .set("Cookie", [`accessToken=${managerToken}`]);

        // Assert
        expect(response.status).toBe(403);

        const stillThere = await tenantRepo.findOne({
            where: { id: tenant.id },
        });
        expect(stillThere).not.toBeNull();
    });

    it("should return 401 if the user is not authenticated", async () => {
        // Act
        const response = await request(app).delete(`/tenants/1`);

        // Assert
        expect(response.status).toBe(401);

        const tenantRepo = connection.getRepository(Tenant);
        const tenantCount = await tenantRepo.count();
        expect(tenantCount).toBe(0);
    });

    it("should return 404 if the tenant does not exist", async () => {
        const nonExistentTenantId = 999;
        const response = await request(app)
            .delete(`/tenants/${nonExistentTenantId}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(response.status).toBe(404);
        expect(response.body.errors[0].msg).toContain(
            `Tenant with ID ${nonExistentTenantId} is not found.`,
        );
    });

    it("should return 400 if the tenant ID is not a valid number", async () => {
        const invalidTenantId = "abc";
        const response = await request(app)
            .delete(`/tenants/${invalidTenantId}`)
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toBe(
            "Tenant id must be a positive integer",
        );
    });

    it("should return 400 if tenant ID is zero or negative", async () => {
        const responseZero = await request(app)
            .delete("/tenants/0")
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(responseZero.status).toBe(400);
        expect(responseZero.body.errors[0].msg).toBe(
            "Tenant id must be a positive integer",
        );

        const responseNegative = await request(app)
            .delete("/tenants/-5")
            .set("Cookie", [`accessToken=${adminToken}`]);

        expect(responseNegative.status).toBe(400);
        expect(responseNegative.body.errors[0].msg).toBe(
            "Tenant id must be a positive integer",
        );
    });
});
