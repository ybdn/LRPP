import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { Pv } from "./pv.entity";

@Entity("user_pv_access")
@Unique(["user", "pv"])
export class UserPvAccess {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => Pv, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pv_id" })
  pv: Pv;

  @Column({ name: "pv_id", length: 50 })
  pvId: string;

  @CreateDateColumn({ name: "first_accessed_at" })
  firstAccessedAt: Date;
}
