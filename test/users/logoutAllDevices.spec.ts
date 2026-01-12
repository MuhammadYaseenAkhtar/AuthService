import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { User } from "../../src/entity/User.ts";
import { RefreshToken } from "../../src/entity/RefreshToken.ts";

describe("POST /auth/logoutAllDevices", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    it("should log out from all devices, clear cookies and delete all refresh tokens for the user", async () => {
        // Arrange - create a user and log in twice (two devices)
        const userPayload = {
            firstName: "Yasin",
            lastName: "Akhtar",
            email: "logout-all@test.com",
            password: "secretPass",
        };

        // First device: register (also logs in)
        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userPayload);

        expect(registerResponse.statusCode).toBe(201);

        // Second device: login again with same credentials
        const loginResponse = await request(app).post("/auth/login").send({
            email: userPayload.email,
            password: userPayload.password,
        });

        expect(loginResponse.statusCode).toBe(200);

        // Check that there are multiple refresh tokens for this user
        const userRepository = connection.getRepository(User);
        const createdUser = await userRepository.findOne({
            where: { email: userPayload.email },
        });

        expect(createdUser).not.toBeNull();

        const refreshTokenRepo = connection.getRepository(RefreshToken);
        const tokensBefore = await refreshTokenRepo.find({
            where: { user: { id: createdUser!.id } },
        });

        expect(tokensBefore.length).toBeGreaterThanOrEqual(2);

        // Use cookies from one of the sessions to call logoutAllDevices
        const cookies = registerResponse.headers["set-cookie"] as unknown as
            | string[]
            | undefined;
        expect(cookies).toBeDefined();

        // Act
        const logoutAllResponse = await request(app)
            .post("/auth/logoutAllDevices")
            .set("Cookie", cookies as string[])
            .send();

        // Assert - status and message
        expect(logoutAllResponse.statusCode).toBe(200);
        expect(logoutAllResponse.body).toHaveProperty("message");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(logoutAllResponse.body.message).toBe(
            "You've logged out from all devices successfully",
        );

        // Assert - cookies are cleared (accessToken & refreshToken)
        const logoutCookies = logoutAllResponse.headers[
            "set-cookie"
        ] as unknown as string[] | undefined;
        expect(logoutCookies).toBeDefined();

        const clearedAccessCookie = logoutCookies!.find((cookie) =>
            cookie.startsWith("accessToken="),
        );
        const clearedRefreshCookie = logoutCookies!.find((cookie) =>
            cookie.startsWith("refreshToken="),
        );

        expect(clearedAccessCookie).toBeDefined();
        expect(clearedRefreshCookie).toBeDefined();
        expect(clearedAccessCookie).toMatch(/Expires=/);
        expect(clearedRefreshCookie).toMatch(/Expires=/);

        // Assert - all refresh tokens for this user are deleted
        const tokensAfter = await refreshTokenRepo.find({
            where: { user: { id: createdUser!.id } },
        });
        expect(tokensAfter.length).toBe(0);
    });

    it("should return 401 if user is not authenticated", async () => {
        const response = await request(app)
            .post("/auth/logoutAllDevices")
            .send();

        expect(response.statusCode).toBe(401);
    });

    it("should return 401 if refresh token is missing", async () => {
        // Arrange: have a valid user and access token via register, but drop refresh cookie
        const userPayload = {
            firstName: "Yasin",
            lastName: "Akhtar",
            email: "logout-all-missing-refresh@test.com",
            password: "secretPass",
        };

        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userPayload);

        expect(registerResponse.statusCode).toBe(201);

        const cookies = (registerResponse.headers["set-cookie"] ||
            []) as string[];

        const accessTokenCookie = cookies.find((cookie) =>
            cookie.startsWith("accessToken="),
        );

        // Act: call logoutAllDevices with only access token cookie (no refreshToken)
        const response = await request(app)
            .post("/auth/logoutAllDevices")
            .set("Cookie", accessTokenCookie ? [accessTokenCookie] : [])
            .send();

        // parseRefreshToken / refresh-token auth should reject the request
        expect(response.statusCode).toBe(401);
    });

    it("should delete only the current user's refresh tokens and not affect other users", async () => {
        // Arrange: create two users, each with their own refresh tokens
        const user1Payload = {
            firstName: "User",
            lastName: "One",
            email: "user1@test.com",
            password: "secretPass1",
        };

        const user2Payload = {
            firstName: "User",
            lastName: "Two",
            email: "user2@test.com",
            password: "secretPass2",
        };

        // Register user1
        const user1RegisterResponse = await request(app)
            .post("/auth/register")
            .send(user1Payload);
        expect(user1RegisterResponse.statusCode).toBe(201);

        // Register user2
        const user2RegisterResponse = await request(app)
            .post("/auth/register")
            .send(user2Payload);
        expect(user2RegisterResponse.statusCode).toBe(201);

        const userRepository = connection.getRepository(User);
        const user1 = await userRepository.findOne({
            where: { email: user1Payload.email },
        });
        const user2 = await userRepository.findOne({
            where: { email: user2Payload.email },
        });

        expect(user1).not.toBeNull();
        expect(user2).not.toBeNull();

        const refreshTokenRepo = connection.getRepository(RefreshToken);

        // Ensure each user has at least one refresh token
        const user1TokensBefore = await refreshTokenRepo.find({
            where: { user: { id: user1!.id } },
        });
        const user2TokensBefore = await refreshTokenRepo.find({
            where: { user: { id: user2!.id } },
        });

        expect(user1TokensBefore.length).toBeGreaterThanOrEqual(1);
        expect(user2TokensBefore.length).toBeGreaterThanOrEqual(1);

        // Use user1's cookies to call logoutAllDevices
        const user1Cookies = user1RegisterResponse.headers[
            "set-cookie"
        ] as unknown as string[] | undefined;
        expect(user1Cookies).toBeDefined();

        const logoutAllResponse = await request(app)
            .post("/auth/logoutAllDevices")
            .set("Cookie", user1Cookies as string[])
            .send();

        expect(logoutAllResponse.statusCode).toBe(200);

        // Assert: user1's tokens are deleted
        const user1TokensAfter = await refreshTokenRepo.find({
            where: { user: { id: user1!.id } },
        });
        expect(user1TokensAfter.length).toBe(0);

        // Assert: user2's tokens are still there
        const user2TokensAfter = await refreshTokenRepo.find({
            where: { user: { id: user2!.id } },
        });
        expect(user2TokensAfter.length).toBe(user2TokensBefore.length);
    });
});
