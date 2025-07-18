const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .populate('inventory.characters.characterId')
      .populate('inventory.items.itemId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { username, profile } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }

    // Update profile fields
    if (profile) {
      if (profile.avatar) user.profile.avatar = profile.avatar;
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user inventory
const getInventory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'all' } = req.query;

    const user = await User.findById(userId)
      .populate('inventory.characters.characterId')
      .populate('inventory.items.itemId')
      .select('inventory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let inventory = user.inventory;

    // Filter by type if specified
    if (type === 'characters') {
      inventory = { characters: user.inventory.characters, items: [] };
    } else if (type === 'items') {
      inventory = { characters: [], items: user.inventory.items };
    }

    res.json({
      success: true,
      data: {
        inventory
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user characters with filtering and sorting
const getCharacters = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      rarity, 
      element, 
      type, 
      sortBy = 'obtainedAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const user = await User.findById(userId)
      .populate('inventory.characters.characterId')
      .select('inventory.characters');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let characters = user.inventory.characters;

    // Apply filters
    if (rarity) {
      characters = characters.filter(char => 
        char.characterId.rarity === rarity
      );
    }
    if (element) {
      characters = characters.filter(char => 
        char.characterId.element === element
      );
    }
    if (type) {
      characters = characters.filter(char => 
        char.characterId.type === type
      );
    }

    // Apply sorting
    characters.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'rarity':
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          aValue = rarityOrder[a.characterId.rarity];
          bValue = rarityOrder[b.characterId.rarity];
          break;
        case 'name':
          aValue = a.characterId.name;
          bValue = b.characterId.name;
          break;
        default:
          aValue = new Date(a.obtainedAt);
          bValue = new Date(b.obtainedAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCharacters = characters.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        characters: paginatedCharacters,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(characters.length / limit),
          totalItems: characters.length,
          hasNext: endIndex < characters.length,
          hasPrev: startIndex > 0
        },
        filters: {
          rarity,
          element,
          type,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Level up character
const levelUpCharacter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { characterInstanceId } = req.params;
    const { levels = 1 } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find character in inventory
    const characterIndex = user.inventory.characters.findIndex(
      char => char._id.toString() === characterInstanceId
    );

    if (characterIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Character not found in inventory'
      });
    }

    const character = user.inventory.characters[characterIndex];
    const levelUpCost = calculateLevelUpCost(character.level, levels);

    // Check if user has enough coins
    if (user.currency.coins < levelUpCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins for level up'
      });
    }

    // Level up character
    character.level += levels;
    character.experience = 0; // Reset experience after level up
    
    // Deduct coins
    user.spendCurrency('coins', levelUpCost);

    await user.save();

    res.json({
      success: true,
      message: 'Character leveled up successfully',
      data: {
        character,
        costPaid: levelUpCost,
        remainingCoins: user.currency.coins
      }
    });
  } catch (error) {
    console.error('Level up character error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to calculate level up cost
function calculateLevelUpCost(currentLevel, levels) {
  let totalCost = 0;
  for (let i = 0; i < levels; i++) {
    totalCost += (currentLevel + i) * 100; // 100 coins per level * current level
  }
  return totalCost;
}

// Get user statistics
const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .populate('inventory.characters.characterId')
      .select('profile currency inventory gachaHistory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate statistics
    const stats = {
      profile: user.profile,
      currency: user.currency,
      totalCharacters: user.inventory.characters.length,
      totalPulls: user.gachaHistory.length,
      charactersByRarity: {
        common: user.inventory.characters.filter(c => c.characterId.rarity === 'common').length,
        rare: user.inventory.characters.filter(c => c.characterId.rarity === 'rare').length,
        epic: user.inventory.characters.filter(c => c.characterId.rarity === 'epic').length,
        legendary: user.inventory.characters.filter(c => c.characterId.rarity === 'legendary').length
      },
      averageCharacterLevel: user.inventory.characters.length > 0 
        ? user.inventory.characters.reduce((sum, char) => sum + char.level, 0) / user.inventory.characters.length
        : 0,
      totalGemsSpent: user.gachaHistory.reduce((sum, pull) => sum + pull.cost, 0)
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getInventory,
  getCharacters,
  levelUpCharacter,
  getStats
};