/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import path from "path";
import fs from "fs";
import { DataSource, type Repository } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants/index.ts";
import { User } from "../../src/entity/User.ts";

describe("GET /users", () => {
    let connection: DataSource;
    let privateKey: string;
    let adminToken: string;
    let managerToken: string;
    let customerToken: string;
    let userRepository: Repository<User>;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
        userRepository = connection.getRepository(User);

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

        adminToken = jsonwebtoken.sign(
            { sub: "1", role: Roles.ADMIN },
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            },
        );

        managerToken = jsonwebtoken.sign(
            { sub: "2", role: Roles.MANAGER },
            privateKey,
            {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            },
        );

        customerToken = jsonwebtoken.sign(
            { sub: "3", role: Roles.CUSTOMER },
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

    describe("Authorization", () => {
        it("should return 401 if user is not authenticated", async () => {
            const response = await request(app).get("/users").send();
            expect(response.status).toBe(401);
        });

        it("should return 403 if user is a manager", async () => {
            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${managerToken}`])
                .send();
            expect(response.status).toBe(403);
        });

        it("should return 403 if user is a customer", async () => {
            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${customerToken}`])
                .send();
            expect(response.status).toBe(403);
        });
    });

    describe("As an Admin", () => {
        it("should return 200 and an empty array when no users exist", async () => {
            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        it("should return 200 and a list of users when users exist", async () => {
            await userRepository.save([
                {
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    password: "password123",
                    role: Roles.CUSTOMER,
                },
                {
                    firstName: "Jane",
                    lastName: "Doe",
                    email: "jane.doe@example.com",
                    password: "password123",
                    role: Roles.MANAGER,
                },
            ]);

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].email).toBe("john.doe@example.com");
            expect(response.body.data[1].email).toBe("jane.doe@example.com");
        });

        it("should not return password field in the user objects", async () => {
            await userRepository.save([
                {
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    password: "password123",
                    role: Roles.CUSTOMER,
                },
            ]);

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminToken}`])
                .send();

            expect(response.status).toBe(200);
            expect(response.body.data[0]).not.toHaveProperty("password");
        });
    });
});
