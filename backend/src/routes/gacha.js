const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  getBanners,
  getBanner,
  performPull,
  getGachaHistory
} = require('../controllers/gachaController');

const router = express.Router();

// Validation rules
const bannerParamValidation = [
  param('bannerId')
    .isMongoId()
    .withMessage('Invalid banner ID')
];

const pullValidation = [
  body('bannerId')
    .isMongoId()
    .withMessage('Invalid banner ID'),
  body('pullType')
    .optional()
    .isIn(['single', 'multi'])
    .withMessage('Pull type must be single or multi')
];

const historyQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Routes

// @route   GET /api/gacha/banners
// @desc    Get all active banners
// @access  Public (but can show user-specific info if authenticated)
router.get('/banners', optionalAuth, getBanners);

// @route   GET /api/gacha/banners/:bannerId
// @desc    Get specific banner details
// @access  Public (but can show user-specific info if authenticated)
router.get('/banners/:bannerId', bannerParamValidation, optionalAuth, getBanner);

// @route   POST /api/gacha/pull
// @desc    Perform gacha pull
// @access  Private
router.post('/pull', pullValidation, authenticateToken, performPull);

// @route   GET /api/gacha/history
// @desc    Get user's gacha history
// @access  Private
router.get('/history', historyQueryValidation, authenticateToken, getGachaHistory);

module.exports = router;