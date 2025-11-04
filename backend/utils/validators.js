const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
const userValidationRules = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 20, max: 60 })
      .withMessage('Name must be between 20 and 60 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8, max: 16 })
      .withMessage('Password must be between 8 and 16 characters')
      .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain at least one uppercase letter and one special character'),
    body('address')
      .optional()
      .isLength({ max: 400 })
      .withMessage('Address must not exceed 400 characters'),
  ];
};

const storeValidationRules = () => {
  return [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Store name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('address')
      .optional()
      .isLength({ max: 400 })
      .withMessage('Address must not exceed 400 characters'),
  ];
};

const ratingValidationRules = () => {
  return [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('store_id')
      .isInt()
      .withMessage('Store ID must be a valid integer'),
  ];
};

const passwordUpdateValidationRules = () => {
  return [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8, max: 16 })
      .withMessage('Password must be between 8 and 16 characters')
      .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain at least one uppercase letter and one special character'),
  ];
};

module.exports = {
  validate,
  userValidationRules,
  storeValidationRules,
  ratingValidationRules,
  passwordUpdateValidationRules,
};