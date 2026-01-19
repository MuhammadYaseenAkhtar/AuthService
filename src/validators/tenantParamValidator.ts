import { checkSchema } from "express-validator";

export const getTenantByIdValidator = checkSchema({
    tenantId: {
        in: ["params"],

        notEmpty: {
            errorMessage: "Tenant id is required",
            bail: true,
        },

        isInt: {
            options: { gt: 0 },
            errorMessage: "Tenant id must be a positive integer",
            bail: true,
        },

        toInt: true,
    },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
