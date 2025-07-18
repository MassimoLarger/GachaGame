const mongoose = require('mongoose');
const Character = require('../models/Character');
const Banner = require('../models/Banner');
require('dotenv').config();

// Sample characters data
const sampleCharacters = [
  {
    name: "Aria Flameheart",
    description: "A fierce warrior wielding the power of eternal flames",
    rarity: "legendary",
    element: "fire",
    type: "warrior",
    stats: {
      baseHp: 1200,
      baseAttack: 350,
      baseDefense: 180,
      baseSpeed: 120,
      baseCritRate: 15,
      baseCritDamage: 200
    },
    skills: [
      {
        name: "Inferno Strike",
        description: "Deals massive fire damage to a single enemy",
        type: "active",
        cooldown: 3,
        manaCost: 50
      },
      {
        name: "Flame Aura",
        description: "Increases attack power when HP is below 50%",
        type: "passive"
      }
    ],
    artwork: {
      portrait: "/characters/aria_portrait.png",
      fullBody: "/characters/aria_full.png",
      icon: "/characters/aria_icon.png"
    },
    dropRate: 0.5,
    lore: "Born from the ashes of an ancient volcano, Aria commands respect on every battlefield."
  },
  {
    name: "Luna Stormcaller",
    description: "A mystical mage who controls the winds and storms",
    rarity: "epic",
    element: "air",
    type: "mage",
    stats: {
      baseHp: 800,
      baseAttack: 400,
      baseDefense: 120,
      baseSpeed: 150,
      baseCritRate: 10,
      baseCritDamage: 180
    },
    skills: [
      {
        name: "Lightning Bolt",
        description: "Strikes enemies with powerful lightning",
        type: "active",
        cooldown: 2,
        manaCost: 40
      },
      {
        name: "Storm Shield",
        description: "Reduces incoming damage by 20%",
        type: "passive"
      }
    ],
    artwork: {
      portrait: "/characters/luna_portrait.png",
      fullBody: "/characters/luna_full.png",
      icon: "/characters/luna_icon.png"
    },
    dropRate: 2.0
  },
  {
    name: "Kai Shadowblade",
    description: "A swift assassin who strikes from the shadows",
    rarity: "epic",
    element: "dark",
    type: "assassin",
    stats: {
      baseHp: 700,
      baseAttack: 380,
      baseDefense: 100,
      baseSpeed: 200,
      baseCritRate: 25,
      baseCritDamage: 250
    },
    skills: [
      {
        name: "Shadow Strike",
        description: "Teleports behind enemy and deals critical damage",
        type: "active",
        cooldown: 4,
        manaCost: 60
      },
      {
        name: "Stealth",
        description: "Increases critical hit rate by 15%",
        type: "passive"
      }
    ],
    artwork: {
      portrait: "/characters/kai_portrait.png",
      fullBody: "/characters/kai_full.png",
      icon: "/characters/kai_icon.png"
    },
    dropRate: 2.5
  },
  {
    name: "Elara Lightbringer",
    description: "A holy healer blessed with divine powers",
    rarity: "rare",
    element: "light",
    type: "healer",
    stats: {
      baseHp: 900,
      baseAttack: 200,
      baseDefense: 150,
      baseSpeed: 110,
      baseCritRate: 5,
      baseCritDamage: 150
    },
    skills: [
      {
        name: "Divine Heal",
        description: "Restores HP to all allies",
        type: "active",
        cooldown: 3,
        manaCost: 45
      },
      {
        name: "Blessing",
        description: "Increases team's defense by 10%",
        type: "passive"
      }
    ],
    artwork: {
      portrait: "/characters/elara_portrait.png",
      fullBody: "/characters/elara_full.png",
      icon: "/characters/elara_icon.png"
    },
    dropRate: 8.0
  },
  {
    name: "Gareth Ironshield",
    description: "A stalwart defender with unbreakable resolve",
    rarity: "rare",
    element: "earth",
    type: "tank",
    stats: {
      baseHp: 1500,
      baseAttack: 180,
      baseDefense: 300,
      baseSpeed: 80,
      baseCritRate: 3,
      baseCritDamage: 130
    },
    skills: [
      {
        name: "Shield Wall",
        description: "Protects all allies from damage for 2 turns",
        type: "active",
        cooldown: 5,
        manaCost: 70
      },
      {
        name: "Fortify",
        description: "Increases defense when HP is above 80%",
        type: "passive"
      }
    ],
    artwork: {
      portrait: "/characters/gareth_portrait.png",
      fullBody: "/characters/gareth_full.png",
      icon: "/characters/gareth_icon.png"
    },
    dropRate: 10.0
  },
  {
    name: "Robin Swiftarrow",
    description: "A skilled archer with unmatched precision",
    rarity: "common",
    element: "earth",
    type: "archer",
    stats: {
      baseHp: 600,
      baseAttack: 280,
      baseDefense: 90,
      baseSpeed: 160,
      baseCritRate: 20,
      baseCritDamage: 180
    },
    skills: [
      {
        name: "Piercing Shot",
        description: "Ignores enemy defense",
        type: "active",
        cooldown: 2,
        manaCost: 30
      },
      {
        name: "Eagle Eye",
        description: "Increases accuracy and critical hit rate",
        type: "passive"
      }
    ],
    artwork: {
      portrait: "/characters/robin_portrait.png",
      fullBody: "/characters/robin_full.png",
      icon: "/characters/robin_icon.png"
    },
    dropRate: 25.0
  }
];

