/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { DataSource } from "typeorm";
import app from "../../src/app";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants";

describe("POST /users", () => {
    let connection: DataSource;
    let privateKey: string;
    let adminToken: string;
    let managerToken: string;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();

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
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all the fields are correct", () => {
        it("should return a 201 status code and a success message", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);
            console.log(response.body);
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty("id");
            expect(response.body).toHaveProperty("message");
        });

        it("should create a user in the database", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].role).toBe(Roles.MANAGER);
        });

        it("should store hashed password in the database", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find({ select: ["password"] });

            expect(users[0].password).not.toBe("password");
            expect(users[0].password).toMatch(/^\$2[ayb]\$.{56}$/);
        });

        it("should be able to create users with different roles", async () => {
            const customerData = {
                firstName: "test",
                lastName: "customer",
                email: "customer@test.com",
                password: "password",
                role: Roles.CUSTOMER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(customerData);

            expect(response.statusCode).toBe(201);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0].role).toBe(Roles.CUSTOMER);
        });
    });

    describe("Validation tests", () => {
        it("should return 400 if email is missing", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if email is invalid", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if firstName is missing", async () => {
            const managerData = {
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if lastName is missing", async () => {
            const managerData = {
                firstName: "test",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if password is missing", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if password is too short", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "pass",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if password is too long", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "a".repeat(21),
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if role is missing", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if role is invalid", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: "superadmin",
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(400);
        });

        it("should trim whitespace from firstName and lastName", async () => {
            const managerData = {
                firstName: "  test  ",
                lastName: "  manager  ",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(201);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0].firstName).toBe("test");
            expect(users[0].lastName).toBe("manager");
        });

        it("should trim whitespace from email", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "  manager@test.com  ",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(201);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0].email).toBe("manager@test.com");
        });
    });

    describe("Authorization tests", () => {
        it("should return a 403 status code if the user is not an admin", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .set("Cookie", `accessToken=${managerToken}`)
                .send(managerData);

            expect(response.statusCode).toBe(403);
        });

        it("should return a 401 status code if the user is not authenticated", async () => {
            const managerData = {
                firstName: "test",
                lastName: "manager",
                email: "manager@test.com",
                password: "password",
                role: Roles.MANAGER,
            };

            const response = await request(app)
                .post("/users")
                .send(managerData);

            expect(response.statusCode).toBe(401);
        });
    });
});
