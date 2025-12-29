import type { NextFunction, Response } from "express";
import type { RegisterUserRequest } from "../types/index.ts";
import type { UserService } from "../services/UserService.ts";

export class AuthController {
    constructor(private userService: UserService) {}
    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            //get data from body
            const { firstName, lastName, email, password } = req.body;

            //Call userService's create method
            const response = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            //return response.
            return res.status(201).json({
                id: response.id,
                message: `User ${response.firstName} with id ${response.id} has been registered successfully.`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }
}
