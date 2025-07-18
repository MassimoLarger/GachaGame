const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getInventory,
  getCharacters,
  levelUpCharacter,
  getStats
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('profile.avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

const levelUpValidation = [
  param('characterInstanceId')
    .isMongoId()
    .withMessage('Invalid character ID'),
  body('levels')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Levels must be between 1 and 10')
];

const inventoryQueryValidation = [
  query('type')
    .optional()
    .isIn(['all', 'characters', 'items'])
    .withMessage('Type must be all, characters, or items')
];

const charactersQueryValidation = [
  query('rarity')
    .optional()
    .isIn(['common', 'rare', 'epic', 'legendary'])
    .withMessage('Invalid rarity'),
  query('element')
    .optional()
    .isIn(['fire', 'water', 'earth', 'air', 'light', 'dark'])
    .withMessage('Invalid element'),
  query('type')
    .optional()
    .isIn(['warrior', 'mage', 'archer', 'healer', 'assassin', 'tank'])
    .withMessage('Invalid character type'),
  query('sortBy')
    .optional()
    .isIn(['obtainedAt', 'level', 'rarity', 'name'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
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

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfileValidation, updateProfile);

// @route   GET /api/user/inventory
// @desc    Get user inventory
// @access  Private
router.get('/inventory', inventoryQueryValidation, getInventory);

// @route   GET /api/user/characters
// @desc    Get user characters with filtering and sorting
// @access  Private
router.get('/characters', charactersQueryValidation, getCharacters);

// @route   POST /api/user/characters/:characterInstanceId/levelup
// @desc    Level up a character
// @access  Private
router.post('/characters/:characterInstanceId/levelup', levelUpValidation, levelUpCharacter);

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', getStats);

module.exports = router;