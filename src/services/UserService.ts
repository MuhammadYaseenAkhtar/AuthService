import type { Repository } from "typeorm";
import { User } from "../entity/User.ts";
import type { UserData } from "../types/index.ts";

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstName, lastName, email, password }: UserData) {
        return await this.userRepository.save({
            firstName,
            lastName,
            email,
            password,
        });
    }
}
