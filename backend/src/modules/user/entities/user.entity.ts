import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude } from 'class-transformer';

export enum UserRole {
  STUDENT = 'student',
  PROFESSOR = 'professor',
  ADMIN = 'admin'
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  @Exclude()
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT
  })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  profileImageUrl?: string;

  // Virtual properties for relationships
  enrollments?: Types.ObjectId[];
  courses?: Types.ObjectId[];
  assignments?: Types.ObjectId[];
  grades?: Types.ObjectId[];

  // Timestamps are automatically added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual populate for relationships
UserSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student'
});

UserSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'professor'
});

UserSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'createdBy'
});

UserSchema.virtual('grades', {
  ref: 'Grade',
  localField: '_id',
  foreignField: 'student'
});

export type UserDocument = User & Document;
