import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'grade_bands' })
export class GradeBand extends Document {
  @Prop({ required: true })
  minScore: number; // Minimum score for this grade

  @Prop({ required: true })
  maxScore: number; // Maximum score for this grade

  @Prop({ required: true })
  gradeValue: number; // Grade value (e.g., 6, 7, 8, 9, 10)

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const GradeBandSchema = SchemaFactory.createForClass(GradeBand);

// Transform _id to id in JSON output
GradeBandSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export type GradeBandDocument = GradeBand & Document;
