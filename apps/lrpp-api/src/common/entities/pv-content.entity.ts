import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Pv } from "./pv.entity";
import { InvestigationFramework } from "./investigation-framework.entity";

@Entity("pv_contents")
export class PvContent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "pv_id", length: 50 })
  pvId: string;

  @Column({ name: "framework_id", length: 10, nullable: true })
  frameworkId: string | null; // null si contenu commun à tous les cadres

  // Les parties du PV
  @Column({ name: "cadre_legal", type: "text" })
  cadreLegal: string;

  @Column({ type: "text" })
  motivation: string;

  @Column({ type: "text", nullable: true })
  notification: string | null;

  @Column({ type: "text", nullable: true })
  deroulement: string | null;

  @Column({ name: "elements_fond", type: "text" })
  elementsFond: string;

  @ManyToOne(() => Pv, (pv) => pv.contents)
  @JoinColumn({ name: "pv_id" })
  pv: Pv;

  @ManyToOne(() => InvestigationFramework, { nullable: true })
  @JoinColumn({ name: "framework_id" })
  framework: InvestigationFramework | null;
}
