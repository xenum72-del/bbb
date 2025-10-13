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
      // Clear existing types and seed adult/intimate encounter types
      await this.interactionTypes.clear();
      await this.interactionTypes.bulkAdd([
        // Basic Activities
        { name: 'Makeout Session', color: '#FF69B4', icon: '�', isDefault: true },
        { name: 'Oral (Giving)', color: '#FF6B35', icon: '👄', isDefault: true },
        { name: 'Oral (Receiving)', color: '#FF8C00', icon: '🍆', isDefault: true },
        { name: '69', color: '#9C27B0', icon: '♋', isDefault: true },
        { name: 'Handjob (Giving)', color: '#4CAF50', icon: '👐', isDefault: true },
        { name: 'Handjob (Receiving)', color: '#66BB6A', icon: '✊', isDefault: true },
        { name: 'Mutual Masturbation', color: '#2196F3', icon: '🤝', isDefault: true },
        
        // Anal Activities
        { name: 'Anal (Topping)', color: '#8E24AA', icon: '🍑', isDefault: true },
        { name: 'Anal (Bottoming)', color: '#AB47BC', icon: '🕳️', isDefault: true },
        { name: 'Rimming (Giving)', color: '#7B1FA2', icon: '👅', isDefault: true },
        { name: 'Rimming (Receiving)', color: '#8E24AA', icon: '🌸', isDefault: true },
        { name: 'Fingering', color: '#9C27B0', icon: '👆', isDefault: true },
        { name: 'Fisting', color: '#6A1B9A', icon: '�', isDefault: true },
        
        // Group Activities
        { name: 'Threesome (MMM)', color: '#E91E63', icon: '👥', isDefault: true },
        { name: 'Group Orgy', color: '#C2185B', icon: '👨‍👨‍👦‍👦', isDefault: true },
        { name: 'Gang Bang', color: '#AD1457', icon: '🔄', isDefault: true },
        { name: 'Double Penetration', color: '#880E4F', icon: '🔀', isDefault: true },
        
        // BDSM/Kink
        { name: 'BDSM Dom', color: '#795548', icon: '⛓️', isDefault: true },
        { name: 'BDSM Sub', color: '#6D4C41', icon: '🔒', isDefault: true },
        { name: 'Bondage', color: '#5D4037', icon: '🪢', isDefault: true },
        { name: 'Spanking', color: '#4E342E', icon: '👋', isDefault: true },
        { name: 'Roleplay', color: '#00BCD4', icon: '🎭', isDefault: true },
        { name: 'Daddy/Son Play', color: '#0097A7', icon: '👨‍👦', isDefault: true },
        { name: 'Pup Play', color: '#00838F', icon: '🐶', isDefault: true },
        
        // Fetishes
        { name: 'Foot Fetish', color: '#FF5722', icon: '🦶', isDefault: true },
        { name: 'Watersports', color: '#FF7043', icon: '💦', isDefault: true },
        { name: 'Scat Play', color: '#FF8A65', icon: '💩', isDefault: true },
        { name: 'Underwear Fetish', color: '#FFAB91', icon: '🩲', isDefault: true },
        { name: 'Leather/Rubber', color: '#3E2723', icon: '🧥', isDefault: true },
        
        // Toys & Tools
        { name: 'Dildo Play', color: '#E65100', icon: '🍆', isDefault: true },
        { name: 'Vibrator', color: '#F57C00', icon: '📳', isDefault: true },
        { name: 'Butt Plug', color: '#FF9800', icon: '🔌', isDefault: true },
        { name: 'Cock Ring', color: '#FFA726', icon: '💍', isDefault: true },
        { name: 'Poppers', color: '#FFB74D', icon: '🧪', isDefault: true },
        
        // Settings & Scenarios
        { name: 'Public Sex', color: '#4CAF50', icon: '🌲', isDefault: true },
        { name: 'Car Sex', color: '#66BB6A', icon: '🚗', isDefault: true },
        { name: 'Sauna/Bathhouse', color: '#81C784', icon: '🧖‍♂️', isDefault: true },
        { name: 'Video Call Sex', color: '#2196F3', icon: '📱', isDefault: true },
        { name: 'Quickie (<30min)', color: '#FFD700', icon: '⚡', isDefault: true },
        { name: 'Marathon (3+ hrs)', color: '#673AB7', icon: '🌙', isDefault: true },
        { name: 'Romantic/Vanilla', color: '#E91E63', icon: '💕', isDefault: true },
        { name: 'Rough/Aggressive', color: '#F44336', icon: '💢', isDefault: true },
        
        // Non-Sexual
        { name: 'Just Chatting', color: '#607D8B', icon: '💬', isDefault: true },
        { name: 'Dinner Date', color: '#795548', icon: '🍽️', isDefault: true },
        { name: 'Drinks', color: '#9C27B0', icon: '🍸', isDefault: true },
        { name: 'Coffee Date', color: '#8D6E63', icon: '☕', isDefault: true },
      ]);

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