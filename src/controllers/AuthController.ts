import type { NextFunction, Response } from "express";
import type { RegisterUserRequest } from "../types/index.ts";
import type { UserService } from "../services/UserService.ts";
import type { Logger } from "winston";
import createHttpError from "http-errors";
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
