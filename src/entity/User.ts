import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Tenant } from "./Tenant.ts";

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    firstName!: string;

    @Column({ type: "varchar" })
    lastName!: string;

    @Column({ unique: true, type: "varchar" })
    email!: string;

    @Column({ type: "varchar" })
    password!: string;

    @Column({ type: "varchar" })
    role!: string;

    @ManyToOne(() => Tenant)
    tenant!: Tenant;
}
