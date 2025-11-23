import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("investigation_frameworks")
export class InvestigationFramework {
  @PrimaryColumn({ length: 10 })
  id: string; // ep, ef, cr, dc, dpgb, di, rpf

  @Column({ length: 100 })
  name: string;

  // Les 3 parties obligatoires d'un cadre d'enquête
  @Column({ name: "cadre_legal", type: "text" })
  cadreLegal: string;

  @Column({ type: "text" })
  justification: string;

  @Column({ type: "text" })
  competence: string;
}
