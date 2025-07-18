const User = require('../models/User');
const Banner = require('../models/Banner');
const Character = require('../models/Character');

// Get all active banners
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .populate('featuredCharacters.characterId')
      .populate('availableCharacters.characterId')
      .sort({ createdAt: -1 });

    const bannersWithTimeRemaining = banners.map(banner => {
      const bannerObj = banner.toObject();
      bannerObj.timeRemaining = banner.getTimeRemaining();
      bannerObj.isCurrentlyActive = banner.isCurrentlyActive();
      return bannerObj;
    });

    res.json({
      success: true,
      data: {
        banners: bannersWithTimeRemaining
      }
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get specific banner details
const getBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const banner = await Banner.findById(bannerId)
      .populate('featuredCharacters.characterId')
      .populate('availableCharacters.characterId');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const bannerObj = banner.toObject();
    bannerObj.timeRemaining = banner.getTimeRemaining();
    bannerObj.isCurrentlyActive = banner.isCurrentlyActive();

    res.json({
      success: true,
      data: {
        banner: bannerObj
      }
    });
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Perform gacha pull
const performPull = async (req, res) => {
  try {
    const { bannerId, pullType = 'single' } = req.body;
    const userId = req.user.userId;

    // Find banner
    const banner = await Banner.findById(bannerId)
      .populate('availableCharacters.characterId');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    if (!banner.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        message: 'Banner is not currently active'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine pull count and cost
    const pullCount = pullType === 'multi' ? banner.cost.multi.count : 1;
    const cost = pullType === 'multi' ? banner.cost.multi : banner.cost.single;

    // Check if user has enough currency
    if (user.currency.gems < cost.gems || user.currency.coins < cost.coins) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient currency'
      });
    }

    // Perform pulls
    const results = [];
    for (let i = 0; i < pullCount; i++) {
      const result = performSinglePull(banner, user);
      results.push(result);
      
      // Add to user's inventory
      if (result.type === 'character') {
        user.addCharacter(result.item._id);
      }
      
      // Add to gacha history
      user.gachaHistory.push({
        bannerId: banner._id,
        result: result.type,
        resultId: result.item._id,
        rarity: result.rarity,
        cost: cost.gems,
        pulledAt: new Date()
      });
    }

    // Deduct currency
    user.spendCurrency('gems', cost.gems);
    user.spendCurrency('coins', cost.coins);

    // Update banner statistics
    banner.totalPulls += pullCount;
    
    // Save changes
    await user.save();
    await banner.save();

    res.json({
      success: true,
      data: {
        results,
        remainingCurrency: user.currency,
        pullType,
        totalCost: cost
      }
    });
  } catch (error) {
    console.error('Perform pull error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to perform a single pull
function performSinglePull(banner, user) {
  // Generate random number for rarity
  const random = Math.random() * 100;
  let rarity;
  
  if (random < banner.dropRates.legendary) {
    rarity = 'legendary';
  } else if (random < banner.dropRates.legendary + banner.dropRates.epic) {
    rarity = 'epic';
  } else if (random < banner.dropRates.legendary + banner.dropRates.epic + banner.dropRates.rare) {
    rarity = 'rare';
  } else {
    rarity = 'common';
  }

  // Filter available characters by rarity
  const availableByRarity = banner.availableCharacters.filter(char => 
    char.characterId.rarity === rarity
  );

  if (availableByRarity.length === 0) {
    // Fallback to common if no characters of selected rarity
    const commonChars = banner.availableCharacters.filter(char => 
      char.characterId.rarity === 'common'
    );
    if (commonChars.length > 0) {
      const randomIndex = Math.floor(Math.random() * commonChars.length);
      return {
        type: 'character',
        item: commonChars[randomIndex].characterId,
        rarity: 'common',
        isNew: !user.inventory.characters.some(char => 
          char.characterId.toString() === commonChars[randomIndex].characterId._id.toString()
        )
      };
    }
  }

  // Select random character from available rarity
  const randomIndex = Math.floor(Math.random() * availableByRarity.length);
  const selectedCharacter = availableByRarity[randomIndex];

  return {
    type: 'character',
    item: selectedCharacter.characterId,
    rarity: selectedCharacter.characterId.rarity,
    isNew: !user.inventory.characters.some(char => 
      char.characterId.toString() === selectedCharacter.characterId._id.toString()
    )
  };
}

// Get user's gacha history
const getGachaHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'gachaHistory.bannerId',
        select: 'name type'
      })
      .populate({
        path: 'gachaHistory.resultId'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Paginate gacha history
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = user.gachaHistory
      .sort((a, b) => new Date(b.pulledAt) - new Date(a.pulledAt))
      .slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        history: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(user.gachaHistory.length / limit),
          totalItems: user.gachaHistory.length,
          hasNext: endIndex < user.gachaHistory.length,
          hasPrev: startIndex > 0
        }
      }
    });
  } catch (error) {
    console.error('Get gacha history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getBanners,
  getBanner,
  performPull,
  getGachaHistory
};