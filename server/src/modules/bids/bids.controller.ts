import { Request, Response, NextFunction } from 'express';
import { BidsService } from './bids.service';
import { createBidSchema, updateBidSchema, bidStatusSchema, bidQuerySchema } from './bids.validate';
import ApiError from '../../utils/apierror';

export class BidsController {
  private bidsService: BidsService;

  constructor() {
    this.bidsService = new BidsService();
  }

  createBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = createBidSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const freelancerId = (req as any).user.userId;
      const bid = await this.bidsService.createBid(value, freelancerId);

      res.status(201).json({
        success: true,
        message: 'Bid created successfully',
        data: { bid }
      });
    } catch (error) {
      next(error);
    }
  };

  getBids = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = bidQuerySchema.validate(req.query);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const userId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      
      const result = await this.bidsService.getBids(value, userId, userRole);

      res.status(200).json({
        success: true,
        message: 'Bids retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getBidById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bidId } = req.params;
      const userId = (req as any).user.userId;
      
      const bid = await this.bidsService.getBidById(bidId, userId);

      res.status(200).json({
        success: true,
        message: 'Bid retrieved successfully',
        data: { bid }
      });
    } catch (error) {
      next(error);
    }
  };

  updateBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = updateBidSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { bidId } = req.params;
      const freelancerId = (req as any).user.userId;
      
      const updatedBid = await this.bidsService.updateBid(bidId, value, freelancerId);

      res.status(200).json({
        success: true,
        message: 'Bid updated successfully',
        data: { bid: updatedBid }
      });
    } catch (error) {
      next(error);
    }
  };

  updateBidStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = bidStatusSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { bidId } = req.params;
      const clientId = (req as any).user.userId;
      
      const updatedBid = await this.bidsService.updateBidStatus(bidId, value.status, clientId);

      res.status(200).json({
        success: true,
        message: `Bid ${value.status} successfully`,
        data: { bid: updatedBid }
      });
    } catch (error) {
      next(error);
    }
  };

  withdrawBid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bidId } = req.params;
      const freelancerId = (req as any).user.userId;
      
      await this.bidsService.withdrawBid(bidId, freelancerId);

      res.status(200).json({
        success: true,
        message: 'Bid withdrawn successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getGigBids = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gigId } = req.params;
      const clientId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.bidsService.getGigBids(gigId, clientId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Gig bids retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}