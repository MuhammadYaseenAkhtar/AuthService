import { add } from "./src/utils/calculate.ts";

describe("Testing jest ", () => {
    it("should return correct addition", () => {
        expect(add(1, 2)).toBe(3);
    });

    it("should return 4", () => {
        expect(2 + 2).toBe(4);
    });
});
