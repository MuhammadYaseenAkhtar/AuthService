import type { Response } from "express";
import type { RegisterUserRequest } from "../types/index.ts";
import type { UserService } from "../services/UserService.ts";

export class AuthController {
    constructor(private userService: UserService) {}
    async create(req: RegisterUserRequest, res: Response) {
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
                message: `User ${response.firstName} with id ${response.id} has been registered successfully.`,
            });
        } catch (error) {
            console.log(error);
        }
    }
}
