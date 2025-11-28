import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Attempt } from "./attempt.entity";
import { ExamSession } from "./exam-session.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  supabaseId: string | null;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  name: string | null;

  @Column({
    type: "varchar",
    length: 20,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Attempt, (attempt) => attempt.user)
  attempts: Attempt[];

  @OneToMany(() => ExamSession, (exam) => exam.user)
  examSessions: ExamSession[];
}
