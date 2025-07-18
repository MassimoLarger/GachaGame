const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  element: {
    type: String,
    enum: ['fire', 'water', 'earth', 'air', 'light', 'dark'],
    required: true
  },
  type: {
    type: String,
    enum: ['warrior', 'mage', 'archer', 'healer', 'assassin', 'tank'],
    required: true
  },
  stats: {
    baseHp: {
      type: Number,
      required: true
    },
    baseAttack: {
      type: Number,
      required: true
    },
    baseDefense: {
      type: Number,
      required: true
    },
    baseSpeed: {
      type: Number,
      required: true
    },
    baseCritRate: {
      type: Number,
      default: 5
    },
    baseCritDamage: {
      type: Number,
      default: 150
    }
  },
  skills: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['active', 'passive'],
      required: true
    },
    cooldown: {
      type: Number,
      default: 0
    },
    manaCost: {
      type: Number,
      default: 0
    }
  }],
  artwork: {
    portrait: {
      type: String,
      required: true
    },
    fullBody: {
      type: String
    },
    icon: {
      type: String,
      required: true
    }
  },
  dropRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isLimited: {
    type: Boolean,
    default: false
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  lore: {
    type: String
  },
  voiceActor: {
    type: String
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Calculate stats at specific level
characterSchema.methods.getStatsAtLevel = function(level) {
  const growthMultiplier = 1 + (level - 1) * 0.1; // 10% growth per level
  
  return {
    hp: Math.floor(this.stats.baseHp * growthMultiplier),
    attack: Math.floor(this.stats.baseAttack * growthMultiplier),
    defense: Math.floor(this.stats.baseDefense * growthMultiplier),
    speed: Math.floor(this.stats.baseSpeed * growthMultiplier),
    critRate: this.stats.baseCritRate,
    critDamage: this.stats.baseCritDamage
  };
};

// Get rarity multiplier for drop rates
characterSchema.statics.getRarityMultiplier = function(rarity) {
  const multipliers = {
    common: 1,
    rare: 0.3,
    epic: 0.1,
    legendary: 0.01
  };
  return multipliers[rarity] || 1;
};

module.exports = mongoose.model('Character', characterSchema);