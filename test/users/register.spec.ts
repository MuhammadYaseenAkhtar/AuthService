import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { truncateTables } from "../utils/index.ts";
import { User } from "../../src/entity/User.ts";

describe("POST /auth/register", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        //Database truncate
        await truncateTables(connection);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given All fields", () => {
        it("should return 201 status", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "yaseen",
                lastName: "Akhtar",
                email: "yaseen@gmail.com",
                password: "secret",
            };

            //Act

            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "yaseen",
                lastName: "Akhtar",
                email: "yaseen@gmail.com",
                password: "secret",
            };

            //Act

            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });

        it("should persist the user in database", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "yaseen",
                lastName: "akhtar",
                email: "yaseen@gmail.com",
                password: "secret",
            };

            //Act

            await request(app).post("/auth/register").send(user);

            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(user.firstName);
            expect(users[0].lastName).toBe(user.lastName);
            expect(users[0].email).toBe(user.email);
        });
    });

    // describe("Fields are missing", () => {
    //     it("should return 400 status", async () => {});
    // });
});
