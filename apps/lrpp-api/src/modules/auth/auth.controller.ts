import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Headers,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User, UserRole } from '../../common/entities/user.entity';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Post('validate')
  async validateToken(@Headers('authorization') authorization: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authorization.substring(7);
    const { user } = await this.authService.validateToken(token);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Post('promote-admin')
  async promoteToAdmin(@Body() body: { email: string }) {
    const user = await this.userService.findByEmail(body.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userService.updateRole(
      user.id,
      UserRole.ADMIN,
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      message: `User ${updatedUser.email} has been promoted to admin`,
    };
  }
}
