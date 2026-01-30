import jwt, { type JwtPayload } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config/index.ts";
import { RefreshToken } from "../entity/RefreshToken.ts";
import type { User } from "../entity/User.ts";
import type { Repository } from "typeorm";

export class TokenService {
    constructor(private readonly refreshTokenRepo: Repository<RefreshToken>) {}
    generateAccessToken(payload: JwtPayload) {
        //private key for accessToken
        let privateKey: string;
        try {
            privateKey = Buffer.from(Config.PRIVATE_KEY, "base64").toString(
                "utf8",
            );
        } catch (err) {
            throw createHttpError(
                500,
                `Private key is not configured correctly`,
                { cause: err },
            );
        }
        //Sign Access Token
        const accessToken = jwt.sign(payload, privateKey, {
            algorithm: "RS256",
            issuer: "Auth-Service",
            expiresIn: "1h",
        });

        return accessToken;
    }

    generateRefreshToken(payload: JwtPayload) {
        //Sign Refresh Token
        const refreshToken = jwt.sign(payload, Config.REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "30D",
            issuer: "Auth-Service",
            jwtid: String(payload.id),
        });
        return refreshToken;
    }

    async persistRefreshToken(user: User) {
        //persist the refresh token in DB
        const milliSecondsInYear = 1000 * 60 * 60 * 24 * 365; //1 Year

        const newRefreshToken = await this.refreshTokenRepo.save({
            user: user,
            expiresAt: new Date(Date.now() + milliSecondsInYear),
        });

        return newRefreshToken;
    }

    async deleteOldRefreshToken(id: number) {
        await this.refreshTokenRepo.delete({ id });
    }
    async deleteAllRefreshTokens(userId: number) {
        const allDevices = await this.refreshTokenRepo.find({
            where: { user: { id: userId } },
        });

        if (allDevices.length === 0) {
            return;
        }

        await this.refreshTokenRepo.delete({ user: { id: userId } });
    }
}
