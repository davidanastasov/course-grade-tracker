import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ComponentType {
  LAB = 'Lab',
  ASSIGNMENT = 'Assignment',
  MIDTERM = 'Midterm',
  EXAM = 'Exam',
  PROJECT = 'Project'
}

@Schema({ timestamps: true, collection: 'grade_components' })
export class GradeComponent extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(ComponentType),
    required: true
  })
  category: ComponentType;

  @Prop({ required: true })
  weight: number; // Percentage (e.g., 30.0 for 30%)

  @Prop({ default: 0.0 })
  minimumScore: number; // Minimum score required for this component

  @Prop({ default: 100.0 })
  totalPoints: number; // Total points available for this component

  @Prop({ default: false })
  isMandatory: boolean; // Whether this component is mandatory for passing

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const GradeComponentSchema = SchemaFactory.createForClass(GradeComponent);

// Transform _id to id in JSON output
GradeComponentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export type GradeComponentDocument = GradeComponent & Document;
