// test/users/user.spec.ts
import { DataSource } from "typeorm";
import app from "../../src/app.js";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.js";
import { User } from "../../src/entity/User.js";
import { Roles } from "../../src/constants/index.js";
import jsonwebtoken from "jsonwebtoken";
import fs from "fs";
import path from "path";
import createHttpError from "http-errors";

describe("GET /auth/me", () => {
    let connection: DataSource;
    let privateKey: string;

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
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Token Verification", () => {
        it("should return 200 status if token is valid", async () => {
            // Arrange: Register User
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const registeredUser = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // Act: Generate REAL RS256 token
            const accessToken = jsonwebtoken.sign(
                {
                    sub: String(registeredUser.id),
                    role: registeredUser.role,
                },
                privateKey,
                {
                    algorithm: "RS256",
                    expiresIn: "1h",
                    issuer: "auth-service",
                },
            );

            const response = await request(app)
                .get("/auth/me")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            // Assert

            expect(response.status).toBe(200);
            expect((response.body as Record<string, string>).id).toBe(
                registeredUser.id,
            );
        });

        it("should not return password field in user response", async () => {
            // Arrange: Register User
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);

            const registeredUser = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // Act: Generate REAL RS256 token
            const accessToken = jsonwebtoken.sign(
                {
                    sub: String(registeredUser.id),
                    role: registeredUser.role,
                },
                privateKey,
                {
                    algorithm: "RS256",
                    expiresIn: "1h",
                    issuer: "auth-service",
                },
            );

            const response = await request(app)
                .get("/auth/me")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            // Assert: Status
            expect(response.status).toBe(200);
            console.log("response.body", response.body);
            // Assert: Core identity fields
            expect(response.body).toMatchObject({
                id: registeredUser.id,
                email: registeredUser.email,
                role: registeredUser.role,
            });

            // Assert: Password MUST NOT be present
            expect(response.body).not.toHaveProperty("password");

            // Extra hardening: no accidental leakage
            expect(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                Object.keys(response.body).some((key) =>
                    key.toLowerCase().includes("password"),
                ),
            ).toBe(false);
        });

        it("should return 401 if token is invalid", async () => {
            const response = await request(app)
                .get("/auth/me")
                .set("Cookie", [`accessToken=invalid.token.here`])
                .send();

            expect(response.status).toBe(401);
        });

        it("should return 401 if no token provided", async () => {
            const response = await request(app).get("/auth/me").send();

            expect(response.status).toBe(401);
        });
    });
});
