import { expressjwt } from "express-jwt";
import JwksRsa from "jwks-rsa";
import type { Request } from "express";
import { Config } from "../config/index.ts";
import type { authCookies } from "../types/index.ts";
console.log(Config.JWKS_URI);

export const authMiddleware = expressjwt({
    secret: JwksRsa.expressJwtSecret({
        jwksUri: Config.JWKS_URI,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
    }),
    algorithms: ["RS256"],
    getToken: (req: Request) => {
        if (
            req.headers.authorization &&
            req.headers.authorization.split(" ")[0] === "Bearer"
        ) {
            return req.headers.authorization.split(" ")[1];
        }

        const { accessToken } = req.cookies as authCookies;

        if (accessToken) {
            return accessToken;
        }
    },
});
