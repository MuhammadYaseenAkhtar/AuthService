import bcrypt from "bcrypt";
export class CredentialService {
    async checkPassword(password: string, hashedPassword: string) {
        return await bcrypt.compare(password, hashedPassword);
    }
}
