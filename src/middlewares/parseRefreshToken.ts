import { expressjwt } from "express-jwt";
import { Config } from "../config/index.ts";
import type { authCookies } from "../types/index.ts";
import type { Request } from "express";
export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET,
    algorithms: ["HS256"],
    getToken: (req: Request) => {
        const { refreshToken } = req.cookies as authCookies;
        if (refreshToken) {
            return refreshToken;
        }
    },
});
