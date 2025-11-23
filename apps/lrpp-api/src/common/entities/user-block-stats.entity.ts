import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Block } from "./block.entity";
import { isoDateTransformer } from "../transformers/date.transformer";

@Entity("user_block_stats")
export class UserBlockStats {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId: string;

  @PrimaryColumn({ name: "block_id", type: "uuid" })
  blockId: string;

  @Column({ name: "mastery_score", default: 0 })
  masteryScore: number;

  @Column({ name: "attempt_count", default: 0 })
  attemptCount: number;

  @Column({
    name: "last_attempt_at",
    type: "text",
    nullable: true,
    transformer: isoDateTransformer,
  })
  lastAttemptAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Block)
  @JoinColumn({ name: "block_id" })
  block: Block;
}
