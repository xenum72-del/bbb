import { db, GAY_ACTIVITIES } from '../db/schema';
import { friendsApi, encountersApi } from '../hooks/useDatabase';
import { createBackup, restoreFromBackup } from '../utils/backup';
import type { Friend, Encounter } from '../db/schema';

// Test configuration - SIGNIFICANTLY MORE DATA
const TEST_CONFIG = {
  FRIENDS_COUNT: 50,           // 5x more friends
  ENCOUNTERS_COUNT: 200,       // 10x more encounters  
  PHOTOS_PER_FRIEND: 5,        // More photos per friend
  PHOTOS_PER_ENCOUNTER: 4,     // More photos per encounter
  TEST_TIMEOUT: 60000,         // 60 seconds for larger dataset
  PAID_ENCOUNTER_RATE: 0.15    // Only 15% paid encounters (much more realistic)
};

// Test utilities
class TestLogger {
  private logs: string[] = [];
  private errors: string[] = [];
  
  log(message: string) {
    console.log(`✅ ${message}`);
    this.logs.push(message);
  }
  
  error(message: string) {
    console.error(`❌ ${message}`);
    this.errors.push(message);
  }
  
  warn(message: string) {
    console.warn(`⚠️ ${message}`);
  }
  
  summary() {
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${this.logs.length}`);
    console.log(`❌ Failed: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return this.errors.length === 0;
  }
}

// Generate test data
function generateTestPhoto(): string {
  // Create a small test image as base64
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;
  
  // Generate random colored square
  ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
  ctx.fillRect(0, 0, 100, 100);
  
  // Add some text
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`#${Math.floor(Math.random() * 1000)}`, 10, 50);
  
  return canvas.toDataURL();
}

