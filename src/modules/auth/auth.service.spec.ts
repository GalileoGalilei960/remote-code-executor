import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { SessionsService } from '../sessions/sessions.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
    let service: AuthService;

    const mockUsersService = { create: jest.fn(), findOneByEmail: jest.fn() };
    const mockConfigService = { getOrThrow: jest.fn() };
    const mockSessionsService = {
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };
    const mockJwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: SessionsService, useValue: mockSessionsService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should sign up successfuly', async () => {
        mockUsersService.create.mockResolvedValue({
            id: 1,
            email: 'test@test.io',
        });
        mockConfigService.getOrThrow.mockReturnValue('secret');
        mockSessionsService.create.mockResolvedValue({});
        mockJwtService.signAsync.mockResolvedValue('token');

        const { accessToken, refreshToken } = await service.signUp(
            {
                email: 'test@test.io',
                password: 'password',
                username: 'test',
            },
            'Firefox - Linux',
            'firefox-linux-fedora',
            '127.0.0.1',
        );

        expect(accessToken).toEqual('token');
        expect(refreshToken).toEqual('token');

        expect(mockConfigService.getOrThrow).toHaveBeenCalledTimes(1);
        expect(mockUsersService.create).toHaveBeenCalledTimes(1);
        expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
        expect(mockSessionsService.create).toHaveBeenCalledTimes(1);
    });
    it('should sign in', async () => {
        mockUsersService.findOneByEmail.mockResolvedValue({
            id: 1,
            email: 'test@test.io',
            password:
                '$2a$10$BRbMJke1UtpT0QPHAKSnIubFjpj/XNNt9FQhkx4qfThXzgytR5KwO', //testpassword
        });
        mockJwtService.signAsync.mockResolvedValue('token');
        mockConfigService.getOrThrow.mockReturnValue('secret');
        mockSessionsService.create.mockResolvedValue({});

        const { accessToken, refreshToken } = await service.signIn(
            'test@test.io',
            'testpassword',
            'Firefox - Linux',
            'firefox-linux-fedora',
            '127.0.0.1',
        );

        expect(accessToken).toEqual('token');
        expect(refreshToken).toEqual('token');
    });
    it('should not sign in if the password is incorrect', async () => {
        mockUsersService.findOneByEmail.mockResolvedValue({
            id: 1,
            email: 'test@test.io',
            password:
                '$2a$10$BRbMJke1UtpT0QPHAKSnIubFjpj/XNNt9FQhkx4qfThXzgytR5KwO', //testpassword
        });
        mockJwtService.signAsync.mockResolvedValue('token');
        mockConfigService.getOrThrow.mockReturnValue('secret');

        await expect(
            service.signIn(
                'test@test.io',
                'wrongpassword',
                'Firefox - Linux',
                'firefox-linux-fedora',
                '127.0.0.1',
            ),
        ).rejects.toThrow(new BadRequestException('Wrong credentials'));
    });
    it('should not sign in if the user is missing in db', async () => {
        mockUsersService.findOneByEmail.mockResolvedValue(undefined);
        mockJwtService.signAsync.mockResolvedValue('token');
        mockConfigService.getOrThrow.mockReturnValue('secret');
        mockSessionsService.create.mockResolvedValue({});

        await expect(
            service.signIn(
                'test@test.io',
                'testpassword',
                'Firefox - Linux',
                'firefox-linux-fedora',
                '127.0.0.1',
            ),
        ).rejects.toThrow(new BadRequestException('Wrong credentials'));
    });
    it('should refresh tokens', async () => {
        mockJwtService.signAsync.mockResolvedValue('token');
        mockJwtService.verifyAsync.mockResolvedValue({
            email: 'test@test.io',
            sub: 1,
            sessionId: 1,
        });
        mockConfigService.getOrThrow.mockReturnValue('secret');
        mockSessionsService.update.mockResolvedValue({});

        const { accessToken, refreshToken } =
            await service.refreshTokens('oldToken');

        expect(accessToken).toEqual('token');
        expect(refreshToken).toEqual('token');
    });
    it('should not refresh tokens if the RT is expired', async () => {
        mockJwtService.signAsync.mockResolvedValue('token');
        mockJwtService.verifyAsync.mockRejectedValue(TokenExpiredError);
        mockConfigService.getOrThrow.mockImplementation((arg: string) => {
            if (arg === 'JWT_REFRESH_DAYS') return 7;
            return 'secret';
        });
        mockSessionsService.update.mockResolvedValue({});

        await expect(service.refreshTokens('oldToken')).rejects.toThrow(
            BadRequestException,
        );
    });
    it('should not refresh tokens if the RT is missing', async () => {
        await expect(service.refreshTokens('')).rejects.toThrow(
            BadRequestException,
        );
    });
    it('should signout', async () => {
        mockSessionsService.remove.mockResolvedValue({});

        const res = await service.signOut('id');

        expect(res).toEqual({});
    });
});
