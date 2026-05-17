import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessTokenGuard } from '../auth/guards/auth.guard';
import {
    ApiCreateUser,
    ApiGetAllUsers,
    ApiGetUserById,
    ApiUpdateUser,
    ApiDeleteUser,
} from './users.swagger';
import type { Request } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @ApiCreateUser()
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @ApiGetAllUsers()
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @ApiGetUserById()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(+id);
    }

    @ApiUpdateUser()
    @UseGuards(AccessTokenGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @Req() req: Request,
    ) {
        if (+id !== req.user?.sub)
            throw new UnauthorizedException('This is not you');
        return this.usersService.update(+id, updateUserDto);
    }

    @ApiDeleteUser()
    @UseGuards(AccessTokenGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: Request) {
        if (+id !== req.user?.sub)
            throw new UnauthorizedException('This is not you');
        return this.usersService.remove(+id);
    }
}
