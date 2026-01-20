import type { Request, NextFunction, Response } from "express";
import type { TenantService } from "../services/TenantService.ts";
import type { CreateTenantRequest } from "../types/index.ts";
import type { Logger } from "winston";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";

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

    async listTenants(_req: Request, res: Response, next: NextFunction) {
        try {
            const allTenants = await this.tenantService.listAllTenants();

            this.logger.info(`Tenant list has been retrieved`, allTenants);

            return res.status(200).json(allTenants);
        } catch (error) {
            next(error);
            return;
        }
    }

    async getTenant(req: Request, res: Response, next: NextFunction) {
        try {
            // Handle validation errors
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const tenantId = Number(req.params.tenantId);

            const tenant = await this.tenantService.findById(tenantId);

            if (!tenant) {
                const error = createHttpError(
                    404,
                    `Tenant with ID ${tenantId} is not found.`,
                );
                throw error;
            }

            this.logger.info(
                `Tenant ${tenant.name} with id ${tenant.id} has been retrieved`,
                tenant,
            );

            return res.status(200).json(tenant);
        } catch (error) {
            next(error);
            return;
        }
    }
    async updateTenant(req: Request, res: Response, next: NextFunction) {
        try {
            // Handle validation errors
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const tenantId = Number(req.params.tenantId);

            // Verify tenant exists
            const existingTenant = await this.tenantService.findById(tenantId);
            if (!existingTenant) {
                const error = createHttpError(
                    404,
                    `Tenant with ID ${tenantId} is not found.`,
                );
                throw error;
            }

            const { name, address } = req.body as CreateTenantRequest["body"];

            await this.tenantService.update(tenantId, {
                name,
                address,
            });

            // Retrieve the updated tenant from the database
            const tenant = await this.tenantService.findById(tenantId);

            if (tenant) {
                this.logger.info(
                    `Tenant with id ${tenant.id} has been updated successfully`,
                    tenant,
                );

                return res.status(200).json({
                    message: `Tenant with id ${tenant.id} has been updated successfully`,
                    data: tenant,
                });
            } else {
                // Handle the case when the tenant is not found
                return res.status(404).json({
                    message: `Tenant with ID ${tenantId} is not found.`,
                });
            }
        } catch (error) {
            next(error);
            return;
        }
    }

    async deleteTenant(req: Request, res: Response, next: NextFunction) {
        try {
            // Handle validation errors
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.status(400).json({
                    errors: result.array(),
                });
            }

            const tenantId = Number(req.params.tenantId);

            const tenant = await this.tenantService.findById(tenantId);

            if (!tenant) {
                const error = createHttpError(
                    404,
                    `Tenant with ID ${tenantId} is not found.`,
                );
                throw error;
            }

            const deletedTenant = await this.tenantService.delete(tenantId);

            if (deletedTenant.affected === 0) {
                const error = createHttpError(
                    500,
                    `Failed to delete tenant with ID ${tenantId}.`,
                );
                throw error;
            }

            this.logger.info(
                `Tenant ${tenant.name} with id ${tenant.id} has been deleted successfully`,
            );

            return res.status(200).json({
                message: `Tenant ${tenant.name} with id ${tenant.id} has been deleted successfully`,
            });
        } catch (error) {
            next(error);
            return;
        }
    }
}
