import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { User } from "../../src/entity/User.ts";
import { RefreshToken } from "../../src/entity/RefreshToken.ts";

describe("POST /auth/logout", () => {
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

    it("should log out successfully, clear auth cookies and delete refresh token", async () => {
        // Arrange - create a user and log in (via register to get cookies + refresh token)
        const userPayload = {
            firstName: "Yasin",
            lastName: "Akhtar",
            email: "logout@test.com",
            password: "secretPass",
        };

        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userPayload);

        expect(registerResponse.statusCode).toBe(201);

        const userRepository = connection.getRepository(User);
        const createdUser = await userRepository.findOne({
            where: { email: userPayload.email },
        });

        expect(createdUser).not.toBeNull();

        const refreshTokenRepo = connection.getRepository(RefreshToken);
        const tokensBefore = await refreshTokenRepo.find({
            where: { user: { id: createdUser!.id } },
        });
        expect(tokensBefore.length).toBe(1);

        const cookies = registerResponse.headers["set-cookie"] as unknown as
            | string[]
            | undefined;
        expect(cookies).toBeDefined();

        // Act - hit logout with the same cookies
        const logoutResponse = await request(app)
            .post("/auth/logout")
            .set("Cookie", cookies as string[])
            .send();

        // Assert - status and message
        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.body).toHaveProperty("message");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(logoutResponse.body.message).toBe(
            "You've logged out successfully",
        );

        // Assert - cookies are cleared (accessToken & refreshToken)
        const logoutCookies = logoutResponse.headers[
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

        // Typically clearCookie sets an expired cookie; ensure no JWT-like value remains
        expect(clearedAccessCookie).toMatch(/Expires=/);
        expect(clearedRefreshCookie).toMatch(/Expires=/);

        // Assert - refresh token is deleted from DB
        const tokensAfter = await refreshTokenRepo.find({
            where: { user: { id: createdUser!.id } },
        });
        expect(tokensAfter.length).toBe(0);
    });

    it("should return 401 if user is not authenticated", async () => {
        const response = await request(app).post("/auth/logout").send();

        expect(response.statusCode).toBe(401);
    });

    it("should return 401 if refresh token is missing", async () => {
        // Arrange: have a valid user and access token via register, but drop refresh cookie
        const userPayload = {
            firstName: "Yasin",
            lastName: "Akhtar",
            email: "missing-refresh@test.com",
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

        // Act: call logout with only access token cookie (no refreshToken)
        const response = await request(app)
            .post("/auth/logout")
            .set("Cookie", accessTokenCookie ? [accessTokenCookie] : [])
            .send();

        // express-jwt for refresh token should reject the request
        expect(response.statusCode).toBe(401);
    });
});
