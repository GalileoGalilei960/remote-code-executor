import {
    Body,
    Controller,
    Headers,
    Ip,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Cookie } from './decorators/get-cookie.decorator';
import type { Request, Response } from 'express';
import { UAParser } from 'ua-parser-js';
import { AccessTokenGuard } from './guards/auth.guard';
import {
    ApiSignUp,
    ApiSignIn,
    ApiSignOut,
    ApiRefreshToken,
} from './auth.swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiSignUp()
    @Post('/signup')
    async signUp(
        @Body() createUserDto: CreateUserDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const parser = new UAParser(userAgent);
        const os = parser.getOS()?.name || 'Unknown OS';
        const browser = parser.getBrowser()?.name || 'Unknown Browser';
        const device = `${os} - ${browser}`;
        const { accessToken, refreshToken } = await this.authService.signUp(
            createUserDto,
            device,
            userAgent,
            ip,
        );

        console.log(ip, userAgent);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { accessToken };
    }

    @ApiSignIn()
    @Post('/signin')
    async signIn(
        @Body() signInDto: SignInDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const parser = new UAParser(userAgent);
        const os = parser.getOS()?.name || 'Unknown OS';
        const browser = parser.getBrowser()?.name || 'Unknown Browser';
        const device = `${os} - ${browser}`;

        const { accessToken, refreshToken } = await this.authService.signIn(
            signInDto.email,
            signInDto.password,
            device,
            userAgent,
            ip,
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { accessToken };
    }

    @ApiSignOut()
    @UseGuards(AccessTokenGuard)
    @Post('/signout')
    async signOut(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        if (!req.user)
            throw new UnauthorizedException('Missing authentication');

        await this.authService.signOut(req?.user?.sessionId);

        res.clearCookie('refreshToken');
    }

    @ApiRefreshToken()
    @Post('/refresh')
    async refresh(
        @Cookie('refreshToken') refreshToken: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { accessToken, refreshToken: newRefreshToken } =
            await this.authService.refreshTokens(refreshToken);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { accessToken };
    }
}
