import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/config';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'freelancer' | 'client';
  profilePicture?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: {
    country: string;
    city: string;
  };
  languages?: Array<{
    language: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }>;
  portfolio?: Array<{
    title: string;
    description: string;
    url: string;
    image?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear?: number;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
  }>;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
  rating: {
    average: number;
    count: number;
  };
  totalEarnings: number;
  completedProjects: number;
  isVerified: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Exclude from queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['freelancer', 'client'],
      message: 'Role must be either freelancer or client'
    },
    required: [true, 'Role is required']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  hourlyRate: {
    type: Number,
    min: [5, 'Hourly rate must be at least $5'],
    max: [1000, 'Hourly rate cannot exceed $1000']
  },
  location: {
    country: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    }
  },
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native'],
      required: true
    }
  }],
  portfolio: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Portfolio title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Portfolio description cannot exceed 500 characters']
    },
    url: {
      type: String,
      required: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    image: {
      type: String,
      match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, 'Please enter a valid image URL']
    }
  }],
  education: [{
    institution: {
      type: String,
      required: true,
      trim: true
    },
    degree: {
      type: String,
      required: true,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      required: true,
      trim: true
    },
    startYear: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear()
    },
    endYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 10
    }
  }],
  experience: [{
    company: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: [1000, 'Experience description cannot exceed 1000 characters']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    }
  }],
  socialLinks: {
    linkedin: {
      type: String,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*/, 'Please enter a valid LinkedIn URL']
    },
    github: {
      type: String,
      match: [/^https?:\/\/(www\.)?github\.com\/.*/, 'Please enter a valid GitHub URL']
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    },
    twitter: {
      type: String,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.*/, 'Please enter a valid Twitter URL']
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  completedProjects: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Database indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ skills: 1 });
userSchema.index({ 'location.country': 1, 'location.city': 1 });
userSchema.index({ createdAt: -1 });

// Virtual field for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next: any) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function(): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      role: this.role 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

userSchema.methods.generateRefreshToken = function(): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: this._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

export const User = mongoose.model<IUser>('User', userSchema);