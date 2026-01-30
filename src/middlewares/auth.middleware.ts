import { expressjwt } from "express-jwt";
import JwksRsa from "jwks-rsa";
import type { Request } from "express";
import { Config } from "../config/index.ts";
import type { authCookies } from "../types/index.ts";

function getAuthSecret() {
    if (process.env.NODE_ENV === "test") {
        // Static public key for CI/tests (RS256)
        // Config.PUBLIC_KEY is base64-encoded, decode it to PEM string
        const key = Buffer.from(Config.PUBLIC_KEY, "base64").toString("utf8");
        return key;
    }

    // Non-test: dynamic JWKS secret
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
            req?.headers?.authorization &&
            req?.headers?.authorization?.split(" ")[0] === "Bearer"
        ) {
            return req.headers.authorization.split(" ")[1];
        }

        const { accessToken } = req.cookies as authCookies;

        if (accessToken) {
            return accessToken;
        }
    },
});
