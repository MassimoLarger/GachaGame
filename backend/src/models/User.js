const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    avatar: {
      type: String,
      default: '/avatars/default.png'
    }
  },
  currency: {
    gems: {
      type: Number,
      default: 1000
    },
    coins: {
      type: Number,
      default: 10000
    }
  },
  inventory: {
    characters: [{
      characterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character'
      },
      level: {
        type: Number,
        default: 1
      },
      experience: {
        type: Number,
        default: 0
      },
      obtainedAt: {
        type: Date,
        default: Date.now
      }
    }],
    items: [{
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      },
      quantity: {
        type: Number,
        default: 1
      }
    }]
  },
  gachaHistory: [{
    bannerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Banner'
    },
    result: {
      type: String,
      enum: ['character', 'item']
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary']
    },
    cost: {
      type: Number
    },
    pulledAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add character to inventory
userSchema.methods.addCharacter = function(characterId, level = 1) {
  this.inventory.characters.push({
    characterId,
    level,
    experience: 0,
    obtainedAt: new Date()
  });
};

// Add item to inventory
userSchema.methods.addItem = function(itemId, quantity = 1) {
  const existingItem = this.inventory.items.find(item => 
    item.itemId.toString() === itemId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.inventory.items.push({ itemId, quantity });
  }
};

// Spend currency
userSchema.methods.spendCurrency = function(type, amount) {
  if (this.currency[type] >= amount) {
    this.currency[type] -= amount;
    return true;
  }
  return false;
};

// Add currency
userSchema.methods.addCurrency = function(type, amount) {
  this.currency[type] += amount;
};

module.exports = mongoose.model('User', userSchema);