import type { Request } from "express";

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
}

export interface RegisterUserRequest extends Request {
    body: UserData;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export type authCookies = {
    accessToken: string;
    refreshToken: string;
};

export interface authRequest extends Request {
    auth: {
        sub: string;
        role: string;
        id: string;
    };
}

export interface IRefreshTokenPayload {
    id: string;
}

export interface TenantData {
    name: string;
    address: string;
}

export interface CreateTenantRequest extends Request {
    body: TenantData;
}

export interface CreateUserRequest extends Request {
    body: UserData;
}
