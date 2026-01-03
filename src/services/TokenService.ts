import fs from "fs";
import path from "path";
import jwt, { type JwtPayload } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config/index.ts";

export class TokenService {
    generateAccessToken(payload: JwtPayload) {
        //private key for accessToken
        let privateKey: string;
        try {
            privateKey = fs.readFileSync(
                path.resolve(process.cwd(), "certs/private.pem"),
                "utf8",
            );
        } catch (err) {
            throw createHttpError(
                500,
                "Private key is not configured correctly",
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
}
