import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
// import { truncateTables } from "../utils/index.ts";
import { User } from "../../src/entity/User.ts";
import { Roles } from "../../src/constants/index.ts";

describe("POST /auth/register", () => {
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
            const user = {
                firstName: "yaseen",
                lastName: "Akhtar",
                email: "yaseen@gmail.com",
                password: "secretPassword",
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
                firstName: "HASSAN",
                lastName: "akhtar",
                email: "yaseen@gmail.com",
                password: "secretPassword",
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

        it("should return the ID of newly created User", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "HASSAN",
                lastName: "akhtar",
                email: "yaseen@gmail.com",
                password: "secretPassword",
            };

            //Act

            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(typeof response.body.id).toBe("number");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(users[0].id).toBe(response.body.id);
        });

        it("should assign a cutomer role", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "HASSAN",
                lastName: "akhtar",
                email: "yaseen@gmail.com",
                password: "secretPassword",
            };

            //Act

            await request(app).post("/auth/register").send(user);

            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hashed password in the DB", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "Hasssan",
                lastName: "akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            //Act

            await request(app).post("/auth/register").send(user);

            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0].password).not.toBe(user.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it("should return 400 status code if email is already exists", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "Hasssan",
                lastName: "akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...user, role: Roles.CUSTOMER });
            const users = await userRepository.find();

            //Act

            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
    });

    describe("Fields are missing", () => {
        it("should return 400 status if email field is missing", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "",
                password: "secretPass",
            };

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it("should return 400 status if first name is missing", async () => {
            //Arrange
            const user = {
                firstName: "",
                lastName: "Akhtar",
                email: "yaseen@gmail.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it("should return 400 status if last name is missing", async () => {
            //Arrange
            const user = {
                firstName: "Yaseen",
                lastName: "",
                email: "yaseen@gmail.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it("should return 400 status if password is missing", async () => {
            //Arrange
            const user = {
                firstName: "Yaseen",
                lastName: "akhtar",
                email: "yaseen@gmail.com",
                password: "",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });

    describe("Fields are not in proper format", () => {
        it("should trim the email field", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "      yaseen@gmail.com       ",
                password: "secretPass",
            };

            //Act
            await request(app)
                .post("/auth/register")
                .send({ ...user, role: Roles.CUSTOMER });

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Assert
            expect(users[0].email).toBe("yaseen@gmail.com");
        });

        it("should return 400 status if email format is invalid", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "muhammadgmail.com",
                password: "secretPass",
            };

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it("should return 400 status if password is less than 8 characters", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "muhammad@gmail.com",
                password: "da",
            };

            //getting user repository.
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);
            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });
});
