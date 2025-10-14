import { db } from '../db/schema';

export interface AzureConfig {
  storageAccount: string;
  storageKey: string;
  containerName: string;
  tableName: string;
  sasToken: string;
  enabled: boolean;
  // Auto backup settings
  autoBackupEnabled?: boolean;
  autoBackupContainer?: string;
  autoBackupRetention?: number;
}

export interface BackupMetadata {
  backupId: string;
  timestamp: string;
  friendsCount: number;
  encountersCount: number;
  interactionTypesCount: number;
  settingsCount: number;
  appVersion: string;
  deviceInfo?: string;
  size?: number; // File size in bytes
}

export interface AzureEntity {
  PartitionKey: string;
  RowKey: string;
  Timestamp?: string;
  [key: string]: any;
}

export interface MigrationProgress {
  phase: 'preparing' | 'friends' | 'encounters' | 'photos' | 'settings' | 'cleanup' | 'complete' | 'error' | 'backup' | 'restore';
  current: number;
  total: number;
  message: string;
}

export class AzureStorageService {
  private config: AzureConfig;
  private blobBaseUrl: string;
  private userId: string;

  constructor(config: AzureConfig, userId: string) {
    this.config = config;
    this.userId = userId;
    this.blobBaseUrl = `https://${config.storageAccount}.blob.core.windows.net`;
  }

  /**
   * Test connection to Azure Blob Storage
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test blob storage connection by listing containers
      const url = `${this.blobBaseUrl}?comp=list&${this.config.sasToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-ms-version': '2020-04-08'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Azure connection test failed:', error);
      return false;
    }
  }

  /**
   * Initialize storage (no-op since container is created manually)
   */
  async initializeStorage(): Promise<void> {
    // Container should be created manually in Azure Portal
    // No table storage needed - we store everything in blobs
  }

