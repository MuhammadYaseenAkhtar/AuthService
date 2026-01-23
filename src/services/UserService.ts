import type { Repository } from "typeorm";
import { User } from "../entity/User.ts";
import type { updateData, UserData } from "../types/index.ts";
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

    async checkEmail(
        email: string,
        includePassword: boolean = false,
        id?: number,
    ) {
        try {
            const query = this.userRepository.createQueryBuilder("user");

            if (includePassword) {
                query.addSelect("user.password");
            }

            query.where("user.email = :email", { email });

            if (id !== undefined) {
                query.andWhere("user.id != :id", { id });
            }

            const user = await query.getOne();
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

    async listAllUsers() {
        try {
            return await this.userRepository.find();
        } catch {
            const error = createHttpError(
                500,
                "Something went wrong while fetching the users from DB!",
            );
            throw error;
        }
    }

    async deleteUser(id: number) {
        try {
            return await this.userRepository.delete({
                id,
            });
        } catch {
            const error = createHttpError(
                500,
                "Something went wrong while deleting the user by ID!",
            );
            throw error;
        }
    }

    async updateUser(id: number, data: updateData) {
        try {
            return await this.userRepository.update({ id }, data);
        } catch {
            const error = createHttpError(
                500,
                "Something went wrong while updating the user by ID!",
            );
            throw error;
        }
    }
}
