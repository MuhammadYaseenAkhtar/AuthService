import type { Repository } from "typeorm";
import type { Tenant } from "../entity/Tenant.ts";
import type { TenantData } from "../types/index.ts";
import createHttpError from "http-errors";

export class TenantService {
    constructor(private readonly tenantRepo: Repository<Tenant>) {}
    async create(tenantData: TenantData) {
        try {
            return await this.tenantRepo.save(tenantData);
        } catch (err: unknown) {
            const error = createHttpError(
                500,
                `Something went wrong while saving the tenant data in DB; Reason =>  ${(err as Error).message}`,
            );
            throw error;
        }
    }

    async listAllTenants() {
        try {
            return await this.tenantRepo.find();
        } catch (err: unknown) {
            const error = createHttpError(
                500,
                `Something went wrong while retrieving the list of tenants from DB; Reason =>  ${(err as Error).message}`,
            );
            throw error;
        }
    }

    async findById(tenantId: number) {
        try {
            return await this.tenantRepo.findOneBy({ id: tenantId });
        } catch (err: unknown) {
            const error = createHttpError(
                500,
                `Something went wrong while retrieving tenant by ID from DB; Reason =>  ${(err as Error).message}`,
            );
            throw error;
        }
    }

    async update(tenantId: number, tenantData: TenantData) {
        try {
            return await this.tenantRepo.update(
                { id: tenantId },
                { name: tenantData.name, address: tenantData.address },
            );
        } catch (err: unknown) {
            const error = createHttpError(
                500,
                `Something went wrong while updating the tenant data; Reason =>  ${(err as Error).message}`,
            );
            throw error;
        }
    }

    async delete(tenantId: number) {
        try {
            return await this.tenantRepo.delete({ id: tenantId });
        } catch (err: unknown) {
            const error = createHttpError(
                500,
                `Something went wrong while deleting tenant by ID from DB; Reason =>  ${(err as Error).message}`,
            );
            throw error;
        }
    }
}
