/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { User } from "../../src/entity/User.ts";
import { Roles } from "../../src/constants/index.ts";
import bcrypt from "bcrypt";
import { isJwt } from "../utils/index.ts";

describe("POST /auth/login", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        //Database drop
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given All fields", () => {
        it("should return 200 status", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                email: "yaseen@gmail.com",
                password: "secretPassword",
            };

            const hashedPassword = await bcrypt.hash(user.password, 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...user,
                firstName: "Yaseen",
                lastName: "Akhtar",
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
            const users = await userRepository.find();

            //Act
            const response = await request(app).post("/auth/login").send(user);

            //Assert

            expect(response.statusCode).toBe(200);
            expect(users).toHaveLength(1);
        });

        it("should return the access and refresh token inside a cookie", async () => {
            //Arrange
            const user = {
                email: "yaseen@gmail.com",
                password: "secretPassword",
            };

            const hashedPassword = await bcrypt.hash(user.password, 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...user,
                firstName: "Yaseen",
                lastName: "Akhtar",
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
            await userRepository.find();

            //Act
            const response = await request(app).post("/auth/login").send(user);

            //assert

            const cookies: string[] | undefined = response.headers[
                "set-cookie"
            ] as unknown as string[] | undefined;
            expect(cookies).toBeDefined();
            expect(cookies!.length).toBeGreaterThanOrEqual(2);

            // Check access token cookie
            const accessTokenCookie = cookies!.find((cookie) =>
                cookie.startsWith("accessToken="),
            );
            expect(accessTokenCookie).toBeDefined();
            expect(accessTokenCookie).toMatch(/HttpOnly/);
            // expect(accessTokenCookie).toMatch(/Secure/); // Ensure HTTPS in production
            expect(isJwt(accessTokenCookie)).toBeTruthy(); // Check if it's a valid JWT)

            // Check refresh token cookie
            const refreshTokenCookie = cookies!.find((cookie) =>
                cookie.startsWith("refreshToken="),
            );
            expect(refreshTokenCookie).toBeDefined();
            expect(refreshTokenCookie).toMatch(/HttpOnly/);
            // expect(refreshTokenCookie).toMatch(/Secure/); // Ensure HTTPS in production
            expect(isJwt(refreshTokenCookie)).toBeTruthy(); // Check if it's a valid JWT)
        });
    });

    describe("Given invalid request body", () => {
        it("should return 400 when email is missing", async () => {
            const payload = {
                password: "secretPassword",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = response.body.errors.map(
                (error: { msg: string }) => error.msg,
            );

            expect(messages).toContain("Email is required");
        });

        it("should return 400 when password is missing", async () => {
            const payload = {
                email: "yaseen@gmail.com",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = response.body.errors.map(
                (error: { msg: string }) => error.msg,
            );

            expect(messages).toContain("Password is required");
        });

        it("should return 400 when email has invalid format", async () => {
            const payload = {
                email: "not-an-email",
                password: "secretPassword",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = response.body.errors.map(
                (error: { msg: string }) => error.msg,
            );

            expect(messages).toContain("Invalid email format");
        });
    });

    describe("Given wrong credentials", () => {
        it("should return 400 when user with email does not exist", async () => {
            const payload = {
                email: "doesnotexist@example.com",
                password: "somePassword",
            };

            const response = await request(app)
                .post("/auth/login")
                .send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = response.body.errors.map(
                (error: { msg: string }) => error.msg,
            );

            expect(messages).toContain(
                "Invalid Credentials! Try Again please.",
            );
        });

        it("should return 400 when password is incorrect", async () => {
            const user = {
                email: "yaseen@gmail.com",
                password: "secretPassword",
            };

            const hashedPassword = await bcrypt.hash("anotherPassword", 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...user,
                firstName: "Yaseen",
                lastName: "Akhtar",
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .post("/auth/login")
                .send({ ...user, password: "wrongPassword" });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("errors");
            expect(Array.isArray(response.body.errors)).toBe(true);

            const messages = response.body.errors.map(
                (error: { msg: string }) => error.msg,
            );

            expect(messages).toContain(
                "Invalid Credentials! Try Again please.",
            );
        });
    });
});