// Function to seed characters
const seedCharacters = async () => {
  try {
    // Clear existing characters
    await Character.deleteMany({});
    console.log('Cleared existing characters');

    // Insert sample characters
    const characters = await Character.insertMany(sampleCharacters);
    console.log(`Inserted ${characters.length} characters`);
    
    return characters;
  } catch (error) {
    console.error('Error seeding characters:', error);
    throw error;
  }
};

// Function to seed banners
const seedBanners = async (characters) => {
  try {
    // Clear existing banners
    await Banner.deleteMany({});
    console.log('Cleared existing banners');

    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sampleBanners = [
      {
        name: "Standard Banner",
        description: "The standard banner featuring all available characters",
        type: "standard",
        isActive: true,
        startDate: now,
        endDate: oneMonthLater,
        cost: {
          single: { gems: 160, coins: 0 },
          multi: { gems: 1600, coins: 0, count: 10 }
        },
        featuredCharacters: [],
        availableCharacters: characters.map(char => ({
          characterId: char._id,
          weight: char.rarity === 'legendary' ? 0.5 : 
                  char.rarity === 'epic' ? 2 :
                  char.rarity === 'rare' ? 8 : 25
        })),
        dropRates: {
          common: 50.0,
          rare: 35.0,
          epic: 14.0,
          legendary: 1.0
        },
        artwork: {
          banner: "/banners/standard_banner.png",
          background: "/banners/standard_bg.png",
          icon: "/banners/standard_icon.png"
        }
      },
      {
        name: "Flame Heroes Banner",
        description: "Featured banner with increased rates for fire element characters",
        type: "featured",
        isActive: true,
        startDate: now,
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        cost: {
          single: { gems: 160, coins: 0 },
          multi: { gems: 1600, coins: 0, count: 10 }
        },
        featuredCharacters: characters
          .filter(char => char.element === 'fire')
          .map(char => ({
            characterId: char._id,
            rateUp: 2.0 // 100% rate up
          })),
        availableCharacters: characters.map(char => ({
          characterId: char._id,
          weight: char.element === 'fire' ? 
            (char.rarity === 'legendary' ? 1.0 : 
             char.rarity === 'epic' ? 4 :
             char.rarity === 'rare' ? 16 : 50) :
            (char.rarity === 'legendary' ? 0.25 : 
             char.rarity === 'epic' ? 1 :
             char.rarity === 'rare' ? 4 : 12.5)
        })),
        dropRates: {
          common: 45.0,
          rare: 35.0,
          epic: 18.0,
          legendary: 2.0
        },
        artwork: {
          banner: "/banners/flame_banner.png",
          background: "/banners/flame_bg.png",
          icon: "/banners/flame_icon.png"
        }
      }
    ];

    const banners = await Banner.insertMany(sampleBanners);
    console.log(`Inserted ${banners.length} banners`);
    
    return banners;
  } catch (error) {
    console.error('Error seeding banners:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gacha-game');
    console.log('Connected to MongoDB');

    // Seed data
    const characters = await seedCharacters();
    const banners = await seedBanners(characters);

    console.log('Database seeded successfully!');
    console.log(`Total characters: ${characters.length}`);
    console.log(`Total banners: ${banners.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedCharacters,
  seedBanners,
  sampleCharacters
};