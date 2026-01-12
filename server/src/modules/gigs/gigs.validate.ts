import Joi from 'joi';

export const createGigSchema = Joi.object({
  title: Joi.string().min(10).max(100).required().messages({
    'string.min': 'Title must be at least 10 characters long',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().min(50).max(1000).required().messages({
    'string.min': 'Description must be at least 50 characters long',
    'string.max': 'Description cannot exceed 1000 characters',
    'any.required': 'Description is required'
  }),
  category: Joi.string().required().messages({
    'any.required': 'Category is required'
  }),
  subcategory: Joi.string().required().messages({
    'any.required': 'Subcategory is required'
  }),
  tags: Joi.array().items(Joi.string().trim()).min(1).max(10).required().messages({
    'array.min': 'At least one tag is required',
    'array.max': 'Maximum 10 tags allowed',
    'any.required': 'Tags are required'
  }),
  pricing: Joi.object({
    type: Joi.string().valid('fixed', 'hourly').required(),
    amount: Joi.number().min(5).required().messages({
      'number.min': 'Minimum price is $5',
      'any.required': 'Price amount is required'
    })
  }).required(),
  deliveryTime: Joi.number().min(1).max(365).required().messages({
    'number.min': 'Minimum delivery time is 1 day',
    'number.max': 'Maximum delivery time is 365 days',
    'any.required': 'Delivery time is required'
  }),
  revisions: Joi.number().min(0).max(10).required().messages({
    'number.min': 'Minimum revisions is 0',
    'number.max': 'Maximum revisions is 10',
    'any.required': 'Number of revisions is required'
  }),
  requirements: Joi.array().items(Joi.string().trim()).optional(),
  images: Joi.array().items(
    Joi.string().uri().pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
  ).min(1).max(5).required().messages({
    'array.min': 'At least one image is required',
    'array.max': 'Maximum 5 images allowed',
    'any.required': 'Images are required'
  })
});

export const updateGigSchema = Joi.object({
  title: Joi.string().min(10).max(100).optional(),
  description: Joi.string().min(50).max(1000).optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().trim()).min(1).max(10).optional(),
  pricing: Joi.object({
    type: Joi.string().valid('fixed', 'hourly').required(),
    amount: Joi.number().min(5).required()
  }).optional(),
  deliveryTime: Joi.number().min(1).max(365).optional(),
  revisions: Joi.number().min(0).max(10).optional(),
  requirements: Joi.array().items(Joi.string().trim()).optional(),
  images: Joi.array().items(
    Joi.string().uri().pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
  ).min(1).max(5).optional(),
  isActive: Joi.boolean().optional()
});

export const gigQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  deliveryTime: Joi.number().min(1).max(365).optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string().valid('createdAt', 'rating', 'price', 'deliveryTime').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});