function generateTestFriend(index: number): Omit<Friend, 'id' | 'createdAt' | 'updatedAt'> {
  // Globally diverse name pools for maximum randomness
  const firstNames = [
    // English/American
    'Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harley', 'Indigo', 'Jazz',
    'Kai', 'Logan', 'Morgan', 'Noah', 'Oakley', 'Parker', 'Quinn', 'River', 'Sage', 'Taylor',
    'Adrian', 'Brandon', 'Carter', 'Daniel', 'Ethan', 'Felix', 'Gabriel', 'Hunter', 'Ivan', 'Jake',
    'Kyle', 'Liam', 'Mason', 'Nathan', 'Owen', 'Preston', 'Quincy', 'Ryan', 'Sean', 'Tyler',
    
    // International diversity
    'Mateo', 'Diego', 'Carlos', 'Alejandro', 'Santiago', 'Sebastián', 'Joaquín', 'Nicolás',
    'Hiroshi', 'Kenji', 'Akira', 'Takeshi', 'Yuki', 'Daiki', 'Ryu', 'Sora',
    'Ahmed', 'Omar', 'Yussef', 'Hassan', 'Malik', 'Tariq', 'Karim', 'Rashid',
    'Luca', 'Marco', 'Alessandro', 'Giovanni', 'Francesco', 'Lorenzo', 'Matteo', 'Andrea',
    'Jean', 'Pierre', 'Antoine', 'Maxime', 'Louis', 'Hugo', 'Lucas', 'Noah',
    'Klaus', 'Hans', 'Stefan', 'Thomas', 'Michael', 'Alexander', 'Christian', 'Daniel',
    'Vladimir', 'Dmitri', 'Alexei', 'Mikhail', 'Pavel', 'Sergei', 'Nikolai', 'Ivan',
    'Raj', 'Arjun', 'Vikram', 'Rohan', 'Kiran', 'Arun', 'Suresh', 'Ravi',
    'Chen', 'Wei', 'Jun', 'Ming', 'Lei', 'Feng', 'Hao', 'Long'
  ];
  
  const lastNames = [
    // American/English
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    
    // Global surnames  
    'González', 'Fernández', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez',
    'Tanaka', 'Suzuki', 'Takahashi', 'Watanabe', 'Itō', 'Yamamoto', 'Nakamura', 'Kobayashi',
    'Al-Rashid', 'Al-Mansouri', 'Al-Zahra', 'Hakim', 'Nassar', 'Khalil', 'Farouk', 'Abbas',
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci',
    'Dubois', 'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand',
    'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Schulz',
    'Petrov', 'Ivanov', 'Sidorov', 'Kuznetsov', 'Popov', 'Volkov', 'Sokolov', 'Lebedev',
    'Patel', 'Sharma', 'Gupta', 'Singh', 'Kumar', 'Mishra', 'Agarwal', 'Jain',
    'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao'
  ];
  
  const bodyTypes = ['Slim', 'Athletic', 'Average', 'Muscular', 'Chubby', 'Bear', 'Daddy', 'Twink', 'Otter'];
  const hivStatuses = ['Negative', 'Positive Undetectable', 'Unknown', 'Prefer Not to Say'];
  const relationships = ['Single', 'Taken', 'Open Relationship', 'Married', 'Complicated'];
  const ethnicities = [
    'White', 'Black', 'Latino/Hispanic', 'East Asian', 'South Asian', 'Middle Eastern', 
    'Native American', 'Pacific Islander', 'Mixed Race', 'Indigenous', 'European', 
    'African', 'Caribbean', 'North African', 'Southeast Asian', 'Other'
  ];
  
  const occupations = [
    'Teacher', 'Engineer', 'Doctor', 'Nurse', 'Artist', 'Chef', 'Lawyer', 'Student', 'Trainer', 'Designer',
    'Developer', 'Consultant', 'Manager', 'Therapist', 'Photographer', 'Writer', 'Musician', 'Actor',
    'Entrepreneur', 'Mechanic', 'Bartender', 'Server', 'Retail Worker', 'Sales Rep', 'Marketing Specialist',
    'Accountant', 'Architect', 'Social Worker', 'Firefighter', 'Police Officer', 'Paramedic', 'Pilot',
    'Flight Attendant', 'Uber Driver', 'Personal Trainer', 'Massage Therapist', 'Hair Stylist', 'Model',
    'Dancer', 'DJ', 'Barista', 'Shop Owner', 'Real Estate Agent', 'Insurance Agent', 'Bank Teller',
    'Construction Worker', 'Electrician', 'Plumber', 'Carpenter', 'Landscaper', 'Delivery Driver',
    'Security Guard', 'Janitor', 'Office Manager', 'HR Specialist', 'Data Analyst', 'Researcher'
  ];
  
  const cities = [
    // Major US Cities
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
    'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
    'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'Nashville', 'Baltimore', 'Portland',
    'Oklahoma City', 'Las Vegas', 'Louisville', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
    'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Miami', 'Virginia Beach',
    
    // International Cities
    'Toronto', 'Vancouver', 'Montreal', 'London', 'Manchester', 'Berlin', 'Paris', 'Amsterdam',
    'Madrid', 'Barcelona', 'Rome', 'Milan', 'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki',
    'Prague', 'Vienna', 'Zurich', 'Brussels', 'Dublin', 'Tel Aviv', 'Tokyo', 'Osaka',
    'Seoul', 'Sydney', 'Melbourne', 'Auckland', 'São Paulo', 'Mexico City', 'Buenos Aires',
    'Santiago', 'Bogotá', 'Lima', 'Mumbai', 'Delhi', 'Bangkok', 'Singapore', 'Hong Kong'
  ];
  
  const photos = [];
  for (let i = 0; i < TEST_CONFIG.PHOTOS_PER_FRIEND; i++) {
    photos.push(generateTestPhoto());
  }
  
  // Select random preferences from GAY_ACTIVITIES with heavily varied distributions
  const preferences = [];
  
  // Vary number of preferences more dramatically to reduce uniformity
  let numPrefs: number;
  const prefRand = Math.random();
  if (prefRand < 0.15) {
    numPrefs = 1; // 15% - very limited preferences
  } else if (prefRand < 0.35) {
    numPrefs = 2; // 20% - few preferences  
  } else if (prefRand < 0.65) {
    numPrefs = 3 + Math.floor(Math.random() * 3); // 30% - 3-5 preferences
  } else if (prefRand < 0.85) {
    numPrefs = 6 + Math.floor(Math.random() * 4); // 20% - 6-9 preferences
  } else {
    numPrefs = 10 + Math.floor(Math.random() * 8); // 15% - very adventurous (10-17 preferences)
  }
  
  const availableActivities = [...GAY_ACTIVITIES];
  const selectedPrefs = new Set<string>();
  
  for (let i = 0; i < numPrefs && availableActivities.length > 0; i++) {
    let attempts = 0;
    let selectedPref: string;
    
    do {
      const randomIndex = Math.floor(Math.random() * availableActivities.length);
      selectedPref = availableActivities[randomIndex].name;
      attempts++;
    } while (selectedPrefs.has(selectedPref) && attempts < 20);
    
    if (!selectedPrefs.has(selectedPref)) {
      preferences.push(selectedPref);
      selectedPrefs.add(selectedPref);
    }
  }
  
  return {
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    avatarUrl: generateTestPhoto(),
    notes: `Met this guy in ${cities[Math.floor(Math.random() * cities.length)]}. ${[
      'Really chill and down to earth',
      'Super hot and knows it',
      'Great conversation and even better in bed',
      'Shy at first but opens up quickly',
      'Very experienced and taught me some new things',
      'Sweet guy with a wild side',
      'Amazing body and personality to match',
      'Funny and charming, great energy',
      'Passionate and intense, unforgettable',
      'Laid back surfer type, very relaxed'
    ][Math.floor(Math.random() * 10)]}.`,
    // Highly varied age distribution to reduce uniformity
    age: (() => {
      const ageRand = Math.random();
      if (ageRand < 0.25) return 18 + Math.floor(Math.random() * 7); // 25% young (18-24)
      if (ageRand < 0.55) return 25 + Math.floor(Math.random() * 15); // 30% prime (25-39)  
      if (ageRand < 0.8) return 40 + Math.floor(Math.random() * 15); // 25% mature (40-54)
      return 55 + Math.floor(Math.random() * 20); // 20% older (55-74)
    })(),
    
    // More realistic height distribution (not uniform)
    height: (() => {
      const heightRand = Math.random();
      if (heightRand < 0.1) return `5'${2 + Math.floor(Math.random() * 4)}"`; // 10% shorter (5'2"-5'5")
      if (heightRand < 0.6) return `5'${6 + Math.floor(Math.random() * 4)}"`; // 50% average (5'6"-5'9")
      if (heightRand < 0.9) return `5'${10 + Math.floor(Math.random() * 3)}"`; // 30% tall (5'10"-6'0")
      return `6'${1 + Math.floor(Math.random() * 4)}"`; // 10% very tall (6'1"-6'4")
    })(),
    
    // More realistic weight distribution
    weight: (() => {
      const weightRand = Math.random();
      if (weightRand < 0.15) return `${130 + Math.floor(Math.random() * 25)} lbs`; // 15% slim (130-154)
      if (weightRand < 0.5) return `${155 + Math.floor(Math.random() * 25)} lbs`; // 35% average (155-179)
      if (weightRand < 0.8) return `${180 + Math.floor(Math.random() * 30)} lbs`; // 30% heavy (180-209)
      return `${210 + Math.floor(Math.random() * 50)} lbs`; // 20% large (210-259)
    })(),
    
    // Weighted body type distribution (not uniform)
    bodyType: (() => {
      const bodyRand = Math.random();
      if (bodyRand < 0.2) return bodyTypes[Math.floor(Math.random() * 3)]; // 20% slim types
      if (bodyRand < 0.6) return bodyTypes[3 + Math.floor(Math.random() * 3)]; // 40% average types
      return bodyTypes[6 + Math.floor(Math.random() * 3)]; // 40% larger types
    })() as any,
    
    ethnicity: ethnicities[Math.floor(Math.random() * ethnicities.length)],
    
    // More realistic sexual role distribution
    sexualRole: (() => {
      const roleRand = Math.random();
      if (roleRand < 0.25) return 'Top';
      if (roleRand < 0.35) return 'Bottom'; 
      if (roleRand < 0.7) return 'Versatile'; // Most common
      if (roleRand < 0.85) return 'Vers Top';
      if (roleRand < 0.95) return 'Vers Bottom';
      return 'Side';
    })() as any,
    
    // More realistic dick size distribution (bell curve)
    dickSize: (() => {
      const sizeRand = Math.random();
      if (sizeRand < 0.1) return `${4 + Math.random() * 1}".toFixed(1)} inches`; // 10% smaller
      if (sizeRand < 0.4) return `${5 + Math.random() * 1}".toFixed(1)} inches`; // 30% average-
      if (sizeRand < 0.8) return `${6 + Math.random() * 1}".toFixed(1)} inches`; // 40% average+
      if (sizeRand < 0.95) return `${7 + Math.random() * 1}".toFixed(1)} inches`; // 15% large
      return `${8 + Math.random() * 1.5}".toFixed(1)} inches`; // 5% very large
    })(),
    
    // Varied circumcision rates by ethnicity (more realistic)
    dickType: Math.random() > 0.4 ? 'Cut' : 'Uncut' as any, // 60% cut (more varied)
    preferences,
    limits: ['No bareback', 'No pain', 'No kissing', 'No anal', 'No oral'].slice(0, Math.floor(Math.random() * 3)),
    metOn: [
      'Grindr', 'Romeo', 'Tinder', 'Bumble', 'Hinge', 'Scruff', 'Hornet', 'Jack\'d',
      'Instagram', 'Twitter', 'TikTok', 'Snapchat', 'Discord', 'Reddit',
      'Bar/Club', 'Coffee Shop', 'Gym', 'Park', 'Beach', 'Library', 'Bookstore',
      'Friend Intro', 'Work', 'School', 'Party', 'Concert', 'Festival', 'Pride Event',
      'Dating Event', 'Sport Club', 'Hiking Group', 'Volunteer Work', 'Gaming Group'
    ][Math.floor(Math.random() * 33)] as any,
    socialProfiles: {
      grindr: Math.random() > 0.3 ? `${firstNames[index % firstNames.length].toLowerCase()}${Math.floor(Math.random() * 999)}` : undefined,
      instagram: Math.random() > 0.5 ? `@${firstNames[index % firstNames.length].toLowerCase()}_${Math.floor(Math.random() * 99)}` : undefined,
      twitter: Math.random() > 0.7 ? `@${firstNames[index % firstNames.length].toLowerCase()}${Math.floor(Math.random() * 999)}` : undefined,
      telegram: Math.random() > 0.6 ? `@${firstNames[index % firstNames.length].toLowerCase()}${index}` : undefined,
      whatsapp: Math.random() > 0.4 ? `+1${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 900) + 100}${String(index).padStart(4, '0')}` : undefined,
      phone: Math.random() > 0.7 ? `+1${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 900) + 100}${String(index).padStart(4, '0')}` : undefined
    },
    photos,
    lastTested: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
    hivStatus: hivStatuses[Math.floor(Math.random() * hivStatuses.length)] as any,
    onPrep: Math.random() > 0.6, // 40% on PrEP
    relationshipStatus: relationships[Math.floor(Math.random() * relationships.length)] as any,
    overallRating: Math.random() > 0.3 ? 1 + Math.floor(Math.random() * 5) : undefined,
    sexRating: Math.random() > 0.4 ? 1 + Math.floor(Math.random() * 5) : undefined,
    personalityRating: Math.random() > 0.4 ? 1 + Math.floor(Math.random() * 5) : undefined,
    location: `${cities[Math.floor(Math.random() * cities.length)]}, ${Math.floor(Math.random() * 20) + 1} miles away`,
    canHost: Math.random() > 0.4, // 60% can host
    canTravel: Math.random() > 0.3, // 70% can travel
    occupation: occupations[Math.floor(Math.random() * occupations.length)],
    languages: Math.random() > 0.3 ? [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Japanese',
      'Korean', 'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish', 'Norwegian', 'Polish',
      'Turkish', 'Hebrew', 'Thai', 'Vietnamese', 'Tagalog', 'Greek', 'Czech', 'Hungarian'
    ].slice(0, 1 + Math.floor(Math.random() * 3)).sort(() => Math.random() - 0.5) : ['English'],
    tags: [`tag-${index}`, 'test-friend', 'generated'].concat(
      Math.random() > 0.5 ? ['kinky'] : [],
      Math.random() > 0.7 ? ['romantic'] : [],
      Math.random() > 0.8 ? ['experienced'] : []
    ),
    isArchived: Math.random() > 0.95 // 5% archived
  };
}

