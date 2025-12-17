import { add } from "./src/utils/calculate.ts";
import request from "supertest";
import app from "./src/app.ts";
describe("Testing jest ", () => {
    it("should return correct addition", () => {
        expect(add(1, 2)).toBe(3);
    });

    it("should return 4", () => {
        expect(2 + 2).toBe(4);
    });

    it("should return status code 200", async () => {
        await request(app).get("/").expect(200);
    });
});
