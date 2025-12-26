import { AppDataSource } from "../config/data-source.ts";
import { User } from "../entity/User.ts";
import type { UserData } from "../types/index.ts";

export class UserService {
    async create({ firstName, lastName, email, password }: UserData) {
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.save({ firstName, lastName, email, password });
    }
}
