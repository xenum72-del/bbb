import { db } from '../db/schema';
import { prepareBackupForExport, extractBackupFromExport, shouldEncryptBackup, type EncryptedBackup } from './encryption';
import { getPinForAutoBackups } from './pinManager';

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

export async function exportToFiles(includePhotos: boolean = true): Promise<void> {
  try {
    const backupData = await createBackup(includePhotos);
    
    // Check if we need to encrypt
    const needsEncryption = shouldEncryptBackup();
    let pin: string | null = null;
    
    if (needsEncryption) {
      // Get stored PIN (should be available since user unlocked the app)
      pin = await getPinForAutoBackups();
      
      if (!pin) {
        throw new Error('PIN not available. Please unlock the app first.');
      }
    }
    
    let finalData: EncryptedBackup | BackupData;
    let filename: string;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const sizeIndicator = includePhotos ? 'full' : 'no-photos';
    
    if (needsEncryption && pin) {
      // Create encrypted backup
      finalData = await prepareBackupForExport(backupData, pin);
      filename = `the-load-down-backup-${timestamp}-${sizeIndicator}-encrypted.json`;
    } else {
      // Create unencrypted backup - just the raw data
      finalData = backupData;
      filename = `the-load-down-backup-${timestamp}-${sizeIndicator}.json`;
    }
    
    const blob = new Blob([JSON.stringify(finalData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
}

export async function restoreFromBackup(backupData: any, pin?: string): Promise<void> {
  try {
    // Clear existing data (ask for confirmation first)
    if (!confirm('This will replace ALL existing data. Are you sure?')) {
      return;
    }

    let actualBackupData: BackupData;
    
    // Check if this is an encrypted backup
    if (typeof backupData === 'object' && backupData.encrypted === true) {
      if (!pin) {
        throw new Error('PIN required to decrypt backup');
      }
      actualBackupData = await extractBackupFromExport(backupData, pin);
    } else if (typeof backupData === 'object' && backupData.encrypted === false) {
      actualBackupData = await extractBackupFromExport(backupData);
    } else {
      // Legacy unencrypted backup format
      actualBackupData = backupData;
    }

    // Clear all tables
    await db.friends.clear();
    await db.encounters.clear();
    await db.interactionTypes.clear();
    await db.settings.clear();

    // Restore data
    if (actualBackupData.friends?.length > 0) {
      await db.friends.bulkAdd(actualBackupData.friends);
    }
    
    if (actualBackupData.encounters?.length > 0) {
      await db.encounters.bulkAdd(actualBackupData.encounters);
    }
    
    if (actualBackupData.interactionTypes?.length > 0) {
      await db.interactionTypes.bulkAdd(actualBackupData.interactionTypes);
    }
    
    if (actualBackupData.settings?.length > 0) {
      await db.settings.bulkAdd(actualBackupData.settings);
    }

    alert('Backup restored successfully!');
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new Error('Failed to restore backup: ' + (error as Error).message);
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
    
    // Check if encryption is needed and if we have a stored PIN
    const needsEncryption = shouldEncryptBackup();
    let uploadData: string;
    
    if (needsEncryption) {
      console.log('🔒 Auto-backup requires encryption, checking for stored PIN...');
      const storedPin = await getPinForAutoBackups();
      
      if (storedPin) {
        console.log('✅ Found stored PIN, creating encrypted auto-backup');
        const encryptedBackup = await prepareBackupForExport(backupData, storedPin);
        uploadData = JSON.stringify(encryptedBackup, null, 2);
      } else {
        console.log('❌ No stored PIN available, skipping auto-backup for security');
        console.log('💡 Manual backup through UI will prompt for PIN and can also store it for future auto-backups');
        return; // Skip auto-backup if encryption is required but no PIN is stored
      }
    } else {
      console.log('📝 No encryption required, creating plain auto-backup');
      uploadData = JSON.stringify(backupData, null, 2);
    }
    
    // Upload to Azure (async, non-blocking)
    await autoService.uploadBlob(backupId, uploadData);

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
  const needsEncryption = shouldEncryptBackup();
  
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    const encryptionNote = needsEncryption ? `
      <div class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p class="text-sm text-amber-800 dark:text-amber-200">
          🔒 PIN protection is enabled - backups will be encrypted
        </p>
      </div>
    ` : '';
    
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
        
        ${encryptionNote}
        
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

    // Helper function to get PIN if needed
    const getPinIfNeeded = (): string | null => {
      if (needsEncryption) {
        return prompt('Enter your PIN to encrypt the backup:');
      }
      return null; // No PIN needed
    };

    // Azure backup handler
    if (azureBtn) {
      azureBtn.addEventListener('click', async () => {
        try {
          azureBtn.disabled = true;
          azureBtn.textContent = '☁️ Uploading...';
          
          const pin = getPinIfNeeded();
          if (needsEncryption && !pin) {
            throw new Error('PIN required for encrypted backup');
          }
          
          const service = await getAzureService();
          if (!service) {
            throw new Error('Azure service not available');
          }
          
          const backupId = await service.createBackup(undefined, pin || undefined);
          const displayId = backupId.split('_backup_')[1].replace('.json', '').replace('_encrypted', '');
          alert('✅ Azure backup saved successfully!\nBackup ID: ' + displayId + (needsEncryption ? ' (encrypted)' : ''));
        } catch (error) {
          alert('❌ Azure backup failed: ' + (error as Error).message);
        }
        cleanup();
      });
    }

    withPhotos?.addEventListener('click', async () => {
      try {
        const pin = getPinIfNeeded();
        if (needsEncryption && !pin) {
          throw new Error('PIN required for encrypted backup');
        }
        
        await exportToFiles(true);
        alert('✅ Full backup saved to Files!' + (needsEncryption ? ' (encrypted)' : ''));
      } catch (error) {
        alert('❌ Backup failed: ' + (error as Error).message);
      }
      cleanup();
    });

    noPhotos?.addEventListener('click', async () => {
      try {
        await exportToFiles(false);
        alert('✅ Quick backup downloaded successfully!' + (needsEncryption ? ' (encrypted)' : ''));
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