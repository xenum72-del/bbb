import { db } from './schema';
import type { Friend, Encounter } from './schema';



// Configuration for realistic sample data
const SAMPLE_CONFIG = {
  FRIENDS_COUNT: 65,           // Enough friends to create realistic encounters
  ENCOUNTERS_COUNT: 221,       // Exactly as requested
  PAID_ENCOUNTER_RATE: 0.08,   // Only 8% paid encounters (very few, mostly massage)
  AVERAGE_RATING: 4.2          // Above 4 stars average as requested
};

// Generate realistic sample photo (placeholder)
function generateSamplePhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d')!;
  
  // Generate attractive gradient
  const gradient = ctx.createLinearGradient(0, 0, 200, 200);
  gradient.addColorStop(0, `hsl(${Math.random() * 360}, 60%, 70%)`);
  gradient.addColorStop(1, `hsl(${Math.random() * 360}, 60%, 80%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 200, 200);
  
  return canvas.toDataURL();
}

// Realistic names for Central/Eastern Europe, India, and LA area
const REALISTIC_NAMES = {
  // Central/Eastern European names
  centralEurope: [
    'Aleksander', 'Darius', 'Emil', 'Filip', 'Georgi', 'Ivan', 'Jakub', 'Krzysztof', 'Lukáš', 'Marko',
    'Nikola', 'Ondřej', 'Pavel', 'Radek', 'Stefan', 'Tomáš', 'Viktor', 'Wojciech', 'Zoran', 'Adrian',
    'xenum72-del', 'Cezar', 'Damian', 'Eduard', 'Ferenc', 'Gábor', 'Henrik', 'István', 'János', 'Károly',
    'László', 'Miklós', 'Norbert', 'Olivér', 'Péter', 'Richárd', 'Sándor', 'Tamás', 'Ulrich', 'Vilmos'
  ],
  
  // Indian names
  indian: [
    'Aarav', 'Arjun', 'Dev', 'Dhruv', 'Ishaan', 'Karan', 'Manav', 'Nikhil', 'Pranav', 'Rohan',
    'Sahil', 'Tanvi', 'Uday', 'Varun', 'Yash', 'Aditya', 'Akash', 'Ankit', 'Bharath', 'Chetan',
    'Deepak', 'Gaurav', 'Harsh', 'Jay', 'Kunal', 'Mohit', 'Neel', 'Omkar', 'Pawan', 'Raj',
    'Siddharth', 'Tarun', 'Utkarsh', 'Vikram', 'Yuvraj', 'Aman', 'Ashwin', 'Chinmay', 'Dhanush', 'Girish'
  ],
  
  // LA/American names
  american: [
    'Alex', 'Brandon', 'Chad', 'Dylan', 'Ethan', 'Felix', 'Gavin', 'Hunter', 'Ian', 'Jake',
    'Kyle', 'Logan', 'Mason', 'Noah', 'Owen', 'Parker', 'Quinn', 'Ryan', 'Sean', 'Tyler',
    'Austin', 'Blake', 'Cole', 'Drew', 'Evan', 'Grant', 'Hayden', 'Isaac', 'Jordan', 'Kevin',
    'Luke', 'Max', 'Nathan', 'Oscar', 'Preston', 'Quinton', 'Reed', 'Scott', 'Trevor', 'Wesley'
  ]
};

const REALISTIC_SURNAMES = {
  centralEurope: [
    'Novák', 'Svoboda', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný',
    'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
    'Kowalski', 'Nowak', 'Wiśniewski', 'Dąbrowski', 'Lewandowski', 'Wójcik', 'Kamiński', 'Kowalczyk', 'Zieliński', 'Szymański',
    'Popović', 'Nikolić', 'Marković', 'Petrović', 'Stojanović', 'Jovanović', 'Đorđević', 'Milosević', 'Pavlović', 'Milić'
  ],
  
  indian: [
    'Sharma', 'Gupta', 'Singh', 'Kumar', 'Verma', 'Agarwal', 'Patel', 'Jain', 'Mishra', 'Shah',
    'Yadav', 'Tiwari', 'Pandey', 'Srivastava', 'Shukla', 'Tripathi', 'Chandra', 'Mehta', 'Bansal', 'Agnihotri',
    'Reddy', 'Rao', 'Krishna', 'Raman', 'Nair', 'Menon', 'Pillai', 'Iyer', 'Mukherjee', 'Chatterjee',
    'Bose', 'Das', 'Roy', 'Sengupta', 'Ghosh', 'Dutta', 'Chakraborty', 'Banerjee', 'Sarkar', 'Bhattacharya'
  ],
  
  american: [
    'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez',
    'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'
  ]
};

// Realistic locations as requested
const REALISTIC_LOCATIONS = {
  // Central and Eastern Europe
  centralEurope: [
    { lat: 50.0755, lon: 14.4378, place: 'Prague, Czech Republic' },
    { lat: 52.2297, lon: 21.0122, place: 'Warsaw, Poland' },
    { lat: 47.4979, lon: 19.0402, place: 'Budapest, Hungary' },
    { lat: 44.8176, lon: 20.4633, place: 'Belgrade, Serbia' },
    { lat: 45.8150, lon: 15.9819, place: 'Zagreb, Croatia' },
    { lat: 46.0569, lon: 14.5058, place: 'Ljubljana, Slovenia' },
    { lat: 48.1486, lon: 17.1077, place: 'Bratislava, Slovakia' },
    { lat: 44.4268, lon: 26.1025, place: 'Bucharest, Romania' },
    { lat: 42.6977, lon: 23.3219, place: 'Sofia, Bulgaria' },
    { lat: 59.9139, lon: 10.7522, place: 'Oslo, Norway' },
    { lat: 59.3293, lon: 18.0686, place: 'Stockholm, Sweden' },
    { lat: 55.6761, lon: 12.5683, place: 'Copenhagen, Denmark' },
    { lat: 60.1699, lon: 24.9384, place: 'Helsinki, Finland' }
  ],
  
  // India
  india: [
    { lat: 19.0760, lon: 72.8777, place: 'Mumbai, India' },
    { lat: 28.7041, lon: 77.1025, place: 'Delhi, India' },
    { lat: 12.9716, lon: 77.5946, place: 'Bangalore, India' },
    { lat: 13.0827, lon: 80.2707, place: 'Chennai, India' },
    { lat: 22.5726, lon: 88.3639, place: 'Kolkata, India' },
    { lat: 18.5204, lon: 73.8567, place: 'Pune, India' },
    { lat: 23.0225, lon: 72.5714, place: 'Ahmedabad, India' },
    { lat: 17.3850, lon: 78.4867, place: 'Hyderabad, India' },
    { lat: 26.9124, lon: 75.7873, place: 'Jaipur, India' },
    { lat: 25.5941, lon: 85.1376, place: 'Patna, India' }
  ],
  
  // Los Angeles area
  losAngeles: [
    { lat: 34.0522, lon: -118.2437, place: 'West Hollywood, CA' },
    { lat: 34.0928, lon: -118.3287, place: 'Beverly Hills, CA' },
    { lat: 34.0195, lon: -118.4912, place: 'Santa Monica, CA' },
    { lat: 34.1625, lon: -118.3667, place: 'Hollywood, CA' },
    { lat: 34.0736, lon: -118.4004, place: 'Culver City, CA' },
    { lat: 34.0389, lon: -118.2509, place: 'Downtown LA, CA' },
    { lat: 34.1030, lon: -118.4107, place: 'Westwood, CA' },
    { lat: 34.0901, lon: -118.4065, place: 'Brentwood, CA' },
    { lat: 34.0633, lon: -118.3584, place: 'Mid-City LA, CA' },
    { lat: 34.1184, lon: -118.3004, place: 'Silver Lake, CA' }
  ]
};

// Generate realistic friend data
function generateRealisticFriend(): Omit<Friend, 'id' | 'createdAt' | 'updatedAt'> {
  // Choose region randomly but with some distribution
  const regionRandom = Math.random();
  let region: 'centralEurope' | 'india' | 'american';
  let firstName: string;
  let lastName: string;
  
  if (regionRandom < 0.4) {
    region = 'centralEurope';
    firstName = REALISTIC_NAMES.centralEurope[Math.floor(Math.random() * REALISTIC_NAMES.centralEurope.length)];
    lastName = REALISTIC_SURNAMES.centralEurope[Math.floor(Math.random() * REALISTIC_SURNAMES.centralEurope.length)];
  } else if (regionRandom < 0.7) {
    region = 'american';
    firstName = REALISTIC_NAMES.american[Math.floor(Math.random() * REALISTIC_NAMES.american.length)];
    lastName = REALISTIC_SURNAMES.american[Math.floor(Math.random() * REALISTIC_SURNAMES.american.length)];
  } else {
    region = 'india';
    firstName = REALISTIC_NAMES.indian[Math.floor(Math.random() * REALISTIC_NAMES.indian.length)];
    lastName = REALISTIC_SURNAMES.indian[Math.floor(Math.random() * REALISTIC_SURNAMES.indian.length)];
  }

  // Age between 22 and 34 as requested
  const age = 22 + Math.floor(Math.random() * 13);
  
  // Location based on region
  const locationPool = region === 'centralEurope' ? REALISTIC_LOCATIONS.centralEurope :
                      region === 'india' ? REALISTIC_LOCATIONS.india :
                      REALISTIC_LOCATIONS.losAngeles;
  const location = locationPool[Math.floor(Math.random() * locationPool.length)];
  
  // Realistic notes without "test" anywhere
  const noteOptions = [
    `Met ${firstName} at a coffee shop near ${location.place.split(',')[0]}. Really down to earth guy with great energy.`,
    `Connected through mutual friends. ${firstName} has this amazing smile and we had instant chemistry.`,
    `Bumped into each other at the gym. Super fit and motivated, we hit it off immediately.`,
    `Met during a weekend trip. ${firstName} showed me around the local spots and we had an amazing time.`,
    `College friend who moved to ${location.place.split(',')[0]}. Always fun to catch up with.`,
    `Work colleague turned friend. ${firstName} is incredibly smart and has a great sense of humor.`,
    `Met at a party through friends. We ended up talking all night about travel and life goals.`,
    `Neighbor who I got to know over time. ${firstName} is super friendly and always up for adventures.`,
    `Met while volunteering at a local event. Passionate about making a difference in the community.`,
    `Connected online and met for drinks. ${firstName} is exactly as charming in person as expected.`
  ];
  
  return {
    name: `${firstName} ${lastName}`,
    avatarUrl: generateSamplePhoto(),
    notes: noteOptions[Math.floor(Math.random() * noteOptions.length)],
    age,
    height: `${5 + Math.floor(Math.random() * 2)}'${Math.floor(Math.random() * 12)}"`,
    weight: `${140 + Math.floor(Math.random() * 60)} lbs`,
    bodyType: ['Slim', 'Athletic', 'Average', 'Muscular'][Math.floor(Math.random() * 4)] as 'Slim' | 'Athletic' | 'Average' | 'Muscular',
    ethnicity: region === 'centralEurope' ? 'European' : 
               region === 'india' ? 'South Asian' : 
               ['White', 'Hispanic', 'Mixed Race'][Math.floor(Math.random() * 3)],
    sexualRole: ['Top', 'Bottom', 'Versatile', 'Vers Top', 'Vers Bottom'][Math.floor(Math.random() * 5)] as 'Top' | 'Bottom' | 'Versatile' | 'Vers Top' | 'Vers Bottom',
    dickSize: `${5.5 + Math.random() * 2}".slice(0, 3)} inches`,
    dickType: Math.random() > 0.5 ? 'Cut' : 'Uncut',
    relationshipStatus: ['Single', 'Open Relationship', 'Complicated'][Math.floor(Math.random() * 3)] as 'Single' | 'Open Relationship' | 'Complicated',
    hivStatus: ['Negative', 'Unknown'][Math.floor(Math.random() * 2)] as 'Negative' | 'Unknown',
    onPrep: Math.random() > 0.6,
    location: `${location.place}, ${Math.floor(Math.random() * 15) + 1}km away`,
    canHost: Math.random() > 0.4,
    canTravel: Math.random() > 0.3,
    overallRating: Math.random() > 0.2 ? 3 + Math.floor(Math.random() * 3) : undefined,
    sexRating: Math.random() > 0.3 ? 3 + Math.floor(Math.random() * 3) : undefined,
    personalityRating: Math.random() > 0.3 ? 3 + Math.floor(Math.random() * 3) : undefined,
    photos: [generateSamplePhoto()],
    tags: [],
    isArchived: false
  };
}

