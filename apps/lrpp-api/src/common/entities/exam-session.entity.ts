import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Attempt } from './attempt.entity';
import { isoDateTransformer } from '../transformers/date.transformer';

@Entity('exam_sessions')
export class ExamSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column()
  duration: number;

  @Column({ type: 'text', array: true, default: '{}' })
  themes: string[];

  @Column({ type: 'float', nullable: true })
  score: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'text', nullable: true, transformer: isoDateTransformer })
  completedAt: Date | null;

  @ManyToOne(() => User, (user) => user.examSessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Attempt, (attempt) => attempt.examSession)
  attempts: Attempt[];
}
