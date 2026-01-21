import type { Repository } from "typeorm";
import { User } from "../entity/User.ts";
import type { UserData } from "../types/index.ts";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstName, lastName, email, password, role }: UserData) {
        try {
            //hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            //save the user in db
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
            });
        } catch {
            const error = createHttpError(
                500,
                "Failed to store data in database!",
            );
            throw error;
        }
    }

    async checkEmail(email: string) {
        try {
            const user = await this.userRepository.findOneBy({ email: email });

            return user;
        } catch {
            const error = createHttpError(
                500,
                "Something went wrong while checking the email!",
            );
            throw error;
        }
    }

    async findById(id: number) {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                select: ["id", "email", "role", "firstName", "lastName"],
            });

            return user;
        } catch {
            const error = createHttpError(
                500,
                "Something went wrong while finding the user by ID!",
            );
            throw error;
        }
    }
}
