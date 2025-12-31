import { checkSchema } from "express-validator";

export default checkSchema({
    firstName: {
        notEmpty: {
            errorMessage: "First Name is required",
        },
        trim: true,
    },

    lastName: {
        notEmpty: {
            errorMessage: "Last Name is required",
        },
        trim: true,
    },

    password: {
        notEmpty: {
            errorMessage: "Password is required",
            bail: true,
        },
        isLength: {
            options: { min: 8, max: 20 },
            errorMessage: "Password must be between 8 and 20 characters",
        },
    },

    email: {
        notEmpty: {
            errorMessage: "Email is required",
        },
        trim: true,
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
