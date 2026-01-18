import type { NextFunction, Response } from "express";
import type { TenantService } from "../services/TenantService.ts";
import type { CreateTenantRequest } from "../types/index.ts";
import type { Logger } from "winston";
import { validationResult } from "express-validator";

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}
    async createTenant(
        req: CreateTenantRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            //validate request using express-validator.
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const { name, address } = req.body;

            const newTenant = await this.tenantService.create({
                name,
                address,
            });

            this.logger.info(`Tenant ${newTenant.name} is created`, {
                id: newTenant.id,
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
