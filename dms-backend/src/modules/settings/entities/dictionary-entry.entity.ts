import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

// Admin-editable bilingual static dictionary. Seeded once from the
// frontend's static locale JSON files (see database/seeds/dictionary.seed.json)
// so every existing UI string starts out editable; the frontend merges this
// table's rows over its bundled translations at runtime.
@Entity('dictionary_entries')
export class DictionaryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  // Dot-notation i18next key, e.g. "nav.dashboard".
  @Column({ unique: true, length: 255 })
  key: string;

  @Column({ type: 'text', default: '' })
  en: string;

  @Column({ type: 'text', default: '' })
  ar: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
