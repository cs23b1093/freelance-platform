import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { NextFunction } from 'express';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'freelancer' | 'client';
  profilePicture?: string;
  bio?: string;
  skills?: string[];
  gigs: mongoose.Types.ObjectId[];
  hourlyRate?: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['freelancer', 'client'],
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500
  },
  skills: [{
    type: String,
    trim: true
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next: any) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);