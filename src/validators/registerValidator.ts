import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        notEmpty: {
            errorMessage: "Email is required",
        },
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
