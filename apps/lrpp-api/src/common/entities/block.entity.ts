import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pv } from './pv.entity';
import { PvSection } from './pv-section.entity';

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pv_id', length: 50 })
  pvId: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  // Cadre d'enquête associé (null si commun à tous)
  @Column({ name: 'framework_id', type: 'varchar', length: 10, nullable: true })
  frameworkId: string | null;

  // Texte avec marqueurs [[trous]] pour le mode fill-blanks
  @Column({ name: 'text_template', type: 'text' })
  textTemplate: string;

  // Tags pour le filtrage et les statistiques
  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  @ManyToOne(() => Pv)
  @JoinColumn({ name: 'pv_id' })
  pv: Pv;

  @ManyToOne(() => PvSection)
  @JoinColumn({ name: 'section_id' })
  section: PvSection;
}
