import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Block } from "./block.entity";
import { ExamSession } from "./exam-session.entity";
import { jsonTransformer } from "../transformers/date.transformer";

export type AttemptMode = "fill_blanks" | "dictation" | "exam";

@Entity("attempts")
export class Attempt {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "block_id", type: "uuid" })
  blockId: string;

  @Column({ name: "exam_session_id", type: "uuid", nullable: true })
  examSessionId: string | null;

  @Column({ length: 20 })
  mode: AttemptMode;

  @Column()
  level: number;

  @Column()
  score: number;

  @Column({ type: "text", nullable: true, transformer: jsonTransformer })
  answers: Record<string, string> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.attempts)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Block)
  @JoinColumn({ name: "block_id" })
  block: Block;

  @ManyToOne(() => ExamSession, (exam) => exam.attempts, { nullable: true })
  @JoinColumn({ name: "exam_session_id" })
  examSession: ExamSession | null;
}
