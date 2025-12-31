import { checkSchema } from "express-validator";

export default checkSchema({
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
