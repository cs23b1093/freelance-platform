import mongoose, { Document, Schema } from 'mongoose';

export interface IGig extends Document {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  pricing: {
    type: 'fixed' | 'hourly';
    amount: number;
  };
  deliveryTime: number; // in days
  revisions: number;
  requirements: string[];
  images: string[];
  freelancerId: mongoose.Types.ObjectId;
  isActive: boolean;
  rating: {
    average: number;
    count: number;
  };
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const gigSchema = new Schema<IGig>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 5
    }
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  revisions: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  requirements: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  freelancerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

gigSchema.index({ title: 'text', description: 'text', tags: 'text' });
gigSchema.index({ category: 1, subcategory: 1 });
gigSchema.index({ 'pricing.amount': 1 });
gigSchema.index({ 'rating.average': -1 });

export const Gig = mongoose.model<IGig>('Gig', gigSchema);