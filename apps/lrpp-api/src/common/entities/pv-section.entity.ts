import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Pv } from './pv.entity';
import { Block } from './block.entity';

@Entity('pv_sections')
export class PvSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pv_id', length: 50 })
  pvId: string;

  // Label de la section: cadre_legal, motivation, notification, deroulement, elements_fond
  @Column({ length: 50 })
  label: string;

  // Titre affiché de la section
  @Column({ length: 200 })
  title: string;

  @Column()
  order: number;

  @ManyToOne(() => Pv, (pv) => pv.sections)
  @JoinColumn({ name: 'pv_id' })
  pv: Pv;

  @OneToMany(() => Block, (block) => block.section)
  blocks: Block[];
}
