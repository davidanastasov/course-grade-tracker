import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'component_scores' })
export class ComponentScore extends Document {
  @Prop({ required: true })
  pointsEarned: number;

  @Prop()
  feedback?: string;

  @Prop({ default: false })
  isSubmitted: boolean;

  @Prop({ default: false })
  isGraded: boolean;

  @Prop({ default: Date.now })
  submittedAt?: Date;

  @Prop()
  gradedAt?: Date;

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GradeComponent', required: true })
  gradeComponent: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const ComponentScoreSchema = SchemaFactory.createForClass(ComponentScore);

// Transform _id to id in JSON output
ComponentScoreSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Add compound index for student-gradeComponent uniqueness
ComponentScoreSchema.index({ student: 1, gradeComponent: 1 }, { unique: true });

export type ComponentScoreDocument = ComponentScore & Document;