async function generateTestEncounter(friendIds: number[], index: number): Promise<Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>> {
  const locations = [
    // North America
    { lat: 40.7128, lon: -74.0060, place: 'Manhattan, New York' },
    { lat: 34.0522, lon: -118.2437, place: 'West Hollywood, Los Angeles' },
    { lat: 41.8781, lon: -87.6298, place: 'Boystown, Chicago' },
    { lat: 37.7749, lon: -122.4194, place: 'Castro District, San Francisco' },
    { lat: 25.7617, lon: -80.1918, place: 'South Beach, Miami' },
    { lat: 45.5017, lon: -73.5673, place: 'Le Village, Montreal' },
    { lat: 43.6532, lon: -79.3832, place: 'Church & Wellesley, Toronto' },
    { lat: 49.2827, lon: -123.1207, place: 'Davie Village, Vancouver' },
    { lat: 19.4326, lon: -99.1332, place: 'Zona Rosa, Mexico City' },
    
    // Europe
    { lat: 51.5074, lon: -0.1278, place: 'Soho, London' },
    { lat: 48.8566, lon: 2.3522, place: 'Le Marais, Paris' },
    { lat: 52.5200, lon: 13.4050, place: 'Schöneberg, Berlin' },
    { lat: 41.3851, lon: 2.1734, place: 'Eixample, Barcelona' },
    { lat: 52.3676, lon: 4.9041, place: 'Reguliersdwarsstraat, Amsterdam' },
    { lat: 59.3293, lon: 18.0686, place: 'Södermalm, Stockholm' },
    { lat: 55.6761, lon: 12.5683, place: 'Vesterbro, Copenhagen' },
    { lat: 41.9028, lon: 12.4964, place: 'Trastevere, Rome' },
    { lat: 50.1109, lon: 8.6821, place: 'Sachsenhausen, Frankfurt' },
    { lat: 47.3769, lon: 8.5417, place: 'Niederdorf, Zurich' },
    
    // Asia-Pacific
    { lat: 35.6762, lon: 139.6503, place: 'Shinjuku Ni-chōme, Tokyo' },
    { lat: 22.3193, lon: 114.1694, place: 'Sheung Wan, Hong Kong' },
    { lat: 1.3521, lon: 103.8198, place: 'Tanjong Pagar, Singapore' },
    { lat: -33.8688, lon: 151.2093, place: 'Oxford Street, Sydney' },
    { lat: -37.8136, lon: 144.9631, place: 'Fitzroy, Melbourne' },
    { lat: 13.7563, lon: 100.5018, place: 'Silom, Bangkok' },
    { lat: -22.9068, lon: -43.1729, place: 'Ipanema, Rio de Janeiro' },
    { lat: -34.6037, lon: -58.3816, place: 'Palermo, Buenos Aires' },
    { lat: 39.0458, lon: 125.7549, place: 'Gangnam, Seoul' },
    { lat: 31.2304, lon: 121.4737, place: 'French Concession, Shanghai' },
    
    // Middle East & Africa
    { lat: 32.0853, lon: 34.7818, place: 'Rothschild Boulevard, Tel Aviv' },
    { lat: 25.2048, lon: 55.2708, place: 'DIFC, Dubai' },
    { lat: -33.9249, lon: 18.4241, place: 'De Waterkant, Cape Town' },
    { lat: 30.0444, lon: 31.2357, place: 'Zamalek, Cairo' },
    
    // South America & Others
    { lat: -23.5505, lon: -46.6333, place: 'República, São Paulo' },
    { lat: 4.7110, lon: -74.0721, place: 'Zona Rosa, Bogotá' },
    { lat: -12.0464, lon: -77.0428, place: 'Miraflores, Lima' },
    { lat: -25.2637, lon: -57.5759, place: 'Villa Morra, Asunción' },
    { lat: 19.0760, lon: 72.8777, place: 'Bandra, Mumbai' },
    { lat: 28.6139, lon: 77.2090, place: 'Khan Market, New Delhi' }
  ];
  
  const venues = [
    // Private spaces
    'my apartment', 'his place', 'hotel room', 'AirBnB', 'friend\'s place', 'his dorm room', 'my dorm room',
    'penthouse suite', 'serviced apartment', 'studio flat', 'loft apartment', 'beach house', 'mountain cabin',
    'pool house', 'garage', 'basement', 'rooftop terrace', 'balcony', 'backyard', 'guest house',
    
    // Vehicles & Mobile
    'car in parking lot', 'his car', 'my car', 'truck cab', 'RV', 'yacht', 'boat', 'private jet',
    'train compartment', 'sleeper car', 'van', 'motorcycle', 'limousine',
    
    // Fitness & Wellness
    'gym locker room', 'sauna', 'steam room', 'spa private room', 'massage parlor', 'hot tub',
    'onsen (hot spring)', 'hammam', 'wellness center', 'pool area', 'shower at gym', 'yoga studio',
    
    // Nightlife & Entertainment
    'club bathroom', 'bar back room', 'VIP lounge', 'darkroom', 'cabaret booth', 'karaoke room',
    'nightclub private area', 'strip club booth', 'casino suite', 'theater box',
    
    // Public & Semi-Public
    'park restroom', 'hiking trail', 'office after hours', 'bookstore booth', 'library study room',
    'museum storage', 'university campus', 'shopping mall bathroom', 'cinema back row',
    
    // International/Cultural
    'ryokan room (Japan)', 'riad courtyard (Morocco)', 'hostel private room', 'capsule hotel',
    'beach cabana', 'ski chalet', 'desert camp', 'treehouse', 'lighthouse', 'monastery guest quarters',
    
    // Outdoor & Adventure
    'camping tent', 'hiking shelter', 'beach dunes', 'forest clearing', 'rooftop under stars',
    'cliff overlook', 'secluded waterfall', 'mountain peak', 'vineyard', 'olive grove',
    
    // Unique/Exotic
    'art gallery after hours', 'recording studio', 'photography studio', 'penthouse pool',
    'private island', 'castle turret', 'wine cellar', 'greenhouse', 'observatory dome'
  ];
  
  const photos = [];
  for (let i = 0; i < TEST_CONFIG.PHOTOS_PER_ENCOUNTER; i++) {
    photos.push(generateTestPhoto());
  }
  
  // Query the actual database to get correct activity IDs
  const availableActivities = await db.interactionTypes.toArray();
  
  // Create realistic activity distribution with weighted randomness
  const veryCommonActivities = [
    'Oral (Giving)', 'Oral (Receiving)', 'Kissing/Making Out', 'Handjob (Giving)', 'Handjob (Receiving)'
  ];
  const commonActivities = [
    'Anal (Topping)', 'Anal (Bottoming)', 'Mutual Masturbation', 'Rimming (Giving)', 'Rimming (Receiving)',
    '69', 'Body Contact/Massage', 'Makeout Session'
  ];
  const uncommonActivities = [
    'BDSM Dom', 'BDSM Sub', 'Threesome (MMM)', 'Toy Play', 'Public/Semi-Public', 'Car Play',
    'Spanking (Giving)', 'Role Play', 'Rough Play', 'Gentle/Romantic'
  ];
  
  // Heavily weighted selection - 60% very common, 30% common, 10% uncommon/rare
  let primaryActivity: string;
  const rand = Math.random();
  if (rand < 0.6) {
    primaryActivity = veryCommonActivities[Math.floor(Math.random() * veryCommonActivities.length)];
  } else if (rand < 0.9) {
    primaryActivity = commonActivities[Math.floor(Math.random() * commonActivities.length)];
  } else {
    primaryActivity = uncommonActivities[Math.floor(Math.random() * uncommonActivities.length)];
  }
  
  const primaryActivityRecord = availableActivities.find(a => a.name === primaryActivity);
  const primaryActivityId = primaryActivityRecord?.id || availableActivities[0]?.id || 1; // Use first available or fallback
  
  // Variable number of activities - heavily randomized to reduce uniformity
  const activityChance = Math.random();
  let numActivities: number;
  if (activityChance < 0.4) {
    numActivities = 1; // 40% - single activity
  } else if (activityChance < 0.7) {
    numActivities = 2; // 30% - two activities
  } else if (activityChance < 0.9) {
    numActivities = 3; // 20% - three activities
  } else {
    numActivities = 4 + Math.floor(Math.random() * 3); // 10% - 4-6 activities (wild sessions)
  }
  
  const activitiesPerformed: number[] = [primaryActivityId];
  
  // Add additional activities with smart selection to avoid duplicates
  const usedActivities = new Set([primaryActivity]);
  
  for (let i = 1; i < numActivities && i < 8; i++) {
    // More random selection for additional activities
    const activityPool = availableActivities.filter(a => !usedActivities.has(a.name));
    if (activityPool.length === 0) break;
    
    const selectedActivityRecord = activityPool[Math.floor(Math.random() * activityPool.length)];
    const activityId = selectedActivityRecord?.id || availableActivities[0]?.id || 1; // Use actual ID
    
    activitiesPerformed.push(activityId);
    usedActivities.add(selectedActivityRecord.name);
  }
  
  // Random participants (1-3 friends)
  const numParticipants = 1 + Math.floor(Math.random() * Math.min(3, friendIds.length));
  const participants = [];
  const availableFriends = [...friendIds];
  for (let i = 0; i < numParticipants && availableFriends.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableFriends.length);
    participants.push(availableFriends.splice(randomIndex, 1)[0]);
  }
  
  return {
    // More varied date distribution to reduce uniformity
    date: (() => {
      const dateRand = Math.random();
      if (dateRand < 0.4) {
        // 40% - recent (last 2 weeks)
        return new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      } else if (dateRand < 0.7) {
        // 30% - medium recent (2 weeks to 2 months)
        return new Date(Date.now() - (14 + Math.random() * 46) * 24 * 60 * 60 * 1000);
      } else {
        // 30% - older (2-12 months)
        return new Date(Date.now() - (60 + Math.random() * 305) * 24 * 60 * 60 * 1000);
      }
    })(),
    
    // More realistic rating distribution (bell curve, most are good)
    rating: (() => {
      const ratingRand = Math.random();
      if (ratingRand < 0.05) return 1; // 5% terrible
      if (ratingRand < 0.15) return 2; // 10% bad
      if (ratingRand < 0.35) return 3; // 20% okay
      if (ratingRand < 0.7) return 4; // 35% good
      return 5; // 30% amazing
    })(),
    
    typeId: primaryActivityId, // Use GAY_ACTIVITIES ID for realistic encounters
    activitiesPerformed,
    participants,
    
    // Varied anonymity rates
    isAnonymous: Math.random() > 0.85, // 15% anonymous (reduced from 20%)
    
    // More realistic beneficiary distribution
    beneficiary: (() => {
      const benRand = Math.random();
      if (benRand < 0.4) return 'both'; // 40% mutual pleasure
      if (benRand < 0.7) return 'me'; // 30% focused on me
      return 'friend'; // 30% focused on them
    })() as any,
    
    // Much more varied duration to reduce uniformity
    durationMinutes: (() => {
      const durRand = Math.random();
      if (durRand < 0.2) return 10 + Math.floor(Math.random() * 20); // 20% quickies (10-29 min)
      if (durRand < 0.6) return 30 + Math.floor(Math.random() * 60); // 40% normal (30-89 min)
      if (durRand < 0.85) return 90 + Math.floor(Math.random() * 90); // 25% long (90-179 min)
      return 180 + Math.floor(Math.random() * 240); // 15% marathon (3-7 hours)
    })(),
    location: Math.random() > 0.2 ? locations[Math.floor(Math.random() * locations.length)] : undefined,
    tags: [`encounter-${index}`, `test-data`, Math.random() > 0.5 ? 'hot' : 'mild', Math.random() > 0.7 ? 'repeat' : 'first-time'],
    notes: `${[
      'Amazing chemistry, incredible session',
      'Exactly what I needed after a long week',
      'This guy knows what he\'s doing',
      'Passionate and intense, left me breathless',
      'Sweet and gentle, really took care of me',
      'Wild and adventurous, pushed my boundaries',
      'Perfect gentleman, felt completely safe',
      'Hot as hell and knew exactly how to please',
      'Great conversation before and after too',
      'Spontaneous hookup that exceeded expectations',
      'Been thinking about this encounter for days',
      'Would definitely see him again soon',
      'New favorite position discovered tonight',
      'Incredible stamina and enthusiasm',
      'Made me feel so desired and wanted'
    ][Math.floor(Math.random() * 15)]} at ${venues[Math.floor(Math.random() * venues.length)]}.`,
    photos,
    
    // Realistic payment data (only 15% of encounters have payment - much more realistic)
    ...(Math.random() < TEST_CONFIG.PAID_ENCOUNTER_RATE ? {
      isPaid: true,
      paymentType: Math.random() > 0.7 ? 'received' as const : 'given' as const, // More likely to pay than receive
      amountAsked: Math.floor(Math.random() * 300) + 80,   // $80-380 asked (more realistic range)
      amountGiven: Math.floor(Math.random() * 250) + 60,   // $60-310 actually paid
      currency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'][Math.floor(Math.random() * 5)] as any,
      paymentMethod: ['cash', 'venmo', 'cashapp', 'paypal', 'zelle'][Math.floor(Math.random() * 5)] as any, // Removed crypto for realism
      paymentNotes: [
        'Fair price for great time',
        'Worth every penny',
        'Professional and discreet',
        'Exactly as advertised',
        'Generous guy, took care of me',
        'Quick payment, no drama',
        'Would book again',
        'Respectful transaction'
      ][Math.floor(Math.random() * 8)]
    } : {}),
    
    // More realistic role distributions
    myRole: (() => {
      const roleRand = Math.random();
      if (roleRand < 0.3) return 'Top';
      if (roleRand < 0.45) return 'Bottom';
      if (roleRand < 0.85) return 'Versatile'; // Most common
      return 'Side';
    })() as any,
    
    theirRole: (() => {
      const roleRand = Math.random();
      if (roleRand < 0.35) return 'Top';
      if (roleRand < 0.5) return 'Bottom';
      if (roleRand < 0.9) return 'Versatile';
      return 'Side';
    })() as any,
    
    // More varied condom usage (not uniform)
    condomUsed: (() => {
      const condomRand = Math.random();
      if (condomRand < 0.6) return true; // 60% safe
      return false; // 40% bareback (higher than uniform to be more realistic)
    })(),
    
    // More realistic repeat desire distribution
    wouldRepeat: (() => {
      const repeatRand = Math.random();
      if (repeatRand < 0.75) return true; // 75% would repeat
      return false; // 25% wouldn't (more realistic than 80%)
    })(),
    
    // Bell curve chemistry ratings (most are good)
    chemistry: (() => {
      const chemRand = Math.random();
      if (chemRand < 0.1) return 1; // 10% no chemistry
      if (chemRand < 0.25) return 2; // 15% poor chemistry
      if (chemRand < 0.5) return 3; // 25% okay chemistry
      if (chemRand < 0.8) return 4; // 30% good chemistry
      return 5; // 20% amazing chemistry
    })(),
    
    // Varied kinkiness levels (not uniform)
    kinkiness: (() => {
      const kinkRand = Math.random();
      if (kinkRand < 0.3) return 1; // 30% vanilla
      if (kinkRand < 0.5) return 2; // 20% slightly kinky
      if (kinkRand < 0.7) return 3; // 20% moderately kinky
      if (kinkRand < 0.9) return 4; // 20% very kinky
      return 5; // 10% extremely kinky
    })(),
    
    // More realistic safety discussion rates
    discussedStatus: Math.random() > 0.35, // 65% discussed status (higher than before)
    feelsSafe: Math.random() > 0.05, // 95% felt safe (very high, as it should be)
    
    // More varied contact exchange
    exchangedContacts: (() => {
      const contactRand = Math.random();
      if (contactRand < 0.45) return true; // 45% exchanged contacts
      return false; // 55% didn't exchange
    })(),
    
    // More realistic planning rates  
    plannedMeetAgain: (() => {
      const planRand = Math.random();
      if (planRand < 0.35) return true; // 35% made plans
      return false; // 65% didn't make concrete plans
    })()
  };
}

