import mongoose, { Document, Schema } from 'mongoose';

export interface IBid extends Document {
  gigId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  deliveryTime: number; // in days
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>({
  gigId: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  freelancerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 5
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  proposal: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  attachments: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(pdf|doc|docx|txt|jpg|jpeg|png|gif)$/i.test(v);
      },
      message: 'Invalid attachment URL format'
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure one bid per freelancer per gig
bidSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true });
bidSchema.index({ clientId: 1, status: 1 });
bidSchema.index({ freelancerId: 1, status: 1 });
bidSchema.index({ createdAt: -1 });

export const Bid = mongoose.model<IBid>('Bid', bidSchema);