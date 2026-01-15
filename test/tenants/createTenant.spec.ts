import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";

describe("POST /tenant", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        //Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given All fields", () => {
        it("should return 201 status", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: ":Tenant Name",
                address: "Tenant Address",
            };

            //Act

            const response = await request(app)
                .post("/tenant")
                .send(tenantData);

            //Assert
            expect(response.statusCode).toBe(201);
        });
    });
});
