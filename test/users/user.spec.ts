import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { createJWKSMock } from "mock-jwks";
import { AppDataSource } from "../../src/config/data-source.ts";
import { User } from "../../src/entity/User.ts";
import { Roles } from "../../src/constants/index.ts";

describe("GET /auth/me", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:1717");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        //start jwks server
        jwks.start();
        //Database drop
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        //stop jwks server
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Valid Token provided", () => {
        it("should return 200 status", async () => {
            //Arrange
            // (1) --> Register User
            const user = {
                firstName: "Hasssan",
                lastName: "akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            const registeredUser = await userRepository.save({
                ...user,
                role: Roles.CUSTOMER,
            });

            // (2) --> Generate Token
            const accessToken = jwks.token({
                sub: String(registeredUser.id),
                role: registeredUser.role,
            });
            //Act
            const response = await request(app)
                .get("/auth/me")
                .set("Cookie", [`accessToken = ${accessToken}`])
                .send();

            //Assert
            //check if user id matches with registered user
            expect((response.body as Record<string, string>).id).toBe(
                registeredUser.id,
            );
        });
    });
});
