import { checkSchema } from "express-validator";

export default checkSchema({
    firstName: {
        optional: true,
        trim: true,
        notEmpty: {
            errorMessage: "First Name is required",
            bail: true,
        },
    },

    lastName: {
        optional: true,
        trim: true,
        notEmpty: {
            errorMessage: "Last Name is required",
            bail: true,
        },
    },

    email: {
        optional: true,
        trim: true,
        notEmpty: {
            errorMessage: "Email is required",
            bail: true,
        },
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },

    role: {
        optional: true,
        notEmpty: {
            errorMessage: "Role is required",
        },
        isIn: {
            options: [["customer", "admin", "manager"]],
            errorMessage: "Invalid role specified",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
