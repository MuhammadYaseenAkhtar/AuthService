import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.ts";

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface RegisterUserRequest extends Request {
    body: UserData;
}
export class AuthController {
    async create(req: RegisterUserRequest, res: Response) {
        try {
            const { firstName, lastName, email, password } = req.body;

            const userRepository = AppDataSource.getRepository("User");
            await userRepository.save({ firstName, lastName, email, password });

            return res.status(201).json({ message: "User created" });
        } catch (error) {
            console.log(error);
        }
    }
}
