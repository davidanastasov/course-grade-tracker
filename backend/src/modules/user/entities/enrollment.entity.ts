import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DROPPED = 'dropped',
  COMPLETED = 'completed'
}

@Schema({ timestamps: true, collection: 'enrollments' })
export class Enrollment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(EnrollmentStatus),
    default: EnrollmentStatus.PENDING
  })
  status: EnrollmentStatus;

  @Prop()
  enrolledAt?: Date;

  @Prop()
  droppedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  finalGrade?: string;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Transform _id to id in JSON output
EnrollmentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Add compound index for student-course uniqueness
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export type EnrollmentDocument = Enrollment & Document;
