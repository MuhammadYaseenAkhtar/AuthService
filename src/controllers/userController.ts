import type { Request, NextFunction, Response } from "express";
import type {
    CreateUserRequest,
    UpdateUserData,
    UpdateUserRequest,
} from "../types/index.ts";
import type { Logger } from "winston";
import { validationResult } from "express-validator";
import type { UserService } from "../services/UserService.ts";
import createHttpError from "http-errors";

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
    async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            //validate request using express-validator.
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const userId = Number(req.params.userId);

            const user = await this.userService.findById(userId);

            if (!user) {
                throw createHttpError(404, "User Not Found");
            }

            this.logger.info(
                `User ${user.firstName} with ID ${user.id} has been fetched successfully`,
                user,
            );

            return res.status(200).json({
                data: user,
                message: `User ${user.firstName} with ID ${user.id} has been fetched successfully`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            //validate request using express-validator.
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const userId = req.params.userId as unknown as number;

            const user = await this.userService.findById(userId);

            if (!user) {
                throw createHttpError(404, "User Not Found");
            }

            const deleteResult = await this.userService.deleteUser(userId);

            if (deleteResult.affected === 0) {
                const error = createHttpError(
                    500,
                    `Failed to delete User with ID ${userId}.`,
                );
                throw error;
            }

            this.logger.info(
                `User ${user.firstName} with ID ${user.id} has been deleted successfully`,
            );

            return res.status(200).json({
                message: `User ${user.firstName} with ID ${user.id} has been deleted successfully`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }

    async updateUser(
        req: UpdateUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            // validate request using express-validator.
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const userId = Number(req.params.userId);
            const data: UpdateUserData = req.body;

            if (Object.keys(data).length === 0) {
                throw createHttpError(
                    400,
                    "At least one field is required to update a user",
                );
            }

            const user = await this.userService.findById(userId);
            if (!user) {
                throw createHttpError(404, "User Not Found");
            }

            if (data.email) {
                const emailExists = await this.userService.checkEmail(
                    data.email,
                    false,
                    userId,
                );
                if (emailExists) {
                    throw createHttpError(400, "Email already exists");
                }
            }

            const updateResult = await this.userService.updateUser(
                userId,
                data,
            );

            if (updateResult.affected === 0) {
                throw createHttpError(
                    500,
                    `Failed to update user with ID ${userId}.`,
                );
            }

            const updatedUser = await this.userService.findById(userId);
            if (!updatedUser) {
                throw createHttpError(
                    500,
                    `User updated but could not be reloaded (id=${userId}).`,
                );
            }

            this.logger.info(
                `User ${updatedUser.firstName} with ID ${updatedUser.id} has been updated successfully`,
                updatedUser,
            );

            return res.status(200).json({
                data: updatedUser,
                message: `User ${updatedUser.firstName} with ID ${updatedUser.id} has been updated successfully`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }
}
