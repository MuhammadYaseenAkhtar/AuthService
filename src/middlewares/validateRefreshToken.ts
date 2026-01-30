import { expressjwt } from "express-jwt";
import { Config } from "../config/index.ts";
import type { authCookies, IRefreshTokenPayload } from "../types/index.ts";
import type { Request } from "express";
import { AppDataSource } from "../config/data-source.ts";
import { RefreshToken } from "../entity/RefreshToken.ts";
import logger from "../config/logger.ts";

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET,
    algorithms: ["HS256"],
    getToken: (req: Request) => {
        const { refreshToken } = req.cookies as authCookies;
        if (refreshToken) {
            return refreshToken;
        }
    },
    isRevoked: async (_req, token) => {
        try {
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
            const refreshToken = await refreshTokenRepo.findOne({
                where: {
                    id: Number((token?.payload as IRefreshTokenPayload).id),
                    user: { id: Number(token?.payload.sub) },
                },
            });
            return refreshToken === null;
        } catch {
            logger.error("Error while getting the refresh token");
            return true;
        }
    },
});
