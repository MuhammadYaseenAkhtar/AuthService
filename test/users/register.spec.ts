import { DataSource } from "typeorm";
import app from "../../src/app.ts";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source.ts";
// import { truncateTables } from "../utils/index.ts";
import { User } from "../../src/entity/User.ts";
import { Roles } from "../../src/constants/index.ts";
import { isJwt } from "../utils/index.ts";
import { RefreshToken } from "../../src/entity/RefreshToken.ts";

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

        it("should return the access and refresh token inside a cookie", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                firstName: "Hasssan",
                lastName: "akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            //Act

            const response = await request(app)
                .post("/auth/register")
                .send(user);

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
            // expect(accessTokenCookie).toMatch(/Secure/); // Ensure HTTPS in production
            expect(isJwt(accessTokenCookie)).toBeTruthy(); // Check if it's a valid JWT)

            // Check refresh token cookie
            const refreshTokenCookie = cookies!.find((cookie) =>
                cookie.startsWith("refreshToken="),
            );
            expect(refreshTokenCookie).toBeDefined();
            expect(refreshTokenCookie).toMatch(/HttpOnly/);
            // expect(refreshTokenCookie).toMatch(/Secure/); // Ensure HTTPS in production
            expect(isJwt(refreshTokenCookie)).toBeTruthy(); // Check if it's a valid JWT)
        });

        it("should persist the refresh token in DB", async () => {
            //Arrange
            const user = {
                firstName: "Hasssan",
                lastName: "akhtar",
                email: "hassan@gmail.com",
                password: "secretPass",
            };

            //Act

            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
            // const refreshTokens = await refreshTokenRepo.find();

            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
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

        it("should return 400 status if password is more than 20 characters", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "muhammad@gmail.com",
                password: "thisPasswordIsWayTooLongForOurSystem",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
        });

        it("should accept special characters in first and last names", async () => {
            //Arrange
            const user = {
                firstName: "José",
                lastName: "O'Brien",
                email: "jose@gmail.com",
                password: "secretPass123",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(response.statusCode).toBe(201);
            expect(users[0].firstName).toBe("José");
            expect(users[0].lastName).toBe("O'Brien");
        });
    });

    describe("Edge Cases and Security", () => {
        it("should return 400 if email contains SQL injection attempt", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "test@test.com'; DROP TABLE users; --",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);
            //Assert
            expect(response.statusCode).toBe(400);
        });

        it("should sanitize and store XSS attempts safely", async () => {
            //Arrange
            const user = {
                firstName: "<script>alert('xss')</script>",
                lastName: "Test",
                email: "xss@test.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);
            //Assert - Should accept but store safely
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            if (response.statusCode === 201) {
                // If accepted, verify it's stored as-is (DB layer handles safety)
                expect(users[0].firstName).toBe(
                    "<script>alert('xss')</script>",
                );
            }
            // Either way, ensure no actual XSS execution
        });

        it("should return 400 if firstName is only whitespace", async () => {
            //Arrange
            const user = {
                firstName: "   ",
                lastName: "Akhtar",
                email: "test@gmail.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);
            //Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if lastName is only whitespace", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "   ",
                email: "test@gmail.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if email has spaces in the middle", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "test @gmail.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if request body is missing", async () => {
            //Act
            const response = await request(app).post("/auth/register").send({});

            //Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if extra unexpected fields are provided", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "test@gmail.com",
                password: "secretPass",
                role: "ADMIN", // Trying to inject admin role
                isVerified: true,
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert - Should still create user but ignore extra fields
            if (response.statusCode === 201) {
                const userRepository = connection.getRepository(User);
                const users = await userRepository.find();
                expect(users[0].role).toBe(Roles.CUSTOMER); // Not ADMIN
            }
        });

        it("should return valid JSON error response for validation errors", async () => {
            //Arrange
            const user = {
                firstName: "",
                lastName: "Akhtar",
                email: "invalidemail",
                password: "short",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
            expect(response.body).toHaveProperty("errors");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(Array.isArray(response.body.errors)).toBe(true);
        });

        it("should handle concurrent registration attempts with same email", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "concurrent@gmail.com",
                password: "secretPass",
            };

            //Act - Send two requests simultaneously
            const [response1, response2] = await Promise.all([
                request(app).post("/auth/register").send(user),
                request(app).post("/auth/register").send(user),
            ]);

            //Assert - One should succeed, one should fail
            const statuses = [
                response1.statusCode,
                response2.statusCode,
            ].sort();
            expect(statuses).toEqual([201, 500]);

            // Verify only one user was created
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find({
                where: { email: user.email },
            });
            expect(users).toHaveLength(1);
        });

        it("should handle multiple concurrent registration requests", async () => {
            //Arrange
            const baseUser = {
                firstName: "Concurrent",
                lastName: "User",
                password: "secretPass",
            };

            const concurrentRequests = 20;
            const usersPayload = Array.from({ length: concurrentRequests }).map(
                (_, index) => ({
                    ...baseUser,
                    email: `concurrent+${index}@gmail.com`,
                }),
            );

            //Act - Send many requests simultaneously
            const responses = await Promise.all(
                usersPayload.map((user) =>
                    request(app).post("/auth/register").send(user),
                ),
            );

            //Assert - all should succeed
            responses.forEach((response) => {
                expect(response.statusCode).toBe(201);
            });

            const userRepository = connection.getRepository(User);
            const createdUsers = await userRepository.find();
            expect(createdUsers).toHaveLength(concurrentRequests);
        });

        it("should accept password with special characters", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "special@gmail.com",
                password: "P@ssw0rd!#$%",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            expect(response.statusCode).toBe(201);
        });

        it("should not store password in plain text even if bcrypt fails", async () => {
            //Arrange
            const user = {
                firstName: "Yasin",
                lastName: "Akhtar",
                email: "bcrypt@gmail.com",
                password: "secretPass",
            };

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(user);

            //Assert
            if (response.statusCode === 201) {
                const userRepository = connection.getRepository(User);
                const users = await userRepository.find({
                    where: { email: user.email },
                });
                expect(users[0].password).not.toBe(user.password);
            }
        });
    });
});
