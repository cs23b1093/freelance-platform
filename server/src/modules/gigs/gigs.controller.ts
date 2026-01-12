import { Request, Response, NextFunction } from 'express';
import { GigsService } from './gigs.service';
import { createGigSchema, updateGigSchema, gigQuerySchema } from './gigs.validate';
import ApiError from '../../utils/apierror';

export class GigsController {
  private gigsService: GigsService;

  constructor() {
    this.gigsService = new GigsService();
  }

  createGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = createGigSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const freelancerId = (req as any).user.userId;
      const gig = await this.gigsService.createGig(value, freelancerId);

      res.status(201).json({
        success: true,
        message: 'Gig created successfully',
        data: { gig }
      });
    } catch (error) {
      next(error);
    }
  };

  getGigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = gigQuerySchema.validate(req.query);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const result = await this.gigsService.getGigs(value);

      res.status(200).json({
        success: true,
        message: 'Gigs retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getGigById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gigId } = req.params;
      const gig = await this.gigsService.getGigById(gigId);

      if (!gig) {
        throw new ApiError(404, 'Gig not found');
      }

      res.status(200).json({
        success: true,
        message: 'Gig retrieved successfully',
        data: { gig }
      });
    } catch (error) {
      next(error);
    }
  };

  updateGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = updateGigSchema.validate(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const { gigId } = req.params;
      const freelancerId = (req as any).user.userId;
      
      const updatedGig = await this.gigsService.updateGig(gigId, value, freelancerId);

      res.status(200).json({
        success: true,
        message: 'Gig updated successfully',
        data: { gig: updatedGig }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gigId } = req.params;
      const freelancerId = (req as any).user.userId;
      
      await this.gigsService.deleteGig(gigId, freelancerId);

      res.status(200).json({
        success: true,
        message: 'Gig deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getMyGigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const freelancerId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.gigsService.getFreelancerGigs(freelancerId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Your gigs retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}