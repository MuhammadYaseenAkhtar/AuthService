import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { Tenant } from "../../src/entity/Tenant.ts";

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
        it("should return 201 status code", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: ":Tenant Name",
                address: "Tenant Address",
            };

            //Act

            const response = await request(app)
                .post("/tenants")
                .send(tenantData);

            //Assert
            expect(response.statusCode).toBe(201);
        });

        it("should create a tenant in the database", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const tenantData = {
                name: ":Tenant Name",
                address: "Tenant Address",
            };

            //Act

            await request(app).post("/tenants").send(tenantData);

            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find();

            //Assert
            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenantData.name);
        });
    });
});