// Test functions
export class DataIntegrityTester {
  private logger = new TestLogger();
  private originalFriends: Friend[] = [];
  private originalEncounters: Encounter[] = [];
  private testFriendIds: number[] = [];
  private testEncounterIds: number[] = [];

  async runAllTests(keepTestData: boolean = false): Promise<boolean> {
    this.logger.log('🚀 Starting comprehensive data integrity tests...');
    
    try {
      await this.clearTestData();
      await this.testFriendsOperations();
      await this.testEncountersOperations();
      await this.testBackupAndRestore();
      
      if (!keepTestData) {
        await this.testDataClearing();
      } else {
        this.logger.log('🎯 Keeping test data for exploration (skipping cleanup)');
        this.logger.log(`✨ Generated ${this.testFriendIds.length} friends and ${this.testEncounterIds.length} encounters`);
      }
      
      return this.logger.summary();
    } catch (error) {
      this.logger.error(`Test suite failed: ${error}`);
      return false;
    }
  }

  private async clearTestData() {
    this.logger.log('🧹 Clearing any existing test data...');
    
    // Store original data
    this.originalFriends = await db.friends.toArray();
    this.originalEncounters = await db.encounters.toArray();
    
    // Clear all data for clean test environment
    await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes], async () => {
      await db.friends.clear();
      await db.encounters.clear();
      await db.interactionTypes.clear();
    });
    
    // Add GAY_ACTIVITIES for encounters
    await db.interactionTypes.bulkAdd(GAY_ACTIVITIES);
    
    this.logger.log('Test environment prepared');
  }

  private async testFriendsOperations() {
    this.logger.log(`👥 Testing friends operations (${TEST_CONFIG.FRIENDS_COUNT} friends)...`);
    
    // Test friend creation
    const createdFriends: Friend[] = [];
    for (let i = 0; i < TEST_CONFIG.FRIENDS_COUNT; i++) {
      const friendData = generateTestFriend(i);
      const friendId = await friendsApi.create(friendData);
      
      const retrievedFriend = await db.friends.get(friendId);
      if (!retrievedFriend) {
        this.logger.error(`Failed to retrieve created friend #${i + 1}`);
        continue;
      }
      
      createdFriends.push(retrievedFriend);
      if (friendId) {
        this.testFriendIds.push(friendId);
      }
      
      // Validate data integrity
      this.validateFriendData(friendData, retrievedFriend, `create friend #${i + 1}`);
    }
    
    this.logger.log(`✅ Created ${createdFriends.length} friends successfully`);
    
    // Test friend editing
    for (let i = 0; i < Math.min(5, createdFriends.length); i++) {
      const friend = createdFriends[i];
      const updatedData = {
        ...friend,
        name: `${friend.name} (Updated)`,
        age: (friend.age || 25) + 1,
        notes: `${friend.notes} - UPDATED`,
        avatarUrl: generateTestPhoto(), // New photo
        photos: [...(friend.photos || []), generateTestPhoto()], // Add photo
        preferences: [...(friend.preferences || []), 'Updated Preference']
      };
      
      await friendsApi.update(friend.id!, updatedData);
      
      const retrievedFriend = await db.friends.get(friend.id!);
      if (!retrievedFriend) {
        this.logger.error(`Failed to retrieve updated friend #${i + 1}`);
        continue;
      }
      
      // Validate updates
      if (retrievedFriend.name !== updatedData.name) {
        this.logger.error(`Friend name not updated correctly for friend #${i + 1}`);
      }
      if (retrievedFriend.age !== updatedData.age) {
        this.logger.error(`Friend age not updated correctly for friend #${i + 1}`);
      }
      if ((retrievedFriend.photos?.length || 0) !== (updatedData.photos?.length || 0)) {
        this.logger.error(`Friend photos not updated correctly for friend #${i + 1}`);
      }
      
      this.logger.log(`Friend #${i + 1} updated and validated`);
    }
  }

  private async testEncountersOperations() {
    this.logger.log(`🔥 Testing encounters operations (${TEST_CONFIG.ENCOUNTERS_COUNT} encounters)...`);
    
    if (this.testFriendIds.length === 0) {
      this.logger.error('No friends available for encounter testing');
      return;
    }
    
    // Test encounter creation
    const createdEncounters: Encounter[] = [];
    for (let i = 0; i < TEST_CONFIG.ENCOUNTERS_COUNT; i++) {
      const encounterData = await generateTestEncounter(this.testFriendIds, i);
      const encounterId = await encountersApi.create(encounterData);
      
      const retrievedEncounter = await db.encounters.get(encounterId);
      if (!retrievedEncounter) {
        this.logger.error(`Failed to retrieve created encounter #${i + 1}`);
        continue;
      }
      
      createdEncounters.push(retrievedEncounter);
      if (encounterId) {
        this.testEncounterIds.push(encounterId);
      }
      
      // Validate data integrity
      this.validateEncounterData(encounterData, retrievedEncounter, `create encounter #${i + 1}`);
    }
    
    this.logger.log(`✅ Created ${createdEncounters.length} encounters successfully`);
    
    // Test encounter editing
    for (let i = 0; i < Math.min(5, createdEncounters.length); i++) {
      const encounter = createdEncounters[i];
      const updatedData = {
        ...encounter,
        rating: ((encounter.rating % 5) + 1), // Change rating
        notes: `${encounter.notes} - UPDATED`,
        durationMinutes: (encounter.durationMinutes || 30) + 15,
        photos: [...(encounter.photos || []), generateTestPhoto()], // Add photo
        tags: [...(encounter.tags || []), 'updated-tag']
      };
      
      await encountersApi.update(encounter.id!, updatedData);
      
      const retrievedEncounter = await db.encounters.get(encounter.id!);
      if (!retrievedEncounter) {
        this.logger.error(`Failed to retrieve updated encounter #${i + 1}`);
        continue;
      }
      
      // Validate updates
      if (retrievedEncounter.rating !== updatedData.rating) {
        this.logger.error(`Encounter rating not updated correctly for encounter #${i + 1}`);
      }
      if (retrievedEncounter.durationMinutes !== updatedData.durationMinutes) {
        this.logger.error(`Encounter duration not updated correctly for encounter #${i + 1}`);
      }
      if ((retrievedEncounter.photos?.length || 0) !== (updatedData.photos?.length || 0)) {
        this.logger.error(`Encounter photos not updated correctly for encounter #${i + 1}`);
      }
      
      this.logger.log(`Encounter #${i + 1} updated and validated`);
    }
    
    // Test encounter deletion
    const toDelete = createdEncounters.slice(0, 3);
    for (const encounter of toDelete) {
      await encountersApi.delete(encounter.id!);
      
      const deletedEncounter = await db.encounters.get(encounter.id!);
      if (deletedEncounter) {
        this.logger.error(`Encounter #${encounter.id} was not deleted properly`);
      } else {
        this.logger.log(`Encounter #${encounter.id} deleted successfully`);
      }
    }
  }

  private async testBackupAndRestore() {
    this.logger.log('💾 Testing backup and restore operations...');
    
    // Create backup
    const backup = await createBackup(true); // Include photos
    
    // Validate backup structure
    if (!backup.version || !backup.timestamp) {
      this.logger.error('Backup missing version or timestamp');
    }
    if (!Array.isArray(backup.friends) || !Array.isArray(backup.encounters)) {
      this.logger.error('Backup missing required data arrays');
    }
    
    const backupFriendCount = backup.friends.length;
    const backupEncounterCount = backup.encounters.length;
    
    this.logger.log(`Backup created with ${backupFriendCount} friends and ${backupEncounterCount} encounters`);
    
    // Clear data
    await db.transaction('rw', [db.friends, db.encounters], async () => {
      await db.friends.clear();
      await db.encounters.clear();
    });
    
    // Verify data is cleared
    const friendsAfterClear = await db.friends.count();
    const encountersAfterClear = await db.encounters.count();
    
    if (friendsAfterClear !== 0 || encountersAfterClear !== 0) {
      this.logger.error('Data was not cleared properly before restore');
    }
    
    // Restore from backup
    await restoreFromBackup(backup);
    
    // Verify restored data
    const restoredFriends = await db.friends.toArray();
    const restoredEncounters = await db.encounters.toArray();
    
    if (restoredFriends.length !== backupFriendCount) {
      this.logger.error(`Friends count mismatch after restore: expected ${backupFriendCount}, got ${restoredFriends.length}`);
    }
    
    if (restoredEncounters.length !== backupEncounterCount) {
      this.logger.error(`Encounters count mismatch after restore: expected ${backupEncounterCount}, got ${restoredEncounters.length}`);
    }
    
    // Validate a few restored items in detail
    if (restoredFriends.length > 0) {
      const friend = restoredFriends[0];
      const originalFriend = backup.friends[0];
      
      if (friend.name !== originalFriend.name || friend.age !== originalFriend.age) {
        this.logger.error('Friend data integrity lost during backup/restore');
      }
      
      // Check photos are preserved
      if ((friend.photos?.length || 0) !== (originalFriend.photos?.length || 0)) {
        this.logger.error('Friend photos not preserved during backup/restore');
      }
    }
    
    this.logger.log('✅ Backup and restore operations completed successfully');
  }

  private async testDataClearing() {
    this.logger.log('🗑️ Testing data clearing operations...');
    
    // Test selective clearing
    const beforeClear = {
      friends: await db.friends.count(),
      encounters: await db.encounters.count(),
      interactionTypes: await db.interactionTypes.count()
    };
    
    // Clear only encounters
    await db.encounters.clear();
    
    const afterEncounterClear = {
      friends: await db.friends.count(),
      encounters: await db.encounters.count(),
      interactionTypes: await db.interactionTypes.count()
    };
    
    if (afterEncounterClear.encounters !== 0) {
      this.logger.error('Encounters were not cleared properly');
    }
    
    if (afterEncounterClear.friends !== beforeClear.friends) {
      this.logger.error('Friends were affected by encounter clearing');
    }
    
    // Clear all data
    await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes], async () => {
      await db.friends.clear();
      await db.encounters.clear();
      await db.interactionTypes.clear();
    });
    
    const afterFullClear = {
      friends: await db.friends.count(),
      encounters: await db.encounters.count(),
      interactionTypes: await db.interactionTypes.count()
    };
    
    if (afterFullClear.friends !== 0 || afterFullClear.encounters !== 0 || afterFullClear.interactionTypes !== 0) {
      this.logger.error('Full data clear did not work properly');
    } else {
      this.logger.log('✅ Data clearing operations completed successfully');
    }
    
    // Restore original data if any existed
    if (this.originalFriends.length > 0 || this.originalEncounters.length > 0) {
      await db.transaction('rw', [db.friends, db.encounters], async () => {
        if (this.originalFriends.length > 0) {
          await db.friends.bulkAdd(this.originalFriends);
        }
        if (this.originalEncounters.length > 0) {
          await db.encounters.bulkAdd(this.originalEncounters);
        }
      });
      
      this.logger.log('Original data restored after testing');
    }
  }

  private validateFriendData(original: Partial<Friend>, retrieved: Friend, context: string) {
    const checks = [
      { field: 'name', original: original.name, retrieved: retrieved.name },
      { field: 'age', original: original.age, retrieved: retrieved.age },
      { field: 'bodyType', original: original.bodyType, retrieved: retrieved.bodyType },
      { field: 'sexualRole', original: original.sexualRole, retrieved: retrieved.sexualRole },
      { field: 'photos length', original: original.photos?.length, retrieved: retrieved.photos?.length },
      { field: 'preferences length', original: original.preferences?.length, retrieved: retrieved.preferences?.length }
    ];
    
    for (const check of checks) {
      if (check.original !== check.retrieved) {
        this.logger.error(`${context}: ${check.field} mismatch - expected: ${check.original}, got: ${check.retrieved}`);
      }
    }
  }

  private validateEncounterData(original: Partial<Encounter>, retrieved: Encounter, context: string) {
    const checks = [
      { field: 'rating', original: original.rating, retrieved: retrieved.rating },
      { field: 'beneficiary', original: original.beneficiary, retrieved: retrieved.beneficiary },
      { field: 'durationMinutes', original: original.durationMinutes, retrieved: retrieved.durationMinutes },
      { field: 'participants length', original: original.participants?.length, retrieved: retrieved.participants?.length },
      { field: 'activitiesPerformed length', original: original.activitiesPerformed?.length, retrieved: retrieved.activitiesPerformed?.length },
      { field: 'photos length', original: original.photos?.length, retrieved: retrieved.photos?.length }
    ];
    
    for (const check of checks) {
      if (check.original !== check.retrieved) {
        this.logger.error(`${context}: ${check.field} mismatch - expected: ${check.original}, got: ${check.retrieved}`);
      }
    }
    
    // Check date preservation (within 1 second tolerance)
    if (original.date && Math.abs(original.date.getTime() - retrieved.date.getTime()) > 1000) {
      this.logger.error(`${context}: date not preserved correctly`);
    }
  }
}

