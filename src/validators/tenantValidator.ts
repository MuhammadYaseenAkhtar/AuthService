import { checkSchema } from "express-validator";

export default checkSchema({
    name: {
        trim: true,
        notEmpty: {
            errorMessage: "Tenant name is required",
            bail: true,
        },
        isLength: {
            options: { min: 5, max: 100 },
            errorMessage: "Tenant name must be between 5 and 100 characters",
            bail: true,
        },
        matches: {
            options: /^\p{L}+(?:\s\p{L}+)*$/u,
            errorMessage: "Name must contain only letters and spaces",
        },
    },

    address: {
        trim: true,
        notEmpty: {
            errorMessage: "Tenant address is required",
            bail: true,
        },
        isLength: {
            options: { min: 5, max: 255 },
            errorMessage:
                "Tenant address must be between 10 and 255 characters",
            bail: true,
        },
        matches: {
            options: /^[\p{L}\p{N}]+(?:[\s,\\/-]+[\p{L}\p{N}]+)*$/u,
            errorMessage:
                "Address may contain letters, numbers, spaces, commas, hyphens, and slashes",
        },
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
