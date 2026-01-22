import { checkSchema } from "express-validator";

export const getUserByIdValidator = checkSchema({
    userId: {
        in: ["params"],

        notEmpty: {
            errorMessage: "User id is required",
            bail: true,
        },

        isInt: {
            options: { gt: 0 },
            errorMessage: "User id must be a positive integer",
            bail: true,
        },

        toInt: true,
    },
});