// Generate realistic encounter data using ONLY database IDs
async function generateRealisticEncounter(friendIds: number[]): Promise<Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>> {
  // Get all available activities from database - NO HARDCODED NAMES!
  const availableActivities = await db.interactionTypes.toArray();
  
  if (availableActivities.length === 0) {
    throw new Error('No interaction types available - cannot generate encounters');
  }
  
  // Duration between 15 and 90 minutes as requested
  const duration = 15 + Math.floor(Math.random() * 76);
  
  // Ratings mostly positive, average above 4 stars as requested
  const ratingRandom = Math.random();
  let rating: number;
  if (ratingRandom < 0.1) rating = 3; // 10% okay
  else if (ratingRandom < 0.4) rating = 4; // 30% good  
  else rating = 5; // 60% amazing (ensures average > 4)
  
  // Use ONLY database IDs - randomly select from available activities
  const primaryActivity = availableActivities[Math.floor(Math.random() * availableActivities.length)];
  
  // Add 1-3 activities per encounter using only available IDs
  const numActivities = 1 + Math.floor(Math.random() * Math.min(3, availableActivities.length));
  const activitiesPerformed: number[] = [primaryActivity.id!];
  
  // Add additional random activities
  for (let i = 1; i < numActivities; i++) {
    const additionalActivity = availableActivities[Math.floor(Math.random() * availableActivities.length)];
    if (!activitiesPerformed.includes(additionalActivity.id!)) {
      activitiesPerformed.push(additionalActivity.id!);
    }
  }
  
  // Very few paid encounters
  const isPaid = Math.random() < SAMPLE_CONFIG.PAID_ENCOUNTER_RATE;
  
  // Build encounter object
  const encounter: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'> = {
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    rating,
    durationMinutes: duration,
    participants: [friendIds[Math.floor(Math.random() * friendIds.length)]],
    isAnonymous: Math.random() < 0.1, // 10% anonymous
    typeId: primaryActivity.id!,
    activitiesPerformed,
    beneficiary: ['me', 'friend', 'both'][Math.floor(Math.random() * 3)] as 'me' | 'friend' | 'both',
    location: REALISTIC_LOCATIONS.centralEurope.concat(REALISTIC_LOCATIONS.india, REALISTIC_LOCATIONS.losAngeles)[Math.floor(Math.random() * 23)],
    notes: [
      'Amazing chemistry and great conversation.',
      'Really enjoyed our time together.',
      'Perfect evening, would definitely repeat.',
      'Great connection and lots of fun.',
      'Exceeded expectations, wonderful experience.',
      'Natural chemistry and comfortable atmosphere.',
      'Memorable encounter, looking forward to next time.',
      'Relaxed and enjoyable, exactly what I needed.',
      'Fantastic time, we really clicked.',
      'Beautiful experience with genuine connection.'
    ][Math.floor(Math.random() * 10)],
    wouldRepeat: rating >= 4,
    chemistry: rating,
    isPaid: false,
    condomUsed: Math.random() > 0.3, // 70% use protection
    exchangedContacts: Math.random() > 0.2,
    plannedMeetAgain: rating >= 4 && Math.random() > 0.3
  };
  
  // Add payment data if paid
  if (isPaid) {
    encounter.isPaid = true;
    encounter.paymentType = 'received';
    encounter.amountAsked = 80 + Math.floor(Math.random() * 120);
    encounter.amountGiven = encounter.amountAsked - Math.floor(Math.random() * 20);
    encounter.currency = 'USD';
    encounter.paymentMethod = ['cash', 'venmo', 'cashapp'][Math.floor(Math.random() * 3)] as 'cash' | 'venmo' | 'cashapp' | 'paypal';
    encounter.paymentNotes = 'Professional massage with happy ending';
    encounter.notes = `Professional massage session. ${encounter.paymentNotes}`;
  }
  
  return encounter;
}

