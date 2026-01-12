import { Gig, IGig } from './gigs.model';
import ApiError from '../../utils/apierror';
import mongoose from 'mongoose';

export class GigsService {
  async createGig(gigData: Partial<IGig>, freelancerId: string): Promise<IGig> {
    const gig = new Gig({
      ...gigData,
      freelancerId: new mongoose.Types.ObjectId(freelancerId)
    });
    
    return await gig.save();
  }

  async getGigs(query: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    deliveryTime?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ gigs: IGig[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      category,
      subcategory,
      minPrice,
      maxPrice,
      deliveryTime,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['pricing.amount'] = {};
      if (minPrice !== undefined) filter['pricing.amount'].$gte = minPrice;
      if (maxPrice !== undefined) filter['pricing.amount'].$lte = maxPrice;
    }
    if (deliveryTime) filter.deliveryTime = { $lte: deliveryTime };
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions: any = {};
    if (sortBy === 'price') {
      sortOptions['pricing.amount'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'rating') {
      sortOptions['rating.average'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const [gigs, total] = await Promise.all([
      Gig.find(filter)
        .populate('freelancerId', 'firstName lastName profilePicture rating')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Gig.countDocuments(filter)
    ]);

    return {
      gigs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getGigById(gigId: string): Promise<IGig | null> {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
      throw new ApiError(400, 'Invalid gig ID');
    }

    return Gig.findById(gigId)
      .populate('freelancerId', 'firstName lastName profilePicture bio skills rating');
  }

  async updateGig(gigId: string, updateData: Partial<IGig>, freelancerId: string): Promise<IGig | null> {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
      throw new ApiError(400, 'Invalid gig ID');
    }

    const gig = await Gig.findOne({ _id: gigId, freelancerId });
    if (!gig) {
      throw new ApiError(404, 'Gig not found or you do not have permission to update it');
    }

    return Gig.findByIdAndUpdate(gigId, updateData, { new: true })
      .populate('freelancerId', 'firstName lastName profilePicture');
  }

  async deleteGig(gigId: string, freelancerId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
      throw new ApiError(400, 'Invalid gig ID');
    }

    const gig = await Gig.findOne({ _id: gigId, freelancerId });
    if (!gig) {
      throw new ApiError(404, 'Gig not found or you do not have permission to delete it');
    }

    await Gig.findByIdAndDelete(gigId);
  }

  async getFreelancerGigs(freelancerId: string, page = 1, limit = 10): Promise<{ gigs: IGig[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [gigs, total] = await Promise.all([
      Gig.find({ freelancerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Gig.countDocuments({ freelancerId })
    ]);

    return {
      gigs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}