import { db } from '../db/schema';

export interface BackupData {
  version: string;
  timestamp: string;
  friends: any[];
  encounters: any[];
  interactionTypes: any[];
  settings: any[];
  includesPhotos: boolean;
}

export async function createBackup(includePhotos: boolean = true): Promise<BackupData> {
  try {
    // Get all data from IndexedDB
    const friends = await db.friends.toArray();
    const encounters = await db.encounters.toArray();
    const interactionTypes = await db.interactionTypes.toArray();
    const settings = await db.settings.toArray();

    // Process friends to handle photos
    const processedFriends = friends.map(friend => {
      if (!includePhotos) {
        // Remove photo data but keep references
        return {
          ...friend,
          avatarUrl: friend.avatarUrl?.startsWith('data:') ? '[PHOTO_REMOVED]' : friend.avatarUrl,
          photos: friend.photos ? friend.photos.map(photo => 
            photo.startsWith('data:') ? '[PHOTO_REMOVED]' : photo
          ) : undefined
        };
      }
      return friend;
    });

    // Process encounters to handle photos
    const processedEncounters = encounters.map(encounter => {
      if (!includePhotos) {
        // Remove photo data but keep references
        return {
          ...encounter,
          photos: encounter.photos ? encounter.photos.map(photo => 
            photo.startsWith('data:') ? '[PHOTO_REMOVED]' : photo
          ) : undefined
        };
      }
      return encounter;
    });

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      friends: processedFriends,
      encounters: processedEncounters,
      interactionTypes,
      settings,
      includesPhotos: includePhotos
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
}

export async function downloadBackup(includePhotos: boolean = true): Promise<void> {
  try {
    const backupData = await createBackup(includePhotos);
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const sizeIndicator = includePhotos ? 'full' : 'no-photos';
    a.href = url;
    a.download = `encounter-ledger-backup-${timestamp}-${sizeIndicator}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
}

export async function restoreFromBackup(backupData: BackupData): Promise<void> {
  try {
    // Clear existing data (ask for confirmation first)
    if (!confirm('This will replace ALL existing data. Are you sure?')) {
      return;
    }

    await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes, db.settings], async () => {
      // Clear all tables
      await db.friends.clear();
      await db.encounters.clear();
      await db.interactionTypes.clear();
      await db.settings.clear();

      // Restore data
      if (backupData.friends?.length > 0) {
        await db.friends.bulkAdd(backupData.friends);
      }
      
      if (backupData.encounters?.length > 0) {
        await db.encounters.bulkAdd(backupData.encounters);
      }
      
      if (backupData.interactionTypes?.length > 0) {
        await db.interactionTypes.bulkAdd(backupData.interactionTypes);
      }
      
      if (backupData.settings?.length > 0) {
        await db.settings.bulkAdd(backupData.settings);
      }
    });

    alert('Backup restored successfully!');
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new Error('Failed to restore backup');
  }
}

export function getBackupSize(backupData: BackupData): { size: number; sizeFormatted: string } {
  const jsonString = JSON.stringify(backupData);
  const size = new Blob([jsonString]).size;
  
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    size,
    sizeFormatted: formatSize(size)
  };
}

export async function showBackupPrompt(): Promise<void> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">💾 Save Backup?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Would you like to save a backup of your data after this change?
        </p>
        
        <div class="space-y-3">
          <button id="backup-with-photos" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📸 Full Backup (with photos)
          </button>
          <button id="backup-no-photos" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            ⚡ Quick Backup (no photos)
          </button>
          <button id="backup-skip" class="w-full px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Skip for now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const withPhotos = modal.querySelector('#backup-with-photos') as HTMLButtonElement;
    const noPhotos = modal.querySelector('#backup-no-photos') as HTMLButtonElement;
    const skip = modal.querySelector('#backup-skip') as HTMLButtonElement;

    const cleanup = () => {
      document.body.removeChild(modal);
      resolve();
    };

    withPhotos?.addEventListener('click', async () => {
      try {
        await downloadBackup(true);
        alert('✅ Full backup downloaded successfully!');
      } catch (error) {
        alert('❌ Backup failed: ' + (error as Error).message);
      }
      cleanup();
    });

    noPhotos?.addEventListener('click', async () => {
      try {
        await downloadBackup(false);
        alert('✅ Quick backup downloaded successfully!');
      } catch (error) {
        alert('❌ Backup failed: ' + (error as Error).message);
      }
      cleanup();
    });

    skip?.addEventListener('click', cleanup);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup();
    });
  });
}