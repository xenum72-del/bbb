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
    
    // Validate SAS token format
    this.validateConfig();
  }
  
  private getSasTokenForUrl(): string {
    // Remove leading ? if present since we'll add it in URL construction
    return this.config.sasToken.startsWith('?') ? this.config.sasToken.substring(1) : this.config.sasToken;
  }
  
  private validateConfig(): void {
    if (!this.config.sasToken) {
      throw new Error('SAS token is required');
    }
    
    // Just do basic format validation - check if it looks like a query string
    const hasEqualsSign = this.config.sasToken.includes('=');
    
    if (!hasEqualsSign) {
      throw new Error('SAS token format appears invalid. Should contain key=value pairs.');
    }
    
    // Check if SAS token starts with ? (if not, add it)
    if (!this.config.sasToken.startsWith('?')) {
      this.config.sasToken = '?' + this.config.sasToken;
    }
  }

  /**
   * Test connection to Azure Blob Storage
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test blob storage connection by trying to list blobs in the specific container
      // This requires less permissions than listing all containers
      const url = `${this.blobBaseUrl}/${this.config.containerName}?restype=container&comp=list&${this.getSasTokenForUrl()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-ms-version': '2020-04-08'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure connection test failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url.replace(this.config.sasToken, '[SAS_TOKEN_HIDDEN]'),
          error: errorText
        });
        
        // Throw specific error for better user feedback
        if (response.status === 404) {
          throw new Error(`Container '${this.config.containerName}' not found. Create it in Azure Portal first.`);
        } else if (response.status === 403) {
          throw new Error('SAS token lacks required permissions. Generate new token with read/write/list permissions.');
        } else if (response.status === 401) {
          throw new Error('SAS token is invalid or expired. Generate a new token.');
        } else {
          throw new Error(`Azure error ${response.status}: ${errorText}`);
        }
      }
      
      console.log('Azure connection test successful');
      return true;
    } catch (error) {
      console.error('Azure connection test failed:', error);
      throw error; // Re-throw to show specific error message
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
  /**
   * List blobs in the container, optionally filtered by prefix
   */
  async listBlobs(prefix?: string): Promise<string[]> {
    try {
      let url = `${this.blobBaseUrl}/${this.config.containerName}?restype=container&comp=list&${this.getSasTokenForUrl()}`;
      if (prefix) {
        url += `&prefix=${encodeURIComponent(prefix)}`;
      }

      console.log('🔍 listBlobs URL:', url.substring(0, 150) + '...');
      console.log('🔍 listBlobs prefix:', prefix);

      const response = await fetch(url, {
        method: 'GET'
      });

      console.log('📊 listBlobs response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to list blobs: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('📄 listBlobs XML response (first 500 chars):', xmlText.substring(0, 500));

      // Parse XML response to extract blob names
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const blobs = xmlDoc.querySelectorAll('Blob > Name');
      console.log('🔍 Found blob Name elements:', blobs.length);
      
      const blobNames: string[] = [];
      
      blobs.forEach((blob, index) => {
        const name = blob.textContent;
        console.log(`📁 Blob ${index + 1}:`, name);
        if (name) {
          blobNames.push(name);
        }
      });

      console.log('✅ Final listBlobs result:', blobNames);
      return blobNames;
    } catch (error) {
      console.error('❌ listBlobs error:', error);
      return [];
    }
  }

  /**
   * List all backups (legacy method for compatibility)
   */
  async listBackups(): Promise<string[]> {
    return this.listBlobs();
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
    const url = `${this.blobBaseUrl}/${this.config.containerName}/${blobName}?${this.getSasTokenForUrl()}`;

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
    const url = `${this.blobBaseUrl}/${this.config.containerName}/${blobName}?${this.getSasTokenForUrl()}`;

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    return await response.text();
  }

  private async deleteBlob(blobName: string): Promise<void> {
    const url = `${this.blobBaseUrl}/${this.config.containerName}/${blobName}?${this.getSasTokenForUrl()}`;

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