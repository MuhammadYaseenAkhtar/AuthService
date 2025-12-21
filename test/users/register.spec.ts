import app from "../../src/app.ts";
import request from "supertest";
describe("POST /auth/register", () => {
    describe("Given All fields", () => {
        it("should return 201 status", async () => {
            //AAA rule => Arrange, Act, Assert

            //Arrange
            const user = {
                name: "yaseen",
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
    });

    // describe("Fields are missing", () => {
    //     it("should return 400 status", async () => {});
    // });
});
