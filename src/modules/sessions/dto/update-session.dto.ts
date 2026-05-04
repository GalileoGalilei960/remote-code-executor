export type UpdateSessionDto = {
    isRevoked?: boolean;
    expiresAt?: Date;
    lastUsedAt?: Date;
    refreshToken?: string;
};
