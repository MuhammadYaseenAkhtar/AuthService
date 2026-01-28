/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { DataSource } from "typeorm";
import app from "../../src/app";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import createHttpError from "http-errors";
import jsonwebtoken from "jsonwebtoken";
import { Roles } from "../../src/constants";

describe("PATCH /users/:userId", () => {
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
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();

        // Create tokens for admin and manager
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

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Success cases", () => {
        let customer: User;
        beforeEach(async () => {
            const userRepository = connection.getRepository(User);
            customer = await userRepository.save({
                firstName: "test",
                lastName: "customer",
                email: "customer@test.com",
                password: "password",
                role: Roles.CUSTOMER,
            });
        });

        it("should return a 200 status code and the updated user", async () => {
            const updatedData = {
                firstName: "updated",
            };

            const response = await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.data.firstName).toBe(updatedData.firstName);
        });

        it("should update the user in the database", async () => {
            const updatedData = {
                firstName: "updated",
            };

            await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            const userRepository = connection.getRepository(User);
            const updatedUser = await userRepository.findOne({
                where: { id: customer.id },
            });

            expect(updatedUser?.firstName).toBe(updatedData.firstName);
        });

        it("should be able to update only the lastName", async () => {
            const updatedData = {
                lastName: "updated",
            };

            await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            const userRepository = connection.getRepository(User);
            const updatedUser = await userRepository.findOne({
                where: { id: customer.id },
            });

            expect(updatedUser?.lastName).toBe(updatedData.lastName);
        });

        it("should be able to update only the email", async () => {
            const updatedData = {
                email: "updated@test.com",
            };

            await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            const userRepository = connection.getRepository(User);
            const updatedUser = await userRepository.findOne({
                where: { id: customer.id },
            });

            expect(updatedUser?.email).toBe(updatedData.email);
        });

        it("should be able to update only the role", async () => {
            const updatedData = {
                role: Roles.MANAGER,
            };

            await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            const userRepository = connection.getRepository(User);
            const updatedUser = await userRepository.findOne({
                where: { id: customer.id },
            });

            expect(updatedUser?.role).toBe(updatedData.role);
        });

        it("should be able to update multiple fields", async () => {
            const updatedData = {
                firstName: "updated",
                lastName: "user",
                role: Roles.MANAGER,
            };

            await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            const userRepository = connection.getRepository(User);
            const updatedUser = await userRepository.findOne({
                where: { id: customer.id },
            });

            expect(updatedUser?.firstName).toBe(updatedData.firstName);
            expect(updatedUser?.lastName).toBe(updatedData.lastName);
            expect(updatedUser?.role).toBe(updatedData.role);
        });
    });

    describe("Validation cases", () => {
        let customer: User;
        beforeEach(async () => {
            const userRepository = connection.getRepository(User);
            customer = await userRepository.save({
                firstName: "test",
                lastName: "customer",
                email: "customer@test.com",
                password: "password",
                role: Roles.CUSTOMER,
            });
        });

        it("should return 400 if userId is not a number", async () => {
            const updatedData = {
                firstName: "updated",
            };

            const response = await request(app)
                .patch("/users/invalidId")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(400);
        });

        it("should return 400 if email is invalid", async () => {
            const updatedData = {
                email: "invalid-email",
            };

            const response = await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(400);
        });

        it("should return 400 if role is invalid", async () => {
            const updatedData = {
                role: "invalid-role",
            };

            const response = await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(400);
        });
    });

    describe("Authorization cases", () => {
        let customer: User;
        beforeEach(async () => {
            const userRepository = connection.getRepository(User);
            customer = await userRepository.save({
                firstName: "test",
                lastName: "customer",
                email: "customer@test.com",
                password: "password",
                role: Roles.CUSTOMER,
            });
        });

        it("should return 401 if user is not authenticated", async () => {
            const updatedData = {
                firstName: "updated",
            };

            const response = await request(app)
                .patch(`/users/${customer.id}`)
                .send(updatedData);

            expect(response.status).toBe(401);
        });

        it("should return 403 if user is not an admin", async () => {
            const updatedData = {
                firstName: "updated",
            };

            const response = await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${managerToken}`)
                .send(updatedData);

            expect(response.status).toBe(403);
        });
    });

    describe("Not Found case", () => {
        it("should return 404 if userId does not exist", async () => {
            const updatedData = {
                firstName: "updated",
            };

            const response = await request(app)
                .patch("/users/999")
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(404);
        });
    });

    describe("Conflict case", () => {
        let customer: User;
        let anotherUser: User;
        beforeEach(async () => {
            const userRepository = connection.getRepository(User);
            customer = await userRepository.save({
                firstName: "test",
                lastName: "customer",
                email: "customer@test.com",
                password: "password",
                role: Roles.CUSTOMER,
            });

            anotherUser = await userRepository.save({
                firstName: "another",
                lastName: "user",
                email: "another@test.com",
                password: "password",
                role: Roles.CUSTOMER,
            });
        });

        it("should return 400 if email is already in use by another user", async () => {
            const updatedData = {
                email: anotherUser.email,
            };

            const response = await request(app)
                .patch(`/users/${customer.id}`)
                .set("Cookie", `accessToken=${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(400);
        });
    });
});
