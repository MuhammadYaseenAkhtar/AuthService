import type { Request, NextFunction, Response } from "express";
import { type JwtPayload } from "jsonwebtoken";
import type { LoginRequest, RegisterUserRequest } from "../types/index.ts";
import type { UserService } from "../services/UserService.ts";
import type { Logger } from "winston";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import type { TokenService } from "../services/TokenService.ts";
import type { CredentialService } from "../services/CredentialService.ts";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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

            //Call Token service for Access Token Generation
            const accessToken = this.tokenService.generateAccessToken(payload);

            // Setting access token in cookies
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                domain: "localhost",
                maxAge: 1000 * 60 * 60, //1h
            });

            //Call Token service for persistence of refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            //Call Token service for Access Token Generation
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

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

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            //validate request using express-validator.
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const { email, password } = req.body as LoginRequest;

            //check if email is exists in Db
            const user = await this.userService.checkEmail(email);

            if (!user) {
                const error = createHttpError(
                    400,
                    "Invalid Credentials! Try Again please.",
                );
                throw error;
            }

            //check password
            const isPasswordValid = await this.credentialService.checkPassword(
                password,
                user.password,
            );

            if (!isPasswordValid) {
                const error = createHttpError(
                    400,
                    "Invalid Credentials! Try Again please.",
                );
                throw error;
            }

            //*** access & refresh token generation ***

            //payload
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            //Call Token service for Access Token Generation
            const accessToken = this.tokenService.generateAccessToken(payload);

            // Setting access token in cookies
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "strict",
                domain: "localhost",
                maxAge: 1000 * 60 * 60, //1h
            });

            //Call Token service for persistence of refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            //Call Token service for Access Token Generation
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            // Setting refresh token in cookies
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                sameSite: "strict",
                domain: "localhost",
                maxAge: 1000 * 60 * 60 * 24 * 30, //1M
            });

            //return response
            return res.status(200).json({
                message: `Congrats ${user.firstName}, You've logged in successfully; Your ID is ${user.id}`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }

    me(_req: Request, res: Response) {
        res.status(200).json({});
    }
}
