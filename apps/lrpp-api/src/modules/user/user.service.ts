import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/common/entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async ensureUser(id: string) {
    let user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      user = this.userRepository.create({ id });
      user = await this.userRepository.save(user);
    }
    return user;
  }
}
