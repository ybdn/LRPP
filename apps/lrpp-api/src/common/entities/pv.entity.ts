import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { PvContent } from "./pv-content.entity";
import { PvSection } from "./pv-section.entity";

@Entity("pvs")
export class Pv {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column()
  order: number;

  // Indique si ce PV a une section "Notification des droits"
  @Column({ name: "has_notification", default: false })
  hasNotification: boolean;

  // Indique si ce PV a une section "Déroulement de la mesure"
  @Column({ name: "has_deroulement", default: false })
  hasDeroulement: boolean;

  @OneToMany(() => PvContent, (content) => content.pv)
  contents: PvContent[];

  @OneToMany(() => PvSection, (section) => section.pv)
  sections: PvSection[];
}
