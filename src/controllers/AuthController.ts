import fs from "fs";
import path from "path";
import type { NextFunction, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RegisterUserRequest } from "../types/index.ts";
import type { UserService } from "../services/UserService.ts";
import type { Logger } from "winston";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { Config } from "../config/index.ts";
import { AppDataSource } from "../config/data-source.ts";
import { RefreshToken } from "../entity/RefreshToken.ts";
export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}
    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            //validate request using express-validator.
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }
            //get data from body
            const { firstName, lastName, email, password } = req.body;

            //check if email is already exist in Db
            const emailExists = await this.userService.checkEmail(email);
            if (emailExists) {
                const error = createHttpError(
                    400,
                    "User with this email already exists!",
                );
                throw error;
            }

            //Call userService's create method
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            //logging
            this.logger.info(
                `User ${user.firstName} has been registered successfully.`,
                { id: user.id },
            );

            //*** access & refresh token generation ***

            //payload
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

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

            // Setting access token in cookies
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                domain: "localhost",
                maxAge: 1000 * 60 * 60, //1h
            });

            //persist the refresh token in DB
            const milliSecondsInYear = 1000 * 60 * 60 * 24 * 365; //1 Year

            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
            const newRefreshToken = await refreshTokenRepo.save({
                user: user,
                expiresAt: new Date(Date.now() + milliSecondsInYear),
            });

            //Sign Refresh Token
            const refreshToken = jwt.sign(
                payload,
                Config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "30D",
                    issuer: "Auth-Service",
                    jwtid: String(newRefreshToken.id),
                },
            );

            // Setting refresh token in cookies
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                sameSite: "strict",
                domain: "localhost",
                maxAge: 1000 * 60 * 60 * 24 * 30, //1M
            });

            //return response.
            return res.status(201).json({
                id: user.id,
                message: `User ${user.firstName} with id ${user.id} has been registered successfully.`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }
}
