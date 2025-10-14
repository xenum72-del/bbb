import { db } from '../db/schema';

import type { Friend, Encounter, InteractionType, Settings } from '../db/schema';

export interface BackupData {
  version: string;
  timestamp: string;
  friends: Friend[];
  encounters: Encounter[];
  interactionTypes: InteractionType[];
  settings: Settings[];
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
    a.download = `the-load-down-backup-${timestamp}-${sizeIndicator}.json`;
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

// Get auto backup settings from Azure config
function getAutoBackupSettings() {
  const saved = localStorage.getItem('azure-backup-config');
  if (!saved) {
    return { enabled: false, retentionCount: 10, container: 'auto-backups' };
  }
  
  try {
    const config = JSON.parse(saved);
    return {
    enabled: config.autoBackupEnabled || false,
    retentionCount: config.autoBackupRetention || 10,
    container: config.autoBackupContainer || config.containerName || 'backups'
    };
  } catch {
    return { enabled: false, retentionCount: 10, container: 'auto-backups' };
  }
}

// Check if we should show manual backup prompt
export function shouldShowBackupPrompt(): boolean {
  const autoSettings = getAutoBackupSettings();
  const azureConfigured = isAzureConfigured();
  
  console.log('shouldShowBackupPrompt check:', {
    autoEnabled: autoSettings.enabled,
    azureConfigured,
    shouldShow: !(autoSettings.enabled && azureConfigured)
  });
  
  // If auto backup is enabled and Azure is configured, don't show manual prompt
  if (autoSettings.enabled && azureConfigured) {
    return false;
  }
  
  // Otherwise, show the manual backup prompt
  return true;
}

// Check if Azure backup is configured
export function isAzureConfigured(): boolean {
  const saved = localStorage.getItem('azure-backup-config');
  if (!saved) return false;
  
  try {
    const config = JSON.parse(saved);
    return config.enabled && config.storageAccount && config.sasToken && config.containerName;
  } catch {
    return false;
  }
}

// Get Azure service if configured
async function getAzureService(): Promise<import('../utils/azureStorage').AzureStorageService | null> {
  if (!isAzureConfigured()) return null;
  
  const saved = localStorage.getItem('azure-backup-config');
  if (!saved) return null;
  
  try {
    const config = JSON.parse(saved);
    const { AzureStorageService } = await import('../utils/azureStorage');
    const userId = localStorage.getItem('azure-user-id') || 'user_' + Math.random().toString(36).substr(2, 16);
    if (!localStorage.getItem('azure-user-id')) {
      localStorage.setItem('azure-user-id', userId);
    }
    return new AzureStorageService(config, userId);
  } catch {
    return null;
  }
}

// Simple online check (doesn't require Azure credentials)
async function isOnline(): Promise<boolean> {
  // Just trust the browser's built-in connectivity detection
  // This avoids external API calls and privacy concerns
  return navigator.onLine;
}

// Automatic Azure backup with rolling retention (data only, no photos)
export async function triggerAutoAzureBackup(): Promise<void> {
  console.log('🔄 triggerAutoAzureBackup called');
  const autoSettings = getAutoBackupSettings();
  console.log('📋 Auto settings:', autoSettings);
  
  if (!autoSettings.enabled) {
    console.log('❌ Auto backup not enabled, skipping');
    return;
  }
  
  if (!isAzureConfigured()) {
    console.log('❌ Azure not configured, skipping');
    return;
  }
  
  const online = await isOnline();
  if (!online) {
    console.log('❌ Not online, skipping');
    return;
  }
  
  console.log('✅ All checks passed, proceeding with auto backup');

  try {
    const service = await getAzureService();
    if (!service) return;

    // Get Azure backup settings to use dedicated container for auto backups
    const config = JSON.parse(localStorage.getItem('azure-backup-config') || '{}');
    const autoBackupContainer = autoSettings.container;
    
    // Create a special Azure service instance for auto backups if different container
    let autoService = service;
    console.log('🗂️ Main container:', config.containerName);
    console.log('🗂️ Auto backup container:', autoBackupContainer);
    if (autoBackupContainer !== config.containerName) {
      console.log('🔄 Creating separate service for auto backup container');
      const { AzureStorageService } = await import('../utils/azureStorage');
      const userId = localStorage.getItem('azure-user-id') || 'user_' + Math.random().toString(36).substr(2, 16);
      autoService = new AzureStorageService({
        ...config,
        containerName: autoBackupContainer
      }, userId);
    } else {
      console.log('✅ Using same container for auto backups');
    }

    // Create backup without photos (faster/smaller)
    const timestamp = Date.now();
    const backupId = `auto_${timestamp}.json`;
    
    // Create data-only backup
    const backupData = await createBackup(false); // false = no photos
    
    // Upload to Azure (async, non-blocking)
    const jsonString = JSON.stringify(backupData, null, 2);
    await autoService.uploadBlob(backupId, jsonString);

    // Implement rolling retention: keep only configured number of newest backups
    console.log('🧹 Starting backup cleanup, retention count:', autoSettings.retentionCount);
    console.log('🗂️ Auto backup container:', config.autoBackupContainer || config.containerName);
    try {
      console.log('📋 Listing existing auto backups...');
      const autoBackups = await autoService.listBlobs('auto_');
      console.log('🤖 Found', autoBackups.length, 'auto backups:', autoBackups);

      // Delete oldest backups if we have more than the retention count
      if (autoBackups.length > autoSettings.retentionCount) {
        // Sort by name (which includes timestamp) to get oldest first
        const sortedBackups = autoBackups.sort();
        const backupsToDelete = sortedBackups.slice(0, autoBackups.length - autoSettings.retentionCount);
        console.log('🗑️ Need to delete', backupsToDelete.length, 'old backups:', backupsToDelete);
        
        for (const backupId of backupsToDelete) {
          try {
            console.log('🗑️ Deleting backup:', backupId);
            await autoService.deleteBackup(backupId);
            console.log('✅ Deleted backup:', backupId);
          } catch (error) {
            console.warn('❌ Failed to delete old backup:', backupId, error);
          }
        }
      } else {
        console.log('✅ No cleanup needed, within retention limit');
      }
    } catch (error) {
      console.warn('⚠️ Failed to clean up old auto-backups (continuing anyway):', error);
    }

    console.log('✅ Automatic Azure backup completed:', backupId);
  } catch (error) {
    console.warn('Automatic Azure backup failed (silently):', error);
    // Fail silently to not interrupt user workflow
  }
}

export async function showBackupPrompt(): Promise<void> {
  const azureConfigured = isAzureConfigured();
  
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    const azureButtons = azureConfigured ? `
      <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">☁️ Azure Cloud Backup</h4>
        <div class="space-y-2">
          <button id="azure-backup" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            🌐 Save to Azure Cloud
          </button>
        </div>
      </div>
      <div class="mb-3">
        <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">📁 Local Backup</h4>
      </div>
    ` : '<h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">📁 Local Backup</h4>';

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">💾 Save Backup?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Would you like to save a backup of your data after this change?
        </p>
        
        <div class="space-y-3">
          ${azureButtons}
          <div class="space-y-2">
            <button id="backup-with-photos" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              📸 Full Backup (with photos)
            </button>
            <button id="backup-no-photos" class="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              ⚡ Quick Backup (no photos)
            </button>
          </div>
          <button id="backup-skip" class="w-full px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Skip for now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const azureBtn = modal.querySelector('#azure-backup') as HTMLButtonElement;
    const withPhotos = modal.querySelector('#backup-with-photos') as HTMLButtonElement;
    const noPhotos = modal.querySelector('#backup-no-photos') as HTMLButtonElement;
    const skip = modal.querySelector('#backup-skip') as HTMLButtonElement;

    const cleanup = () => {
      document.body.removeChild(modal);
      resolve();
    };

    // Azure backup handler
    if (azureBtn) {
      azureBtn.addEventListener('click', async () => {
        try {
          azureBtn.disabled = true;
          azureBtn.textContent = '☁️ Uploading...';
          
          const service = await getAzureService();
          if (!service) {
            throw new Error('Azure service not available');
          }
          
          const backupId = await service.createBackup();
          alert('✅ Azure backup saved successfully!\nBackup ID: ' + backupId.split('_backup_')[1].split('.json')[0]);
        } catch (error) {
          alert('❌ Azure backup failed: ' + (error as Error).message);
        }
        cleanup();
      });
    }

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