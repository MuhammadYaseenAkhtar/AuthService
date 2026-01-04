import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
import { User } from "../../src/entity/User.ts";
import { Roles } from "../../src/constants/index.ts";
import bcrypt from "bcrypt";

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
                email: "yaseen@gmail.com",
                password: "secretPassword",
            };

            const hashedPassword = await bcrypt.hash(user.password, 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...user,
                firstName: "Yaseen",
                lastName: "Akhtar",
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
            const users = await userRepository.find();

            //Act
            const response = await request(app).post("/auth/login").send(user);

            //Assert

            expect(response.statusCode).toBe(200);
            expect(users).toHaveLength(1);
        });
    });
});
