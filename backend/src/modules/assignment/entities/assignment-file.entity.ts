import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Assignment } from './assignment.entity';

@Entity('assignment_files')
export class AssignmentFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string; // Original filename as uploaded

  @Column()
  fileName: string; // Stored filename (UUID-based)

  @Column()
  filePath: string; // Path to the stored file

  @Column()
  mimeType: string; // MIME type of the file

  @Column({ type: 'bigint' })
  size: number; // File size in bytes

  @CreateDateColumn()
  uploadedAt: Date;

  // Relationships
  @ManyToOne(() => Assignment, (assignment) => assignment.files, { onDelete: 'CASCADE' })
  assignment: Assignment;
}
