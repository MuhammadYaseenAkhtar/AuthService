import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";

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
                email: "muhammad.YASEEN@Gmail.com",
                password: "secretPassword",
            };

            //Act

            const response = await request(app).post("/auth/login").send(user);

            //Assert
            expect(response.statusCode).toBe(200);
        });
    });
});
