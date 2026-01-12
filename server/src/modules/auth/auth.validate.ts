import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'any.required': 'Last name is required'
    }),
  role: Joi.string()
    .valid('freelancer', 'client')
    .required()
    .messages({
      'any.only': 'Role must be either freelancer or client',
      'any.required': 'Role is required'
    }),
  bio: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Bio cannot exceed 1000 characters'
    }),
  skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 skills allowed'
    }),
  hourlyRate: Joi.number()
    .min(5)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Hourly rate must be at least $5',
      'number.max': 'Hourly rate cannot exceed $1000'
    }),
  location: Joi.object({
    country: Joi.string().trim().optional(),
    city: Joi.string().trim().optional()
  }).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  rememberMe: Joi.boolean().optional()
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional(),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional(),
  bio: Joi.string()
    .max(1000)
    .optional(),
  skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(20)
    .optional(),
  hourlyRate: Joi.number()
    .min(5)
    .max(1000)
    .optional(),
  location: Joi.object({
    country: Joi.string().trim().optional(),
    city: Joi.string().trim().optional()
  }).optional(),
  languages: Joi.array()
    .items(Joi.object({
      language: Joi.string().required(),
      proficiency: Joi.string().valid('basic', 'conversational', 'fluent', 'native').required()
    }))
    .max(10)
    .optional(),
  socialLinks: Joi.object({
    linkedin: Joi.string().uri().pattern(/^https?:\/\/(www\.)?linkedin\.com\/.*/).optional(),
    github: Joi.string().uri().pattern(/^https?:\/\/(www\.)?github\.com\/.*/).optional(),
    website: Joi.string().uri().optional(),
    twitter: Joi.string().uri().pattern(/^https?:\/\/(www\.)?twitter\.com\/.*/).optional()
  }).optional()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New passwords do not match',
      'any.required': 'New password confirmation is required'
    })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});