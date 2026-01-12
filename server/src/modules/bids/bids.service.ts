import { Bid, IBid } from './bids.model';
import { Gig } from '../gigs/gigs.model';
import ApiError from '../../utils/apierror';
import mongoose from 'mongoose';

export class BidsService {
  async createBid(bidData: Partial<IBid>, freelancerId: string): Promise<IBid> {
    const { gigId } = bidData;

    // Check if gig exists and is active
    const gig = await Gig.findById(gigId);
    if (!gig || !gig.isActive) {
      throw new ApiError(404, 'Gig not found or is not active');
    }

    // Check if freelancer is not the gig owner
    if (gig.freelancerId.toString() === freelancerId) {
      throw new ApiError(400, 'You cannot bid on your own gig');
    }

    // Check if freelancer has already bid on this gig
    const existingBid = await Bid.findOne({ gigId, freelancerId });
    if (existingBid) {
      throw new ApiError(400, 'You have already placed a bid on this gig');
    }

    const bid = new Bid({
      ...bidData,
      freelancerId: new mongoose.Types.ObjectId(freelancerId),
      clientId: gig.freelancerId
    });

    return await bid.save();
  }

  async getBids(query: {
    page?: number;
    limit?: number;
    status?: string;
    gigId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, userId: string, userRole: string): Promise<{ bids: IBid[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      gigId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const filter: any = {};

    // Filter based on user role
    if (userRole === 'freelancer') {
      filter.freelancerId = userId;
    } else {
      filter.clientId = userId;
    }

    if (status) filter.status = status;
    if (gigId) {
      if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new ApiError(400, 'Invalid gig ID');
      }
      filter.gigId = gigId;
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      Bid.find(filter)
        .populate('gigId', 'title category pricing deliveryTime')
        .populate('freelancerId', 'firstName lastName profilePicture rating')
        .populate('clientId', 'firstName lastName profilePicture')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Bid.countDocuments(filter)
    ]);

    return {
      bids,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getBidById(bidId: string, userId: string): Promise<IBid | null> {
    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      throw new ApiError(400, 'Invalid bid ID');
    }

    const bid = await Bid.findById(bidId)
      .populate('gigId', 'title category pricing deliveryTime')
      .populate('freelancerId', 'firstName lastName profilePicture bio skills rating')
      .populate('clientId', 'firstName lastName profilePicture');

    if (!bid) {
      throw new ApiError(404, 'Bid not found');
    }

    // Check if user has permission to view this bid
    if (bid.freelancerId._id.toString() !== userId && bid.clientId._id.toString() !== userId) {
      throw new ApiError(403, 'You do not have permission to view this bid');
    }

    return bid;
  }

  async updateBid(bidId: string, updateData: Partial<IBid>, freelancerId: string): Promise<IBid | null> {
    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      throw new ApiError(400, 'Invalid bid ID');
    }

    const bid = await Bid.findOne({ _id: bidId, freelancerId, status: 'pending' });
    if (!bid) {
      throw new ApiError(404, 'Bid not found or cannot be updated (only pending bids can be updated)');
    }

    return Bid.findByIdAndUpdate(bidId, updateData, { new: true })
      .populate('gigId', 'title category pricing deliveryTime')
      .populate('freelancerId', 'firstName lastName profilePicture')
      .populate('clientId', 'firstName lastName profilePicture');
  }

  async updateBidStatus(bidId: string, status: 'accepted' | 'rejected', clientId: string): Promise<IBid | null> {
    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      throw new ApiError(400, 'Invalid bid ID');
    }

    const bid = await Bid.findOne({ _id: bidId, clientId, status: 'pending' });
    if (!bid) {
      throw new ApiError(404, 'Bid not found or cannot be updated (only pending bids can be updated)');
    }

    // If accepting a bid, reject all other pending bids for the same gig
    if (status === 'accepted') {
      await Bid.updateMany(
        { gigId: bid.gigId, status: 'pending', _id: { $ne: bidId } },
        { status: 'rejected' }
      );
    }

    return Bid.findByIdAndUpdate(bidId, { status }, { new: true })
      .populate('gigId', 'title category pricing deliveryTime')
      .populate('freelancerId', 'firstName lastName profilePicture')
      .populate('clientId', 'firstName lastName profilePicture');
  }

  async withdrawBid(bidId: string, freelancerId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      throw new ApiError(400, 'Invalid bid ID');
    }

    const bid = await Bid.findOne({ _id: bidId, freelancerId, status: 'pending' });
    if (!bid) {
      throw new ApiError(404, 'Bid not found or cannot be withdrawn (only pending bids can be withdrawn)');
    }

    await Bid.findByIdAndUpdate(bidId, { status: 'withdrawn' });
  }

  async getGigBids(gigId: string, clientId: string, page = 1, limit = 10): Promise<{ bids: IBid[]; total: number; page: number; totalPages: number }> {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
      throw new ApiError(400, 'Invalid gig ID');
    }

    // Verify that the client owns the gig
    const gig = await Gig.findOne({ _id: gigId, freelancerId: clientId });
    if (!gig) {
      throw new ApiError(404, 'Gig not found or you do not have permission to view its bids');
    }

    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      Bid.find({ gigId })
        .populate('freelancerId', 'firstName lastName profilePicture bio skills rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bid.countDocuments({ gigId })
    ]);

    return {
      bids,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}