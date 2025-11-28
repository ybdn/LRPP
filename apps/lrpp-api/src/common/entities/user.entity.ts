import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Attempt } from "./attempt.entity";
import { ExamSession } from "./exam-session.entity";
import { UserPvAccess } from "./user-pv-access.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum SubscriptionTier {
  FREE = "free",
  PREMIUM = "premium",
}

@Entity("users")
export class User {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "supabase_id", type: "varchar", length: 255, unique: true, nullable: true })
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

  @Column({
    name: "subscription_tier",
    type: "varchar",
    length: 20,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ name: "study_goal", type: "varchar", length: 100, nullable: true })
  studyGoal: string | null;

  @Column({ name: "onboarding_completed", type: "boolean", default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Attempt, (attempt) => attempt.user)
  attempts: Attempt[];

  @OneToMany(() => ExamSession, (exam) => exam.user)
  examSessions: ExamSession[];

  @OneToMany(() => UserPvAccess, (access) => access.user)
  pvAccesses: UserPvAccess[];
}
