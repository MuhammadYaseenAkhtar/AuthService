import { DataSource } from "typeorm";

export const isJwt = (token: string | undefined): boolean => {
    const parts = token?.split(".");

    if (parts?.length !== 3) {
        return false;
    }

    try {
        parts.forEach((part) => {
            Buffer.from(part, "base64url").toString("utf-8");
        });

        return true;
    } catch (error) {
        return false;
    }
};
