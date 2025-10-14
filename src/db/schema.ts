import Dexie, { type EntityTable } from 'dexie';

// Database models
export interface Friend {
  id?: number;
  name: string;
  avatarUrl?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  
  // Physical Stats
  age?: number;
  height?: string; // e.g., "5'10", "180cm"
  weight?: string; // e.g., "150 lbs", "70kg"
  bodyType?: 'Slim' | 'Athletic' | 'Average' | 'Muscular' | 'Chubby' | 'Bear' | 'Daddy' | 'Twink' | 'Otter' | 'Other';
  ethnicity?: string;
  
  // Sexual Details
  sexualRole?: 'Top' | 'Bottom' | 'Versatile' | 'Vers Top' | 'Vers Bottom' | 'Side' | 'Unknown';
  dickSize?: string; // e.g., "6 inches", "15cm"
  dickType?: 'Cut' | 'Uncut' | 'Unknown';
  
  // Preferences & Kinks
  preferences?: string[]; // Array of kinks/preferences
  limits?: string[]; // Hard limits/things they don't do
  
  // Social & Contact Info
  metOn?: 'Grindr' | 'Romeo' | 'Hunqz' | 'Tinder' | 'Instagram' | 'Website' | 'Bar/Club' | 'Friend Intro' | 'Work' | 'Gym' | 'Other';
  socialProfiles?: {
    grindr?: string;
    romeo?: string;
    hunqz?: string;
    tinder?: string;
    instagram?: string;
    twitter?: string;
    telegram?: string;
    whatsapp?: string;
    phone?: string;
    email?: string;
  };
  
  // Photos & Media
  photos?: string[]; // Array of base64 encoded images or URLs
  
  // Health & Safety
  lastTested?: Date;
  hivStatus?: 'Negative' | 'Positive Undetectable' | 'Positive' | 'Unknown' | 'Prefer Not to Say';
  onPrep?: boolean;
  
  // Relationship Status
  relationshipStatus?: 'Single' | 'Taken' | 'Open Relationship' | 'Married' | 'Complicated' | 'Unknown';
  
  // Rating & Compatibility
  overallRating?: number; // 1-5 stars
  sexRating?: number; // 1-5 stars for sexual performance
  personalityRating?: number; // 1-5 stars for personality
  
  // Location & Availability
  location?: string;
  canHost?: boolean;
  canTravel?: boolean;
  
  // Additional Details
  occupation?: string;
  languages?: string[];
  tags?: string[]; // Custom tags like "good kisser", "kinky", "vanilla", etc.
}

