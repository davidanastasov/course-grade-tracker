import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'grades' })
export class Grade extends Document {
  @Prop({ required: true })
  score: number;

  @Prop()
  maxScore?: number;

  @Prop()
  feedback?: string;

  @Prop({ default: false })
  isSubmitted: boolean;

  @Prop({ default: false })
  isGraded: boolean;

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignment: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);

// Transform _id to id in JSON output
GradeSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Add compound index for student-assignment uniqueness
GradeSchema.index({ student: 1, assignment: 1 }, { unique: true });

export type GradeDocument = Grade & Document;
