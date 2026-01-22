import type { Request, NextFunction, Response } from "express";
import type { CreateUserRequest } from "../types/index.ts";
import type { Logger } from "winston";
import { validationResult } from "express-validator";
import type { UserService } from "../services/UserService.ts";

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}
    async createUser(
        req: CreateUserRequest,
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

            const { firstName, lastName, email, password, role } = req.body;

            const newUser = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
            });

            this.logger.info(`User ${newUser.firstName} is created`, {
                id: newUser.id,
            });

            return res.status(201).json({
                id: newUser.id,
                message: `A new user named ${newUser.firstName} is created with an ID ${newUser.id}; Their role is ${newUser.role}`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }

    async getAllUsers(_req: Request, res: Response, next: NextFunction) {
        try {
            const allUsers = await this.userService.listAllUsers();

            this.logger.info(
                `Users list has been fetched successfully`,
                allUsers,
            );

            return res.status(200).json({
                data: allUsers,
                message: `Users list has been fetched successfully`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }
}