export interface InteractionType {
  id?: number;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Encounter {
  id?: number;
  date: Date;
  rating: number; // 1-5 overall experience
  sexRating?: number; // 1-5 sexual performance
  location?: {
    lat: number;
    lon: number;
    place?: string;
  };
  participants: number[]; // friend IDs
  isAnonymous: boolean;
  typeId: number;
  beneficiary: 'me' | 'friend' | 'both';
  durationMinutes?: number;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // Sexual Details
  myRole?: 'Top' | 'Bottom' | 'Versatile' | 'Side';
  theirRole?: 'Top' | 'Bottom' | 'Versatile' | 'Side';
  condomUsed?: boolean;
  
  // Activities Performed (references to InteractionType IDs)
  activitiesPerformed?: number[];
  
  // Experience Details
  wouldRepeat?: boolean;
  chemistry?: number; // 1-5
  kinkiness?: number; // 1-5
  
  // Health & Safety
  discussedStatus?: boolean;
  feelsSafe?: boolean;
  
  // Photos/Media from encounter
  photos?: string[];
  
  // Follow-up
  exchangedContacts?: boolean;
  plannedMeetAgain?: boolean;
  
  // Payment/Financial Details
  isPaid?: boolean;
  paymentType?: 'received' | 'given'; // Who paid whom
  amountAsked?: number; // What was initially requested
  amountGiven?: number; // What was actually paid
  currency?: string; // e.g., 'USD', 'EUR', 'GBP'
  amountAskedUSD?: number; // USD conversion at time of entry
  amountGivenUSD?: number; // USD conversion at time of entry
  exchangeRate?: number; // Rate used for conversion (for reference)
  paymentMethod?: 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other';
  paymentNotes?: string; // Additional context about payment
}

export interface Settings {
  id?: number;
  scoringWeights: {
    frequency: number;
    recency: number;
    quality: number;
    mutuality: number;
  };
  defaultRating: number;
  defaultTypeId?: number;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'none';
}

// Final Activities List - Hardcoded, No Changes Allowed
export const GAY_ACTIVITIES = [
  { name: '69', color: '#9C27B0', icon: '♋' },
  { name: 'Afternoon Delight', color: '#F39C12', icon: '☀️' },
  { name: 'Anal (Bottoming)', color: '#96CEB4', icon: '🍑' },
  { name: 'Anal (Topping)', color: '#45B7D1', icon: '🍆' },
  { name: 'Armpit Worship', color: '#AED6F1', icon: '💪' },
  { name: 'Ass Worship', color: '#F8C471', icon: '🍑' },
  { name: 'Bareback', color: '#DC7633', icon: '🚫' },
  { name: 'BDSM Dom', color: '#2C3E50', icon: '⛓️' },
  { name: 'BDSM Sub', color: '#6D4C41', icon: '�' },
  { name: 'Beach/Water', color: '#5DADE2', icon: '🏖️' },
  { name: 'Birthday Special', color: '#F7DC6F', icon: '🎂' },
  { name: 'Blindfolded', color: '#2C3E50', icon: '�‍🦯' },
  { name: 'Body Contact/Massage', color: '#F8C471', icon: '💆' },
  { name: 'Body Shots', color: '#85C1E9', icon: '🥃' },
  { name: 'Body Worship', color: '#A569BD', icon: '🛐' },
  { name: 'Bondage', color: '#1C2833', icon: '🪢' },
  { name: 'Breath Play', color: '#8E44AD', icon: '�' },
  { name: 'Breeding/Cum Play', color: '#CD6155', icon: '🥛' },
  { name: 'Butt Plug', color: '#FF9800', icon: '🔌' },
  { name: 'Cam Session', color: '#A9DFBF', icon: '💻' },
  { name: 'Car Play', color: '#2980B9', icon: '🚗' },
  { name: 'Car Sex', color: '#66BB6A', icon: '�' },
  { name: 'Champagne/Alcohol', color: '#F4D03F', icon: '🥂' },
  { name: 'Clothed Sex', color: '#5499C7', icon: '👔' },
  { name: 'Cock Ring', color: '#8E44AD', icon: '⭕' },
  { name: 'Cock Worship', color: '#D35400', icon: '🙏' },
  { name: 'Coffee Date', color: '#8D6E63', icon: '☕' },
  { name: 'Collar/Leash', color: '#34495E', icon: '�' },
  { name: 'Cruising', color: '#5DADE2', icon: '🚶' },
  { name: 'Cum Swapping', color: '#F7DC6F', icon: '🔄' },
  { name: 'Daddy/Son Play', color: '#0097A7', icon: '👨‍�' },
  { name: 'Deep Throat', color: '#9B59B6', icon: '🎤' },
  { name: 'Dildo Play', color: '#E65100', icon: '🍆' },
  { name: 'Dildo/Vibrator', color: '#D35400', icon: '🍆' },
  { name: 'Dinner Date', color: '#795548', icon: '🍽️' },
  { name: 'Double Penetration', color: '#880E4F', icon: '🔀' },
  { name: 'Drinks', color: '#9C27B0', icon: '🍸' },
  { name: 'Edging', color: '#F39C12', icon: '🎯' },
  { name: 'Electro Stimulation', color: '#F39C12', icon: '⚡' },
  { name: 'Face Fucking', color: '#8E44AD', icon: '�' },
  { name: 'Feet/Foot Worship', color: '#D7BDE2', icon: '🦶' },
  { name: 'Fingering', color: '#9C27B0', icon: '�' },
  { name: 'First Time Together', color: '#AED6F1', icon: '🆕' },
  { name: 'Fisting (Giving)', color: '#E74C3C', icon: '✊' },
  { name: 'Fisting (Receiving)', color: '#C0392B', icon: '�️' },
  { name: 'Flip Fucking', color: '#F39C12', icon: '�' },
  { name: 'Food Play', color: '#F7DC6F', icon: '🍯' },
  { name: 'Foot Fetish', color: '#FF5722', icon: '🦶' },
  { name: 'Frotting/Grinding', color: '#85C1E9', icon: '�' },
  { name: 'Gagged', color: '#8E44AD', icon: '🤐' },
  { name: 'Gang Bang', color: '#AD1457', icon: '�' },
  { name: 'Gentle/Romantic', color: '#F8BBD9', icon: '💕' },
  { name: 'Glory Hole', color: '#AF7AC5', icon: '🕳️' },
  { name: 'Goodbye Sex', color: '#85929E', icon: '👋' },
  { name: 'Group (4+)', color: '#229954', icon: '👨‍👨‍👦‍👦' },
  { name: 'Group Orgy', color: '#C2185B', icon: '👨‍👨‍👦‍👦' },
  { name: 'Gym/Locker Room', color: '#EC7063', icon: '🏋️' },
  { name: 'Handjob (Giving)', color: '#98D8C8', icon: '✋' },
  { name: 'Handjob (Receiving)', color: '#66BB6A', icon: '✊' },
  { name: 'Holiday Celebration', color: '#58D68D', icon: '🎊' },
  { name: 'Hotel/Travel', color: '#F8C471', icon: '🏨' },
  { name: 'Ice Play', color: '#AED6F1', icon: '🧊' },
  { name: 'Jockstrap', color: '#27AE60', icon: '🩲' },
  { name: 'Just Chatting', color: '#607D8B', icon: '💬' },
  { name: 'Kissing/Making Out', color: '#F1948A', icon: '💋' },
  { name: 'Late Night', color: '#34495E', icon: '�' },
  { name: 'Leather/Fetish', color: '#1C2833', icon: '�' },
  { name: 'Leather/Rubber', color: '#3E2723', icon: '🧥' },
  { name: 'Live Streaming', color: '#85C1E9', icon: '�' },
  { name: 'Makeout Session', color: '#FF69B4', icon: '💋' },
  { name: 'Makeup Sex', color: '#F1948A', icon: '�' },
  { name: 'Marathon (3+ hrs)', color: '#673AB7', icon: '🌙' },
  { name: 'Marathon Session', color: '#85929E', icon: '⏰' },
  { name: 'Moaning/Vocal', color: '#D7BDE2', icon: '🎵' },
  { name: 'Morning Sex', color: '#F7DC6F', icon: '🌅' },
  { name: 'Multiple Orgasms', color: '#E67E22', icon: '🎆' },
  { name: 'Muscle Worship', color: '#5DADE2', icon: '💪' },
  { name: 'Mutual Masturbation', color: '#BB8FCE', icon: '🤝' },
  { name: 'Nipple Play', color: '#AED6F1', icon: '🎯' },
  { name: 'Office/Work', color: '#85929E', icon: '🏢' },
  { name: 'Oil/Lube Play', color: '#F4D03F', icon: '🛢️' },
  { name: 'Oral (Giving)', color: '#FF6B35', icon: '👄' },
  { name: 'Oral (Receiving)', color: '#4ECDC4', icon: '�' },
  { name: 'Orgasm Denial', color: '#8E44AD', icon: '⏸️' },
  { name: 'Orgy', color: '#196F3D', icon: '🎉' },
  { name: 'Outdoors/Nature', color: '#58D68D', icon: '🌲' },
  { name: 'Overnight', color: '#5499C7', icon: '🌙' },
  { name: 'Paddle/Crop', color: '#E74C3C', icon: '🏏' },
  { name: 'Phone/Video Sex', color: '#D7BDE2', icon: '�' },
  { name: 'Photography/Recording', color: '#AED6F1', icon: '📸' },
  { name: 'Planned/Romantic', color: '#F8BBD9', icon: '🌹' },
  { name: 'Poppers', color: '#F39C12', icon: '💨' },
  { name: 'Power Bottom', color: '#E74C3C', icon: '👑' },
  { name: 'Prostate Massage', color: '#3498DB', icon: '�‍♂️' },
  { name: 'Public Sex', color: '#4CAF50', icon: '�' },
  { name: 'Public/Semi-Public', color: '#16A085', icon: '🏞️' },
  { name: 'Pup Play', color: '#00838F', icon: '�' },
  { name: 'Quick/Lunch Break', color: '#F0B27A', icon: '⚡' },
  { name: 'Quickie (<30min)', color: '#FFD700', icon: '⚡' },
  { name: 'Reunion Sex', color: '#A569BD', icon: '🤗' },
  { name: 'Rimming (Giving)', color: '#FFEAA7', icon: '👅' },
  { name: 'Rimming (Receiving)', color: '#DDA0DD', icon: '🌟' },
  { name: 'Role Play', color: '#9B59B6', icon: '�' },
  { name: 'Roleplay', color: '#00BCD4', icon: '🎭' },
  { name: 'Romantic/Vanilla', color: '#E91E63', icon: '💕' },
  { name: 'Rough Play', color: '#EC7063', icon: '💥' },
  { name: 'Rough/Aggressive', color: '#F44336', icon: '💢' },
  { name: 'Safe/Condom', color: '#58D68D', icon: '✅' },
  { name: 'Sauna/Bathhouse', color: '#81C784', icon: '🧖‍♂️' },
  { name: 'Sauna/Spa', color: '#F7DC6F', icon: '🧖' },
  { name: 'Scat Play', color: '#FF8A65', icon: '�' },
  { name: 'Scent/Musk Play', color: '#A9DFBF', icon: '�' },
  { name: 'Service Top', color: '#27AE60', icon: '🎯' },
  { name: 'Sexting/Nudes', color: '#F1948A', icon: '📨' },
  { name: 'Shower/Bath', color: '#3498DB', icon: '🚿' },
  { name: 'Side by Side', color: '#85C1E9', icon: '↔️' },
  { name: 'Sleepover', color: '#D7BDE2', icon: '😴' },
  { name: 'Smoking Fetish', color: '#D5A6BD', icon: '🚬' },
  { name: 'Snowballing', color: '#AED6F1', icon: '❄️' },
  { name: 'Sock/Sneaker Fetish', color: '#85929E', icon: '🧦' },
  { name: 'Spanking (Giving)', color: '#E74C3C', icon: '✋' },
  { name: 'Spanking (Receiving)', color: '#C0392B', icon: '🍑' },
  { name: 'Spit Play', color: '#85C1E9', icon: '💧' },
  { name: 'Spontaneous', color: '#E67E22', icon: '💥' },
  { name: 'Threesome (MMM)', color: '#27AE60', icon: '👥' },
  { name: 'Toy Play', color: '#E67E22', icon: '🧸' },
  { name: 'Underwear Fetish', color: '#FFAB91', icon: '🩲' },
  { name: 'Underwear Play', color: '#F8C471', icon: '🩳' },
  { name: 'Uniform/Costume', color: '#9B59B6', icon: '👮' },
  { name: 'Verbal/Dirty Talk', color: '#F1948A', icon: '�️' },
  { name: 'Vibrator', color: '#F57C00', icon: '📳' },
  { name: 'Video Call Sex', color: '#2196F3', icon: '�' },
  { name: 'Watersports', color: '#F4D03F', icon: '💦' },
  { name: 'Wax Play', color: '#E67E22', icon: '🕯️' },
  { name: 'Wrestling/Roughhousing', color: '#34495E', icon: '🤼' }
];

// Database class
class EncounterLedgerDB extends Dexie {
  friends!: EntityTable<Friend, 'id'>;
  interactionTypes!: EntityTable<InteractionType, 'id'>;
  encounters!: EntityTable<Encounter, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('EncounterLedgerDB');
    
    this.version(1).stores({
      friends: '++id, name, isArchived, createdAt',
      interactionTypes: '++id, name, isDefault',
      encounters: '++id, date, rating, typeId, *participants, beneficiary, isAnonymous, createdAt',
      settings: '++id'
    });

    this.on('ready', async () => {
      // Initialize with final activities list - NO CHANGES ALLOWED
      const existingCount = await this.interactionTypes.count();
      if (existingCount === 0) {
        await this.interactionTypes.bulkAdd(GAY_ACTIVITIES.map(activity => ({
          ...activity,
          isDefault: true
        })));
      }

      // Seed default settings if none exist
      const settingsCount = await this.settings.count();
      if (settingsCount === 0) {
        await this.settings.add({
          scoringWeights: {
            frequency: 0.35,
            recency: 0.25,
            quality: 0.30,
            mutuality: 0.10
          },
          defaultRating: 4,
          theme: 'system',
          notificationsEnabled: false,
          reminderFrequency: 'none'
        });
      }
    });
  }
}

export const db = new EncounterLedgerDB();