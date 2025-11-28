import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum TicketType {
  BUG = "bug",
  CONTACT = "contact",
}

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  CLOSED = "closed",
}

export enum TicketSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

@Entity("tickets")
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 20 })
  type: TicketType;

  @Column({ type: "varchar", length: 20, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: "varchar", length: 20, default: TicketSeverity.MEDIUM })
  severity: TicketSeverity;

  @Column({ type: "varchar", length: 255, nullable: true })
  subject: string | null;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  pvId: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  contextUrl: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  reporterName: string | null;

  @Column({ type: "uuid", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
