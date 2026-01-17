import type { NextFunction, Request, Response } from "express";
import type { authRequest } from "../types/index.ts";
import createHttpError from "http-errors";

export const canAccess = (roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const { auth } = req as authRequest;

        // If auth is missing or role is not allowed, treat it as forbidden
        if (!auth || !auth.role || !roles.includes(auth.role)) {
            const error = createHttpError(
                403,
                "You don't have enough permissions to perform this action",
            );
            next(error);
        }

        return next();
    };
};
