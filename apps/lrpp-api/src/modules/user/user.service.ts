import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "@/common/entities";
import { v4 as uuidv4 } from "uuid";

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

  async findOrCreateFromSupabase(supabaseId: string, email: string | null) {
    let user = await this.userRepository.findOne({
      where: { supabaseId },
    });

    if (!user) {
      user = this.userRepository.create({
        id: uuidv4(),
        supabaseId,
        email,
        role: UserRole.USER,
      });
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    await this.userRepository.update(userId, { role });
    return this.findById(userId);
  }
}
