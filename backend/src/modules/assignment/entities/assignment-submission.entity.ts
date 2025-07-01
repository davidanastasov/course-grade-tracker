import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SubmissionStatus {
  NOT_SUBMITTED = 'not_submitted',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
  GRADED = 'graded'
}

@Schema({ timestamps: true, collection: 'assignment_submissions' })
export class AssignmentSubmission extends Document {
  @Prop({
    type: String,
    enum: Object.values(SubmissionStatus),
    default: SubmissionStatus.NOT_SUBMITTED
  })
  status: SubmissionStatus;

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: Date, required: false })
  submittedAt?: Date;

  @Prop({ type: Date, required: false })
  completedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isLate: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignment: Types.ObjectId;
}

export const AssignmentSubmissionSchema = SchemaFactory.createForClass(AssignmentSubmission);

// Transform _id to id in JSON output
AssignmentSubmissionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

export type AssignmentSubmissionDocument = AssignmentSubmission & Document;
