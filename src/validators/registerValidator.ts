import { checkSchema } from "express-validator";

export default checkSchema({
    firstName: {
        trim: true,
        notEmpty: {
            errorMessage: "First Name is required",
        },
    },

    lastName: {
        trim: true,
        notEmpty: {
            errorMessage: "Last Name is required",
        },
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
        trim: true,
        notEmpty: {
            errorMessage: "Email is required",
            bail: true,
        },
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
