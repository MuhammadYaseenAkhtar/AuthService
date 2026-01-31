import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source.js";
import { User } from "../../src/entity/User.js";
import { Roles } from "../../src/constants/index.js";
import { UserService } from "../../src/services/UserService.js";

describe("Admin User Creation", () => {
    let connection: DataSource;
    let userService: UserService;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
        const userRepository = connection.getRepository(User);
        userService = new UserService(userRepository);
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    it("should create an admin user", async () => {
        const adminUser = await userService.create({
            firstName: "Super Admin",
            lastName: "Super Admin",
            email: "admin@admin.com",
            password: "AdminPassword",
            role: Roles.ADMIN,
        });

        expect(adminUser).toBeDefined();
        expect(adminUser.email).toBe("admin@admin.com");
        expect(adminUser.role).toBe(Roles.ADMIN);
    });

    it("should allow creating multiple admin users", async () => {
        const firstAdmin = await userService.create({
            firstName: "First Admin",
            lastName: "Admin",
            email: "admin1@admin.com",
            password: "AdminPassword",
            role: Roles.ADMIN,
        });

        const secondAdmin = await userService.create({
            firstName: "Second Admin",
            lastName: "Admin",
            email: "admin2@admin.com",
            password: "AdminPassword",
            role: Roles.ADMIN,
        });

        expect(firstAdmin.id).not.toBe(secondAdmin.id);

        const adminCount = await connection
            .getRepository(User)
            .count({ where: { role: Roles.ADMIN } });

        expect(adminCount).toBe(2);
    });
});
