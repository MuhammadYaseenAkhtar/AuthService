// test/users/refresh.spec.ts
import { DataSource } from "typeorm";
import app from "../../src/app.js";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.js";
import { User } from "../../src/entity/User.js";
import { RefreshToken } from "../../src/entity/RefreshToken.js";
import { Roles } from "../../src/constants/index.js";
import jsonwebtoken from "jsonwebtoken";
import { Config } from "../../src/config/index.js";
import { isJwt } from "../utils/index.js";

describe("POST /auth/refresh", () => {
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

    describe("Valid Refresh Token", () => {
        it("should return 200 status with valid refresh token", async () => {
            // Arrange: Create user and refresh token
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // Create refresh token in DB
            const refreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
            });

            // Generate JWT refresh token
            const refreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(refreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(refreshTokenRecord.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.body.message).toContain(user.firstName);
        });

        it("should return new access and refresh tokens in cookies", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const refreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            const refreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(refreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(refreshTokenRecord.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert
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
            expect(isJwt(accessTokenCookie)).toBeTruthy();

            // Check refresh token cookie
            const refreshTokenCookie = cookies!.find((cookie) =>
                cookie.startsWith("refreshToken="),
            );
            expect(refreshTokenCookie).toBeDefined();
            expect(refreshTokenCookie).toMatch(/HttpOnly/);
            expect(isJwt(refreshTokenCookie)).toBeTruthy();
        });

        it("should delete the old refresh token from database", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const oldRefreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            const refreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(oldRefreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(oldRefreshTokenRecord.id),
                },
            );

            // Act
            await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert
            const oldToken = await refreshTokenRepo.findOne({
                where: { id: oldRefreshTokenRecord.id },
            });
            expect(oldToken).toBeNull();
        });

        it("should create a new refresh token in database", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const oldRefreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            const refreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(oldRefreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(oldRefreshTokenRecord.id),
                },
            );

            // Act
            await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert
            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: user.id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
            expect(tokens[0].id).not.toBe(oldRefreshTokenRecord.id);
        });

        it("should maintain single active refresh token per user", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const oldRefreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            const refreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(oldRefreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(oldRefreshTokenRecord.id),
                },
            );

            // Act: Refresh multiple times
            await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert: Should still have only 1 token
            const allTokens = await refreshTokenRepo.find({
                where: { user: { id: user.id } },
            });

            expect(allTokens).toHaveLength(1);
        });
    });

    describe("Invalid Refresh Token", () => {
        it("should return 401 if refresh token is missing", async () => {
            // Act
            const response = await request(app).post("/auth/refresh").send();

            // Assert
            expect(response.status).toBe(401);
        });

        it("should return 401 if refresh token is invalid", async () => {
            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", ["refreshToken=invalid.token.here"])
                .send();

            // Assert
            expect(response.status).toBe(401);
        });

        it("should return 401 if refresh token is expired", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const refreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            // Create expired token
            const expiredRefreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(refreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "-1d", // Already expired
                    issuer: "Auth-Service",
                    jwtid: String(refreshTokenRecord.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${expiredRefreshToken}`])
                .send();

            // Assert
            expect(response.status).toBe(401);
        });

        it("should return 401 if refresh token is revoked (not in database)", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // Create token without DB record (revoked scenario)
            const revokedRefreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: "999", // Non-existent ID
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: "999",
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${revokedRefreshToken}`])
                .send();

            // Assert
            expect(response.status).toBe(401);
        });

        it("should return 400 if user associated with token does not exist", async () => {
            // Arrange

            // Create refresh token without user (simulate deleted user)
            const refreshToken = jsonwebtoken.sign(
                {
                    sub: "999", // Non-existent user
                    role: Roles.CUSTOMER,
                    id: "1",
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: "1",
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert
            expect(response.status).toBe(401); // Will fail at token validation first
        });

        it("should return 401 if refresh token belongs to different user", async () => {
            // Arrange
            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            // Create two users
            const user1 = await userRepository.save({
                firstName: "User",
                lastName: "One",
                email: "user1@gmail.com",
                password: "secret",
                role: Roles.CUSTOMER,
            });

            const user2 = await userRepository.save({
                firstName: "User",
                lastName: "Two",
                email: "user2@gmail.com",
                password: "secret",
                role: Roles.CUSTOMER,
            });

            // Create token for user1
            const refreshTokenRecord = await refreshTokenRepo.save({
                user: user1,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            // Create JWT with user2's ID but token from user1
            const maliciousToken = jsonwebtoken.sign(
                {
                    sub: String(user2.id), // Different user
                    role: user2.role,
                    id: String(refreshTokenRecord.id), // Token belongs to user1
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(refreshTokenRecord.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${maliciousToken}`])
                .send();

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe("Token Reuse Detection", () => {
        it("should reject already used refresh token", async () => {
            // Arrange
            const userData = {
                firstName: "Hassan",
                lastName: "Akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const refreshTokenRecord = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });

            const refreshToken = jsonwebtoken.sign(
                {
                    sub: String(user.id),
                    role: user.role,
                    id: String(refreshTokenRecord.id),
                },
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30d",
                    issuer: "Auth-Service",
                    jwtid: String(refreshTokenRecord.id),
                },
            );

            // Act: Use token first time
            const firstResponse = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            expect(firstResponse.status).toBe(200);

            // Act: Try to reuse same token
            const secondResponse = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send();

            // Assert: Should be rejected
            expect(secondResponse.status).toBe(401);
        });
    });
});
