import Joi from 'joi';

// Tribute validation schemas
export const validateTributeSubmission = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    relationship: Joi.string().trim().min(1).max(100).required(),
    message: Joi.string().trim().min(10).max(1000).required(),
    email: Joi.string().email().optional().allow(''),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

// Admin user validation
export const validateAdminRegistration = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).max(100).required(),
    email: Joi.string().email().optional().allow(''),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

// Admin login validation
export const validateAdminLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

// Pagination validation
export const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('approved', 'pending', 'all').default('approved'),
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Invalid pagination parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.pagination = value;
  next();
};

// Candle validation (minimal - just tracking)
export const validateCandleLighting = (req, res, next) => {
  // No validation needed for candle lighting
  // We just track the IP and user agent
  next();
};
