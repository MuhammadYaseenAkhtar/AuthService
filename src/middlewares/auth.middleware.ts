import { expressjwt } from "express-jwt";
import JwksRsa from "jwks-rsa";
import type { Request } from "express";
import { Config } from "../config/index.ts";
import type { authCookies } from "../types/index.ts";
import fs from "fs";
import path from "path";

function getAuthSecret() {
    if (process.env.NODE_ENV === "test") {
        const publicKeyPath = path.resolve(process.cwd(), "certs/public.pem");
        return fs.readFileSync(publicKeyPath, "utf8");
    }

    return JwksRsa.expressJwtSecret({
        jwksUri: Config.JWKS_URI,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
    });
}

export const authMiddleware = expressjwt({
    secret: getAuthSecret(),
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