// Export test runner function
export async function runDataIntegrityTests(keepTestData: boolean = false): Promise<boolean> {
  const tester = new DataIntegrityTester();
  return await tester.runAllTests(keepTestData);
}

// Export function to create test data without running full tests
export async function createTestDataOnly(): Promise<void> {
  console.log('🎨 Creating MASSIVE & DIVERSE test dataset...');
  console.log(`📊 Generating ${TEST_CONFIG.FRIENDS_COUNT} globally diverse friends and ${TEST_CONFIG.ENCOUNTERS_COUNT} realistic encounters`);
  console.log(`💰 Only ${Math.round(TEST_CONFIG.PAID_ENCOUNTER_RATE * 100)}% paid encounters - much more realistic!`);
  console.log(`🌍 International names, cities, and cultures represented`);
  console.log(`🎯 All activities match configured GAY_ACTIVITIES from schema`);
  console.log('⏳ This may take a moment due to the large dataset...');
  
  // Clear existing data
  await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes], async () => {
    await db.friends.clear();
    await db.encounters.clear();
    await db.interactionTypes.clear();
  });
  
  // Add GAY_ACTIVITIES for encounters
  await db.interactionTypes.bulkAdd(GAY_ACTIVITIES);
  
  // Create friends with progress logging
  const friendIds: number[] = [];
  for (let i = 0; i < TEST_CONFIG.FRIENDS_COUNT; i++) {
    const friendData = generateTestFriend(i);
    const friendId = await friendsApi.create(friendData);
    if (friendId) friendIds.push(friendId);
    
    // Progress logging every 10 friends
    if ((i + 1) % 10 === 0) {
      console.log(`👥 Created ${i + 1}/${TEST_CONFIG.FRIENDS_COUNT} friends...`);
    }
  }
  
  // Create encounters with progress logging
  const encounterIds: number[] = [];
  for (let i = 0; i < TEST_CONFIG.ENCOUNTERS_COUNT; i++) {
    const encounterData = await generateTestEncounter(friendIds, i);
    const encounterId = await encountersApi.create(encounterData);
    if (encounterId) encounterIds.push(encounterId);
    
    // Progress logging every 20 encounters
    if ((i + 1) % 20 === 0) {
      console.log(`🔥 Created ${i + 1}/${TEST_CONFIG.ENCOUNTERS_COUNT} encounters...`);
    }
  }
  
  console.log('� MASSIVE test dataset created successfully!');
  console.log(`✨ Generated ${friendIds.length} friends and ${encounterIds.length} encounters`);
  
  // Comprehensive statistics
  const allFriends = await db.friends.toArray();
  const allEncounters = await db.encounters.toArray();
  const paidEncounters = allEncounters.filter(e => e.isPaid);
  const totalPhotos = allFriends.reduce((sum, f) => sum + (f.photos?.length || 0), 0) + 
                     allEncounters.reduce((sum, e) => sum + (e.photos?.length || 0), 0);
  
  // Calculate exciting personal stats
  const totalMinutes = allEncounters.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const averageRating = allEncounters.reduce((sum, e) => sum + e.rating, 0) / allEncounters.length;
  const topRatedEncounters = allEncounters.filter(e => e.rating >= 4);
  const kinkiestEncounters = allEncounters.filter(e => (e.kinkiness || 0) >= 4);
  const repeatableGuys = allEncounters.filter(e => e.wouldRepeat);
  const safeEncounters = allEncounters.filter(e => e.condomUsed);
  const moneyReceived = paidEncounters.filter(e => e.paymentType === 'received').reduce((sum, e) => sum + (e.amountGiven || 0), 0);
  const moneyPaid = paidEncounters.filter(e => e.paymentType === 'given').reduce((sum, e) => sum + (e.amountGiven || 0), 0);
  const hostingFriends = allFriends.filter(f => f.canHost);
  const prepGuys = allFriends.filter(f => f.onPrep);
  
  console.log('🔥 YOUR PERSONAL SEX STATS:');
  console.log(`� You've got ${allFriends.length} guys in your contact list (${hostingFriends.length} can host you over!)`);
  console.log(`🍆 ${allEncounters.length} total encounters - you're clearly popular! 😏`);
  console.log(`⭐ Average encounter rating: ${averageRating.toFixed(1)}/5 - you know how to pick 'em!`);
  console.log(`🔥 ${topRatedEncounters.length} were 4+ star experiences - incredible encounters!`);
  console.log(`😈 ${kinkiestEncounters.length} were kinky AF (4+ kink rating) - you're adventurous!`);
  console.log(`🔁 ${repeatableGuys.length} guys want to see you again - you're clearly amazing in bed!`);
  
  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const avgDuration = Math.floor(totalMinutes / allEncounters.length);
    console.log(`⏰ ${hours} hours of fun total - averaging ${avgDuration} minutes per session`);
  }
  
  console.log(`📸 ${totalPhotos} steamy photos captured - you're building quite the collection!`);
  console.log(`🛡️ ${safeEncounters.length}/${allEncounters.length} were safe (${Math.round(safeEncounters.length/allEncounters.length*100)}%) - you're smart AND sexy!`);
  console.log(`💊 ${prepGuys.length} friends on PrEP - staying healthy is hot!`);
  
  if (paidEncounters.length > 0) {
    console.log(`💰 MONEY MOVES (${paidEncounters.length} paid encounters - ${Math.round(paidEncounters.length/allEncounters.length*100)}%):`);
    if (moneyReceived > 0) {
      console.log(`   💸 You MADE $${moneyReceived.toFixed(2)} - damn, you're worth every penny!`);
    }
    if (moneyPaid > 0) {
      console.log(`   💳 You spent $${moneyPaid.toFixed(2)} - investing in good times!`);
    }
    const netGain = moneyReceived - moneyPaid;
    if (netGain > 0) {
      console.log(`   🎯 NET PROFIT: +$${netGain.toFixed(2)} - you're making bank! 💅`);
    } else if (netGain < 0) {
      console.log(`   🛍️ NET INVESTMENT: $${Math.abs(netGain).toFixed(2)} - money well spent on pleasure!`);
    } else {
      console.log(`   ⚖️ Perfectly balanced - gave and received equally!`);
    }
  } else {
    console.log(`💝 All encounters were for pure pleasure - no money involved!`);
  }
  
  console.log('🎯 Ready to explore your legendary sex life? Check Friends and Timeline pages! 🔥');
}

// Global test functions for console access
(window as any).runDataIntegrityTests = runDataIntegrityTests;
(window as any).createTestDataOnly = createTestDataOnly;

// Add sample data management functions to console
import { validateSampleDataIntegrity } from '../db/sampleData';
(window as any).validateSampleDataIntegrity = validateSampleDataIntegrity;

console.log('🧪 Data integrity tests loaded!');
console.log('• runDataIntegrityTests() - Full validation (cleans up)');
console.log('• runDataIntegrityTests(true) - Full validation (keeps data)');
console.log('• createTestDataOnly() - Just create test data');
console.log('• validateSampleDataIntegrity() - Fix orphaned sample data references');