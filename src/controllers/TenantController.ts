import type { NextFunction, Response } from "express";
import type { TenantService } from "../services/TenantService.ts";
import type { CreateTenantRequest } from "../types/index.ts";

export class TenantController {
    constructor(private tenantService: TenantService) {}
    async createTenant(
        req: CreateTenantRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { name, address } = req.body;

            const newTenant = await this.tenantService.create({
                name,
                address,
            });

            return res.status(201).json({
                id: newTenant.id,
                message: `A new tenant named ${newTenant.name} is created with an ID ${newTenant.id}`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }
}
