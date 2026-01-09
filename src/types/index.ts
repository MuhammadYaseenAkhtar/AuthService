import type { Request } from "express";

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
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
    };
}

export interface IRefreshTokenPayload {
    id: string;
}