  /**
   * Create a backup of all user data
   */
  async createBackup(onProgress?: (progress: MigrationProgress) => void): Promise<string> {
    try {
      onProgress?.({ phase: 'backup', current: 0, total: 100, message: 'Starting backup...' });
      
      // Get all data from IndexedDB
      const friends = await db.friends.toArray();
      const encounters = await db.encounters.toArray();
      const interactionTypes = await db.interactionTypes.toArray();
      const settings = await db.settings.toArray();

      onProgress?.({ phase: 'backup', current: 50, total: 100, message: 'Preparing backup data...' });

      const timestamp = Date.now();
      const backupId = `${this.userId}_backup_${timestamp}.json`;
      
      const metadata: BackupMetadata = {
        backupId,
        timestamp: new Date(timestamp).toISOString(),
        friendsCount: friends.length,
        encountersCount: encounters.length,
        interactionTypesCount: interactionTypes.length,
        settingsCount: settings.length,
        appVersion: '1.0.0',
        deviceInfo: navigator.userAgent
      };

      const backupData = {
        metadata,
        friends,
        encounters,
        interactionTypes,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      // Upload to Azure Blob Storage
      await this.uploadBlob(backupId, JSON.stringify(backupData, null, 2));

      onProgress?.({ phase: 'backup', current: 100, total: 100, message: 'Backup completed!' });

      return backupId;
    } catch (error) {
      throw new Error(`Backup failed: ${(error as Error).message}`);
    }
  }

  /**
   * List all backups by scanning blob storage
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const url = `${this.blobBaseUrl}/${this.config.containerName}?restype=container&comp=list&prefix=${this.userId}_backup_&${this.config.sasToken}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-ms-version': '2020-04-08'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list backups: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      
      const blobs = doc.querySelectorAll('Blob');
      const backups: BackupMetadata[] = [];
      
      for (const blob of blobs) {
        const nameElement = blob.querySelector('Name');
        const sizeElement = blob.querySelector('Properties Content-Length');
        
        if (nameElement) {
          const blobName = nameElement.textContent || '';
          // Extract timestamp from blob name: userId_backup_timestamp.json
          const match = blobName.match(/_backup_(\d+)\.json$/);
          if (match) {
            const timestamp = parseInt(match[1]);
            const sizeBytes = sizeElement ? parseInt(sizeElement.textContent || '0') : 0;
            
            backups.push({
              backupId: blobName,
              timestamp: new Date(timestamp).toISOString(),
              friendsCount: 0, // We don't know this without downloading
              encountersCount: 0,
              interactionTypesCount: 0,
              settingsCount: 0,
              appVersion: 'unknown',
              size: sizeBytes
            });
          }
        }
      }
      
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreFromBackup(
    backupId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    try {
      onProgress?.({ phase: 'restore', current: 0, total: 100, message: 'Downloading backup...' });
      
      // Download backup data
      const backupJson = await this.downloadBlob(backupId);
      const backupData = JSON.parse(backupJson);

      onProgress?.({ phase: 'restore', current: 25, total: 100, message: 'Clearing existing data...' });
      
      // Clear existing data
      await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes, db.settings], async () => {
        await db.friends.clear();
        await db.encounters.clear();
        await db.interactionTypes.clear();
        await db.settings.clear();
      });

      onProgress?.({ phase: 'restore', current: 50, total: 100, message: 'Restoring data...' });

      // Restore data
      await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes, db.settings], async () => {
        if (backupData.friends?.length) {
          await db.friends.bulkAdd(backupData.friends);
        }
        if (backupData.encounters?.length) {
          await db.encounters.bulkAdd(backupData.encounters);
        }
        if (backupData.interactionTypes?.length) {
          await db.interactionTypes.bulkAdd(backupData.interactionTypes);
        }
        if (backupData.settings?.length) {
          await db.settings.bulkAdd(backupData.settings);
        }
      });

      onProgress?.({ phase: 'restore', current: 100, total: 100, message: 'Restore completed!' });
    } catch (error) {
      throw new Error(`Restore failed: ${(error as Error).message}`);
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      await this.deleteBlob(backupId);
    } catch (error) {
      throw new Error(`Delete backup failed: ${(error as Error).message}`);
    }
  }

  // Blob Storage operations
  async uploadBlob(blobName: string, content: string): Promise<void> {
    const url = `${this.blobBaseUrl}/${this.config.containerName}/${blobName}?${this.config.sasToken}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/json'
      },
      body: content
    });

    if (!response.ok) {
      throw new Error(`Failed to upload blob: ${response.statusText}`);
    }
  }

  private async downloadBlob(blobName: string): Promise<string> {
    const url = `${this.blobBaseUrl}/${this.config.containerName}/${blobName}?${this.config.sasToken}`;

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    return await response.text();
  }

  private async deleteBlob(blobName: string): Promise<void> {
    const url = `${this.blobBaseUrl}/${this.config.containerName}/${blobName}?${this.config.sasToken}`;

    const response = await fetch(url, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete blob: ${response.statusText}`);
    }
  }
}

/**
 * Generate anonymous user ID for Azure partitioning
 */
export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 16);
}

/**
 * Validate Azure configuration
 */
export function validateAzureConfig(config: Partial<AzureConfig>): string[] {
  const errors: string[] = [];

  if (!config.storageAccount) {
    errors.push('Storage Account name is required');
  }

  if (!config.sasToken) {
    errors.push('SAS Token is required');
  }

  if (!config.containerName) {
    errors.push('Container name is required');
  }

  if (config.storageAccount && !/^[a-z0-9]{3,24}$/.test(config.storageAccount)) {
    errors.push('Storage Account name must be 3-24 characters, lowercase letters and numbers only');
  }

  if (config.containerName && !/^[a-z0-9-]{3,63}$/.test(config.containerName)) {
    errors.push('Container name must be 3-63 characters, lowercase letters, numbers, and hyphens only');
  }

  return errors;
}