// Main function to generate all sample data
export async function generateRealisticSampleData(): Promise<void> {
  try {
    console.log('🚀 Generating realistic sample data...');
    
    // Clear existing data
    await db.friends.clear();
    await db.encounters.clear();
    
    // Generate friends
    console.log(`👥 Generating ${SAMPLE_CONFIG.FRIENDS_COUNT} realistic friends...`);
    const friendsData: Omit<Friend, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < SAMPLE_CONFIG.FRIENDS_COUNT; i++) {
      friendsData.push(generateRealisticFriend());
    }
    
    // Add friends to database and get their IDs
    const friendIds: number[] = [];
    for (const friendData of friendsData) {
      const id = await db.friends.add({
        ...friendData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      if (id !== undefined) {
        friendIds.push(id);
      }
    }
    
    // Generate encounters
    console.log(`📅 Generating ${SAMPLE_CONFIG.ENCOUNTERS_COUNT} realistic encounters...`);
    const encountersData: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 0; i < SAMPLE_CONFIG.ENCOUNTERS_COUNT; i++) {
      const encounterData = await generateRealisticEncounter(friendIds);
      encountersData.push(encounterData);
    }
    
    // Add encounters to database
    for (const encounterData of encountersData) {
      await db.encounters.add({
        ...encounterData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('✅ Sample data generation completed successfully!');
    console.log(`📊 Generated: ${SAMPLE_CONFIG.FRIENDS_COUNT} friends, ${SAMPLE_CONFIG.ENCOUNTERS_COUNT} encounters`);
    console.log(`💰 Paid encounters: ~${Math.round(SAMPLE_CONFIG.PAID_ENCOUNTER_RATE * 100)}% (mostly massage)`);
    console.log(`⭐ Average rating: ~${SAMPLE_CONFIG.AVERAGE_RATING} stars`);
    
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    throw error;
  }
}

// Function to update existing sample data when interaction types change
export async function updateSampleDataForTypeChanges(deletedTypeId: number, replacementTypeId: number): Promise<void> {
  console.log(`🔄 Updating sample data: replacing type ${deletedTypeId} with ${replacementTypeId}`);
  
  try {
    // Update encounters that used the deleted type as their main type
    const encountersToUpdate = await db.encounters.where('typeId').equals(deletedTypeId).toArray();
    
    for (const encounter of encountersToUpdate) {
      await db.encounters.update(encounter.id!, {
        typeId: replacementTypeId
      });
    }
    
    // Update encounters that included the deleted type in their activities
    const allEncounters = await db.encounters.toArray();
    
    for (const encounter of allEncounters) {
      if (encounter.activitiesPerformed?.includes(deletedTypeId)) {
        const updatedActivities = encounter.activitiesPerformed.map(id => 
          id === deletedTypeId ? replacementTypeId : id
        );
        
        await db.encounters.update(encounter.id!, {
          activitiesPerformed: updatedActivities
        });
      }
    }
    
    console.log(`✅ Updated ${encountersToUpdate.length} encounters with new type mapping`);
    
  } catch (error) {
    console.error('❌ Error updating sample data for type changes:', error);
    throw error;
  }
}

// Function to validate and fix any orphaned references in sample data
export async function validateSampleDataIntegrity(): Promise<void> {
  console.log('🔍 Validating sample data integrity...');
  
  try {
    const availableTypeIds = new Set((await db.interactionTypes.toArray()).map(t => t.id!));
    const allEncounters = await db.encounters.toArray();
    
    let fixedCount = 0;
    
    for (const encounter of allEncounters) {
      let needsUpdate = false;
      const updates: Partial<Encounter> = {};
      
      // Check main type ID
      if (!availableTypeIds.has(encounter.typeId)) {
        const firstAvailableType = await db.interactionTypes.orderBy('id').first();
        if (firstAvailableType) {
          updates.typeId = firstAvailableType.id!;
          needsUpdate = true;
        }
      }
      
      // Check activities performed
      if (encounter.activitiesPerformed) {
        const validActivities = encounter.activitiesPerformed.filter(id => availableTypeIds.has(id));
        if (validActivities.length !== encounter.activitiesPerformed.length) {
          // If no valid activities remain, use the main type
          updates.activitiesPerformed = validActivities.length > 0 ? validActivities : [updates.typeId || encounter.typeId];
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await db.encounters.update(encounter.id!, updates);
        fixedCount++;
      }
    }
    
    if (fixedCount > 0) {
      console.log(`🔧 Fixed ${fixedCount} encounters with orphaned type references`);
    } else {
      console.log('✅ All sample data references are valid');
    }
    
  } catch (error) {
    console.error('❌ Error validating sample data integrity:', error);
    throw error;
  }
}

// Export for use in development/testing
export default generateRealisticSampleData;