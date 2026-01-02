import fs from "fs";
import path from "path";
import jwt, { type JwtPayload } from "jsonwebtoken";
import createHttpError from "http-errors";

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
}
