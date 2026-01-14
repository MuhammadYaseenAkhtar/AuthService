import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    CreateDateColumn,
} from "typeorm";

@Entity({ name: "tenants" })
export class Tenant {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "varchar", length: 255 })
    address!: string;

    @UpdateDateColumn()
    updatedAt!: number;

    @CreateDateColumn()
    createdAT!: number;
}
