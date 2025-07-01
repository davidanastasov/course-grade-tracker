import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AssignmentType {
  LAB = 'lab',
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  EXAM = 'exam',
  PROJECT = 'project'
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  GRADED = 'graded'
}

@Schema({ timestamps: true, collection: 'assignments' })
export class Assignment extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(AssignmentType),
    required: true
  })
  type: AssignmentType;

  @Prop({ required: true })
  maxScore: number;

  @Prop({ default: 0.0 })
  weight: number; // Weight in the overall course grade

  @Prop()
  dueDate?: Date;

  @Prop({
    type: String,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.DRAFT
  })
  status: AssignmentStatus;

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  // Virtual properties for relationships
  grades?: Types.ObjectId[];
  files?: Types.ObjectId[];

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

// Transform _id to id in JSON output
AssignmentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Add virtual populate for relationships
AssignmentSchema.virtual('grades', {
  ref: 'Grade',
  localField: '_id',
  foreignField: 'assignment'
});

AssignmentSchema.virtual('files', {
  ref: 'AssignmentFile',
  localField: '_id',
  foreignField: 'assignment'
});

export type AssignmentDocument = Assignment & Document;
