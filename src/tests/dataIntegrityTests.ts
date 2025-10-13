import { db, GAY_ACTIVITIES } from '../db/schema';
import { friendsApi, encountersApi } from '../hooks/useDatabase';
import { createBackup, restoreFromBackup } from '../utils/backup';
import type { Friend, Encounter } from '../db/schema';

// Test configuration
const TEST_CONFIG = {
  FRIENDS_COUNT: 10,
  ENCOUNTERS_COUNT: 20,
  PHOTOS_PER_FRIEND: 3,
  PHOTOS_PER_ENCOUNTER: 2,
  TEST_TIMEOUT: 30000 // 30 seconds
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
  const names = ['Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harley', 'Indigo', 'Jazz'];
  const bodyTypes = ['Slim', 'Athletic', 'Average', 'Muscular', 'Chubby', 'Bear', 'Daddy', 'Twink', 'Otter'];
  const roles = ['Top', 'Bottom', 'Versatile', 'Vers Top', 'Vers Bottom', 'Side'];
  const hivStatuses = ['Negative', 'Positive Undetectable', 'Unknown'];
  const relationships = ['Single', 'Taken', 'Open Relationship', 'Married'];
  
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
    name: `${names[index % names.length]} ${index + 1}`,
    avatarUrl: generateTestPhoto(),
    notes: `Test friend #${index + 1} - Generated for data integrity testing`,
    age: 18 + Math.floor(Math.random() * 30),
    height: `${5 + Math.floor(Math.random() * 2)}'${Math.floor(Math.random() * 12)}"`,
    weight: `${120 + Math.floor(Math.random() * 80)} lbs`,
    bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)] as any,
    sexualRole: roles[Math.floor(Math.random() * roles.length)] as any,
    dickSize: `${4 + Math.floor(Math.random() * 5)} inches`,
    preferences,
    limits: ['No bareback', 'No pain'].slice(0, Math.floor(Math.random() * 2) + 1),
    socialProfiles: {
      grindr: `testuser${index}`,
      instagram: `@testuser${index}`,
      twitter: `@test${index}`,
      telegram: `@user${index}`,
      whatsapp: `+1555000${String(index).padStart(4, '0')}`,
      phone: `+1555000${String(index).padStart(4, '0')}`
    },
    photos,
    lastTested: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
    hivStatus: hivStatuses[Math.floor(Math.random() * hivStatuses.length)] as any,
    onPrep: Math.random() > 0.5,
    relationshipStatus: relationships[Math.floor(Math.random() * relationships.length)] as any,
    location: `${Math.floor(Math.random() * 10)} miles away`,
    isArchived: false
  };
}

function generateTestEncounter(friendIds: number[], index: number): Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'> {
  const beneficiaries = ['me', 'friend', 'both'];
  const locations = [
    { lat: 40.7128, lon: -74.0060, place: 'New York, NY' },
    { lat: 34.0522, lon: -118.2437, place: 'Los Angeles, CA' },
    { lat: 41.8781, lon: -87.6298, place: 'Chicago, IL' }
  ];
  
  const photos = [];
  for (let i = 0; i < TEST_CONFIG.PHOTOS_PER_ENCOUNTER; i++) {
    photos.push(generateTestPhoto());
  }
  
  // Random activities selection
  const numActivities = 1 + Math.floor(Math.random() * 5);
  const activitiesPerformed: number[] = [];
  for (let i = 0; i < numActivities; i++) {
    const activityIndex = Math.floor(Math.random() * GAY_ACTIVITIES.length) + 1; // +1 because DB IDs start at 1
    if (!activitiesPerformed.includes(activityIndex)) {
      activitiesPerformed.push(activityIndex);
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
    typeId: 1 + Math.floor(Math.random() * 10), // Random interaction type ID
    activitiesPerformed,
    participants,
    isAnonymous: Math.random() > 0.8, // 20% anonymous
    beneficiary: beneficiaries[Math.floor(Math.random() * beneficiaries.length)] as any,
    durationMinutes: 15 + Math.floor(Math.random() * 180), // 15-195 minutes
    location: Math.random() > 0.3 ? locations[Math.floor(Math.random() * locations.length)] : undefined,
    tags: [`tag${index}`, `test-encounter`],
    notes: `Test encounter #${index + 1} - Generated for comprehensive testing`,
    photos,
    amountGiven: Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 50 : undefined,
    currency: Math.random() > 0.7 ? ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)] as any : undefined
  };
}

// Test functions
export class DataIntegrityTester {
  private logger = new TestLogger();
  private originalFriends: Friend[] = [];
  private originalEncounters: Encounter[] = [];
  private testFriendIds: number[] = [];
  private testEncounterIds: number[] = [];

  async runAllTests(): Promise<boolean> {
    this.logger.log('🚀 Starting comprehensive data integrity tests...');
    
    try {
      await this.clearTestData();
      await this.testFriendsOperations();
      await this.testEncountersOperations();
      await this.testBackupAndRestore();
      await this.testDataClearing();
      
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
      const encounterData = generateTestEncounter(this.testFriendIds, i);
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
export async function runDataIntegrityTests(): Promise<boolean> {
  const tester = new DataIntegrityTester();
  return await tester.runAllTests();
}

// Global test function for console access
(window as any).runDataIntegrityTests = runDataIntegrityTests;

console.log('🧪 Data integrity tests loaded. Run with: runDataIntegrityTests()');