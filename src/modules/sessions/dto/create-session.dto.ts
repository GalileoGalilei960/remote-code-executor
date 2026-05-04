export type CreateSessionDto = {
    id: string;
    refreshToken: string;
    device: string;
    userAgent: string;
    ip: string;
    userId: number;
};
