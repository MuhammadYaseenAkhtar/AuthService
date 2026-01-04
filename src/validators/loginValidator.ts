import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        notEmpty: {
            errorMessage: "Email is required",
            bail: true,
        },
        trim: true,
        isEmail: {
            errorMessage: "Invalid email format",
        },
        normalizeEmail: true, // safe normalization
    },

    password: {
        notEmpty: {
            errorMessage: "Password is required",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
