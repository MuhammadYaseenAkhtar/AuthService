import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
describe("GET /auth/me", () => {
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

    describe("Valid Token provided", () => {
        it("should return 200 status", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange

            //Act
            const response = await request(app).get("/auth/me").send();

            //Assert

            expect(response.statusCode).toBe(200);
        });
    });
});
