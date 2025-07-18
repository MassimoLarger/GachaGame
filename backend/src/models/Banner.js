const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'featured', 'limited', 'weapon'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  cost: {
    single: {
      gems: {
        type: Number,
        default: 160
      },
      coins: {
        type: Number,
        default: 0
      }
    },
    multi: {
      gems: {
        type: Number,
        default: 1600
      },
      coins: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 10
      }
    }
  },
  featuredCharacters: [{
    characterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true
    },
    rateUp: {
      type: Number,
      default: 1.5 // 50% rate up
    }
  }],
  availableCharacters: [{
    characterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character',
      required: true
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  guaranteedRates: {
    fourStar: {
      type: Number,
      default: 10 // 10 pulls guarantee
    },
    fiveStar: {
      type: Number,
      default: 90 // 90 pulls guarantee (pity system)
    }
  },
  dropRates: {
    common: {
      type: Number,
      default: 50.0
    },
    rare: {
      type: Number,
      default: 35.0
    },
    epic: {
      type: Number,
      default: 14.0
    },
    legendary: {
      type: Number,
      default: 1.0
    }
  },
  artwork: {
    banner: {
      type: String,
      required: true
    },
    background: {
      type: String
    },
    icon: {
      type: String,
      required: true
    }
  },
  totalPulls: {
    type: Number,
    default: 0
  },
  statistics: {
    totalUsers: {
      type: Number,
      default: 0
    },
    averagePulls: {
      type: Number,
      default: 0
    },
    mostPulledCharacter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character'
    }
  }
}, {
  timestamps: true
});

// Check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Calculate actual drop rate for a character
bannerSchema.methods.getCharacterDropRate = function(characterId) {
  const character = this.availableCharacters.find(char => 
    char.characterId.toString() === characterId.toString()
  );
  
  if (!character) return 0;
  
  const featured = this.featuredCharacters.find(feat => 
    feat.characterId.toString() === characterId.toString()
  );
  
  let baseRate = character.weight;
  if (featured) {
    baseRate *= featured.rateUp;
  }
  
  return baseRate;
};

// Get time remaining
bannerSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  const timeLeft = this.endDate - now;
  
  if (timeLeft <= 0) return null;
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

module.exports = mongoose.model('Banner', bannerSchema);