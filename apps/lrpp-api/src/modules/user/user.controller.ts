import {
  Controller,
  Put,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@/common/entities';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: User,
  ) {
    // Vérifier que l'utilisateur modifie son propre profil
    if (currentUser.id !== id) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
    }

    return this.userService.updateProfile(id, dto);
  }
}
