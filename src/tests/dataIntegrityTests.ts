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
  TEST_TIMEOUT: 60000          // 60 seconds for larger dataset
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
  // Expanded name pools for more diversity
  const firstNames = [
    'Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harley', 'Indigo', 'Jazz',
    'Kai', 'Logan', 'Morgan', 'Noah', 'Oakley', 'Parker', 'Quinn', 'River', 'Sage', 'Taylor',
    'Adrian', 'Brandon', 'Carter', 'Daniel', 'Ethan', 'Felix', 'Gabriel', 'Hunter', 'Ivan', 'Jake',
    'Kyle', 'Liam', 'Mason', 'Nathan', 'Owen', 'Preston', 'Quincy', 'Ryan', 'Sean', 'Tyler',
    'Victor', 'Wesley', 'Xavier', 'Yuki', 'Zane', 'Aiden', 'Bryce', 'Colin', 'Dylan', 'Eli'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
  ];
  
  const bodyTypes = ['Slim', 'Athletic', 'Average', 'Muscular', 'Chubby', 'Bear', 'Daddy', 'Twink', 'Otter'];
  const roles = ['Top', 'Bottom', 'Versatile', 'Vers Top', 'Vers Bottom', 'Side'];
  const hivStatuses = ['Negative', 'Positive Undetectable', 'Unknown', 'Prefer Not to Say'];
  const relationships = ['Single', 'Taken', 'Open Relationship', 'Married', 'Complicated'];
  const ethnicities = ['White', 'Black', 'Latino', 'Asian', 'Middle Eastern', 'Native American', 'Mixed', 'Other'];
  const occupations = [
    'Teacher', 'Engineer', 'Doctor', 'Nurse', 'Artist', 'Chef', 'Lawyer', 'Student', 'Trainer', 'Designer',
    'Developer', 'Consultant', 'Manager', 'Therapist', 'Photographer', 'Writer', 'Musician', 'Actor',
    'Entrepreneur', 'Mechanic', 'Bartender', 'Server', 'Retail', 'Sales', 'Marketing', 'Finance'
  ];
  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
    'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
    'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'Nashville', 'Baltimore', 'Portland'
  ];
  
  const photos = [];
  for (let i = 0; i < TEST_CONFIG.PHOTOS_PER_FRIEND; i++) {
    photos.push(generateTestPhoto());
  }
  
  // Select random preferences from GAY_ACTIVITIES
  const preferences = [];
  const numPrefs = 3 + Math.floor(Math.random() * 5); // 3-7 preferences
  const availableActivities = [...GAY_ACTIVITIES];
  for (let i = 0; i < numPrefs && availableActivities.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableActivities.length);
    preferences.push(availableActivities.splice(randomIndex, 1)[0].name);
  }
  
  return {
    name: `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    avatarUrl: generateTestPhoto(),
    notes: `Test friend #${index + 1} - Generated for comprehensive testing. Lives in ${cities[Math.floor(Math.random() * cities.length)]}.`,
    age: 18 + Math.floor(Math.random() * 45), // Ages 18-62
    height: `${5 + Math.floor(Math.random() * 2)}'${Math.floor(Math.random() * 12)}"`,
    weight: `${120 + Math.floor(Math.random() * 120)} lbs`, // 120-240 lbs
    bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)] as any,
    ethnicity: ethnicities[Math.floor(Math.random() * ethnicities.length)],
    sexualRole: roles[Math.floor(Math.random() * roles.length)] as any,
    dickSize: `${3 + Math.floor(Math.random() * 7)} inches`, // 3-9 inches
    dickType: Math.random() > 0.3 ? 'Cut' : 'Uncut' as any, // 70% cut
    preferences,
    limits: ['No bareback', 'No pain', 'No kissing', 'No anal', 'No oral'].slice(0, Math.floor(Math.random() * 3)),
    metOn: ['Grindr', 'Romeo', 'Tinder', 'Instagram', 'Bar/Club', 'Friend Intro', 'Work', 'Gym'][Math.floor(Math.random() * 8)] as any,
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
    languages: Math.random() > 0.5 ? ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'].slice(0, 1 + Math.floor(Math.random() * 2)) : ['English'],
    tags: [`tag-${index}`, 'test-friend', 'generated'].concat(
      Math.random() > 0.5 ? ['kinky'] : [],
      Math.random() > 0.7 ? ['romantic'] : [],
      Math.random() > 0.8 ? ['experienced'] : []
    ),
    isArchived: Math.random() > 0.95 // 5% archived
  };
}

