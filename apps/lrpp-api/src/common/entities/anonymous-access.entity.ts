import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { Pv } from "./pv.entity";

@Entity("anonymous_access")
@Unique(["ipAddress", "pv"])
@Index(["ipAddress"])
export class AnonymousAccess {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "ip_address", length: 45 })
  ipAddress: string;

  @Column({ name: "fingerprint", type: "varchar", length: 64, nullable: true })
  fingerprint: string | null;

  @ManyToOne(() => Pv, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pv_id" })
  pv: Pv;

  @Column({ name: "pv_id", length: 50 })
  pvId: string;

  @CreateDateColumn({ name: "first_accessed_at" })
  firstAccessedAt: Date;
}
