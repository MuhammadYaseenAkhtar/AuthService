import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    UpdateDateColumn,
    CreateDateColumn,
} from "typeorm";
import { User } from "./User.ts";

@Entity({ name: "refreshTokens" })
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "timestamp" })
    expiresAt!: Date;

    @ManyToOne(() => User)
    user!: User;

    @UpdateDateColumn()
    updatedAt!: number;

    @CreateDateColumn()
    createdAT!: number;
}