async function generateTestEncounter(friendIds: number[], index: number): Promise<Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>> {
  const beneficiaries = ['me', 'friend', 'both'];
  const locations = [
    { lat: 40.7128, lon: -74.0060, place: 'Manhattan, New York' },
    { lat: 34.0522, lon: -118.2437, place: 'West Hollywood, Los Angeles' },
    { lat: 41.8781, lon: -87.6298, place: 'Boystown, Chicago' },
    { lat: 37.7749, lon: -122.4194, place: 'Castro District, San Francisco' },
    { lat: 25.7617, lon: -80.1918, place: 'South Beach, Miami' },
    { lat: 30.2672, lon: -97.7431, place: 'Downtown Austin' },
    { lat: 47.6062, lon: -122.3321, place: 'Capitol Hill, Seattle' },
    { lat: 39.7392, lon: -104.9903, place: 'Denver, Colorado' },
    { lat: 33.4484, lon: -112.0740, place: 'Phoenix, Arizona' },
    { lat: 42.3601, lon: -71.0589, place: 'Back Bay, Boston' },
    { lat: 32.7767, lon: -96.7970, place: 'Oak Lawn, Dallas' },
    { lat: 29.7604, lon: -95.3698, place: 'Montrose, Houston' },
    { lat: 39.2904, lon: -76.6122, place: 'Mount Vernon, Baltimore' },
    { lat: 45.5152, lon: -122.6784, place: 'Pearl District, Portland' },
    { lat: 36.1627, lon: -86.7816, place: 'Music Row, Nashville' }
  ];
  
  const venues = [
    'My place', 'Their place', 'Hotel room', 'Car', 'Public restroom', 'Park', 'Gym', 'Sauna',
    'Bathhouse', 'Adult bookstore', 'Club back room', 'Parking garage', 'Beach', 'Cruise ship',
    'Office building', 'Friend\'s place', 'AirBnB', 'Motel', 'Truck stop', 'Rest area'
  ];
  
  const photos = [];
  for (let i = 0; i < TEST_CONFIG.PHOTOS_PER_ENCOUNTER; i++) {
    photos.push(generateTestPhoto());
  }
  
  // Get available interaction types from database
  const availableTypes = await db.interactionTypes.toArray();
  const randomTypeId = availableTypes.length > 0 
    ? availableTypes[Math.floor(Math.random() * availableTypes.length)].id!
    : 1; // Fallback to ID 1 if no types found
  
  // Random activities selection from available types
  const numActivities = 1 + Math.floor(Math.random() * 5);
  const activitiesPerformed: number[] = [];
  for (let i = 0; i < numActivities && availableTypes.length > 0; i++) {
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    if (randomType.id && !activitiesPerformed.includes(randomType.id)) {
      activitiesPerformed.push(randomType.id);
    }
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
    date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random date in last 6 months
    rating: 1 + Math.floor(Math.random() * 5),
    typeId: randomTypeId, // Use actual interaction type ID from database
    activitiesPerformed,
    participants,
    isAnonymous: Math.random() > 0.8, // 20% anonymous
    beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)] as any,
    durationMinutes: 15 + Math.floor(Math.random() * 180), // 15-195 minutes
    location: Math.random() > 0.2 ? locations[Math.floor(Math.random() * locations.length)] : undefined,
    tags: [`encounter-${index}`, `test-data`, Math.random() > 0.5 ? 'hot' : 'mild', Math.random() > 0.7 ? 'repeat' : 'first-time'],
    notes: `Test encounter #${index + 1} at ${venues[Math.floor(Math.random() * venues.length)]}. ${
      Math.random() > 0.5 ? 'Great chemistry and would definitely meet again!' : 
      Math.random() > 0.5 ? 'Good time, exactly what we both wanted.' :
      'Nice encounter, probably won\'t repeat but no regrets.'
    }`,
    photos,
    
    // Enhanced payment data (50% of encounters have payment info)
    ...(Math.random() > 0.5 ? {
      isPaid: true,
      paymentType: Math.random() > 0.5 ? 'received' as const : 'given' as const,
      amountAsked: Math.floor(Math.random() * 400) + 100, // $100-500 asked
      amountGiven: Math.floor(Math.random() * 300) + 80,   // $80-380 actually paid
      currency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'][Math.floor(Math.random() * 5)] as any,
      paymentMethod: ['cash', 'venmo', 'cashapp', 'paypal', 'zelle', 'crypto'][Math.floor(Math.random() * 6)] as any,
      paymentNotes: [
        'Quick and easy transaction',
        'Paid upfront as agreed',
        'Negotiated down from original price',
        'Tip included for great service',
        'Split payment - cash + app',
        'Generous bonus for extra time'
      ][Math.floor(Math.random() * 6)]
    } : {}),
    
    // Additional encounter details
    myRole: ['Top', 'Bottom', 'Versatile', 'Side'][Math.floor(Math.random() * 4)] as any,
    theirRole: ['Top', 'Bottom', 'Versatile', 'Side'][Math.floor(Math.random() * 4)] as any,
    condomUsed: Math.random() > 0.3, // 70% used condoms
    wouldRepeat: Math.random() > 0.2, // 80% would repeat
    chemistry: 1 + Math.floor(Math.random() * 5), // 1-5 chemistry rating
    kinkiness: 1 + Math.floor(Math.random() * 5), // 1-5 kinkiness rating
    discussedStatus: Math.random() > 0.4, // 60% discussed status
    feelsSafe: Math.random() > 0.1, // 90% felt safe
    exchangedContacts: Math.random() > 0.5, // 50% exchanged contacts
    plannedMeetAgain: Math.random() > 0.6 // 40% planned to meet again
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
  console.log('🎨 Creating MASSIVE test dataset...');
  console.log(`📊 Generating ${TEST_CONFIG.FRIENDS_COUNT} friends and ${TEST_CONFIG.ENCOUNTERS_COUNT} encounters`);
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
    console.log(`� MONEY MOVES:`);
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
    }
  }
  
  console.log('🎯 Ready to explore your legendary sex life? Check Friends and Timeline pages! 🔥');
}

// Global test functions for console access
(window as any).runDataIntegrityTests = runDataIntegrityTests;
(window as any).createTestDataOnly = createTestDataOnly;

console.log('🧪 Data integrity tests loaded!');
console.log('• runDataIntegrityTests() - Full validation (cleans up)');
console.log('• runDataIntegrityTests(true) - Full validation (keeps data)');
console.log('• createTestDataOnly() - Just create test data');