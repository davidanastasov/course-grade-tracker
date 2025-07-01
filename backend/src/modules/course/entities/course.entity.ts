import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'courses' })
export class Course extends Document {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 3 })
  credits: number;

  @Prop({ default: 50.0 })
  passingGrade: number;

  @Prop({ default: true })
  isActive: boolean;

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  professor: Types.ObjectId;

  // Virtual properties for relationships
  enrollments?: Types.ObjectId[];
  gradeComponents?: Types.ObjectId[];
  gradeBands?: Types.ObjectId[];
  assignments?: Types.ObjectId[];

  // Computed properties (not persisted to database)
  enrollmentCount?: number;
  assignmentCount?: number;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Configure virtuals to be included in JSON output
CourseSchema.set('toJSON', { virtuals: true });
CourseSchema.set('toObject', { virtuals: true });

// Add virtual populate for relationships
CourseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course'
});

CourseSchema.virtual('gradeComponents', {
  ref: 'GradeComponent',
  localField: '_id',
  foreignField: 'course'
});

CourseSchema.virtual('gradeBands', {
  ref: 'GradeBand',
  localField: '_id',
  foreignField: 'course'
});

CourseSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'course'
});

// Add index for course code uniqueness
CourseSchema.index({ code: 1 }, { unique: true });

export type CourseDocument = Course & Document;
