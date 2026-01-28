/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants/index.ts";
import { User } from "../../src/entity/User.ts";

describe("GET /users/:userId", () => {
    let connection: DataSource;
    let privateKey: string;
    let adminToken: string;
    let managerToken: string;

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
        // Reset database between tests
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("When requesting a specific user as admin", () => {
        it("returns 200 and the user when it exists", async () => {
            // Arrange: seed DB with a user
            const userRepo = connection.getRepository(User);
            const createdUser = await userRepo.save(
                userRepo.create({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@test.com",
                    password: "hashedpassword",
                    role: Roles.CUSTOMER,
                }),
            );

            // Act
            const response = await request(app)
                .get(`/users/${createdUser.id}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toMatchObject({
                id: createdUser.id,
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                email: createdUser.email,
            });
        });

        it("returns 404 when the user does not exist", async () => {
            // Act
            const response = await request(app)
                .get("/users/9999")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it("does not return password field in response", async () => {
            // Arrange
            const userRepo = connection.getRepository(User);
            const createdUser = await userRepo.save(
                userRepo.create({
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@test.com",
                    password: "hashedpassword",
                    role: Roles.CUSTOMER,
                }),
            );

            // Act
            const response = await request(app)
                .get(`/users/${createdUser.id}`)
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data).not.toHaveProperty("password");
        });
    });

    describe("Parameter validation", () => {
        it("returns 400 with a clear message when userId is not an integer", async () => {
            const response = await request(app)
                .get("/users/abc")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = (
                response.body.errors as Array<{ msg: string }>
            ).map((e) => e.msg);
            expect(messages).toContain("User id must be a positive integer");
        });

        it("returns 400 when userId is zero", async () => {
            const response = await request(app)
                .get("/users/0")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = (
                response.body.errors as Array<{ msg: string }>
            ).map((e) => e.msg);
            expect(messages).toContain("User id must be a positive integer");
        });

        it("returns 400 when userId is a negative integer", async () => {
            const response = await request(app)
                .get("/users/-1")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = (
                response.body.errors as Array<{ msg: string }>
            ).map((e) => e.msg);
            expect(messages).toContain("User id must be a positive integer");
        });

        it("returns 400 when userId is a decimal number", async () => {
            const response = await request(app)
                .get("/users/1.5")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = (
                response.body.errors as Array<{ msg: string }>
            ).map((e) => e.msg);
            expect(messages).toContain("User id must be a positive integer");
        });
    });

    describe("Authorization", () => {
        it("returns 401 when the user is not authenticated", async () => {
            const response = await request(app).get("/users/1").send();

            expect(response.status).toBe(401);
        });

        it("returns 403 when the user is authenticated but not an admin", async () => {
            const response = await request(app)
                .get("/users/1")
                .set("Cookie", [`accessToken=${managerToken}`])
                .send();

            expect(response.status).toBe(403);
        });
    });
});
