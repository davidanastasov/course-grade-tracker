import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'assignment_files' })
export class AssignmentFile extends Document {
  @Prop({ required: true })
  originalName: string; // Original filename as uploaded

  @Prop({ required: true })
  fileName: string; // Stored filename (UUID-based)

  @Prop({ required: true })
  filePath: string; // Path to the stored file

  @Prop({ required: true })
  mimeType: string; // MIME type of the file

  @Prop({ required: true })
  size: number; // File size in bytes

  @Prop({ default: Date.now })
  uploadedAt: Date;

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignment: Types.ObjectId;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const AssignmentFileSchema = SchemaFactory.createForClass(AssignmentFile);

// Transform _id to id in JSON output
AssignmentFileSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export type AssignmentFileDocument = AssignmentFile & Document;
