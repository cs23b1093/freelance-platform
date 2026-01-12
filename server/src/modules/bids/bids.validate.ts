import Joi from 'joi';

export const createBidSchema = Joi.object({
  gigId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid gig ID format',
    'any.required': 'Gig ID is required'
  }),
  amount: Joi.number().min(5).required().messages({
    'number.min': 'Minimum bid amount is $5',
    'any.required': 'Bid amount is required'
  }),
  deliveryTime: Joi.number().min(1).max(365).required().messages({
    'number.min': 'Minimum delivery time is 1 day',
    'number.max': 'Maximum delivery time is 365 days',
    'any.required': 'Delivery time is required'
  }),
  proposal: Joi.string().min(50).max(1000).required().messages({
    'string.min': 'Proposal must be at least 50 characters long',
    'string.max': 'Proposal cannot exceed 1000 characters',
    'any.required': 'Proposal is required'
  }),
  attachments: Joi.array().items(
    Joi.string().uri().pattern(/\.(pdf|doc|docx|txt|jpg|jpeg|png|gif)$/i)
  ).max(3).optional().messages({
    'array.max': 'Maximum 3 attachments allowed'
  })
});

export const updateBidSchema = Joi.object({
  amount: Joi.number().min(5).optional(),
  deliveryTime: Joi.number().min(1).max(365).optional(),
  proposal: Joi.string().min(50).max(1000).optional(),
  attachments: Joi.array().items(
    Joi.string().uri().pattern(/\.(pdf|doc|docx|txt|jpg|jpeg|png|gif)$/i)
  ).max(3).optional()
});

export const bidStatusSchema = Joi.object({
  status: Joi.string().valid('accepted', 'rejected').required().messages({
    'any.only': 'Status must be either accepted or rejected',
    'any.required': 'Status is required'
  })
});

export const bidQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  status: Joi.string().valid('pending', 'accepted', 'rejected', 'withdrawn').optional(),
  gigId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  sortBy: Joi.string().valid('createdAt', 'amount', 'deliveryTime').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});