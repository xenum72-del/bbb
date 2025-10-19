/**
 * Client-side encryption utilities for backup data protection
 * Implements AES-256-GCM encryption for backup files when PIN is configured
 */

import { getSecuritySettings } from './security';

/**
 * Generate a cryptographic key from PIN + salt using PBKDF2
 */
async function deriveKeyFromPin(pin: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  // Import PIN as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES-256 key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt backup data using PIN-derived key
 */
export async function encryptBackupData(data: string, pin: string): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
  version: string;
}> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive encryption key from PIN
    const key = await deriveKeyFromPin(pin, salt.buffer);
    
    // Encrypt the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );
    
    // Convert to base64 for storage - use Array.from to avoid stack overflow with large data
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedData = btoa(Array.from(encryptedArray, (byte) => String.fromCharCode(byte)).join(''));
    const saltB64 = btoa(Array.from(salt, (byte) => String.fromCharCode(byte)).join(''));
    const ivB64 = btoa(Array.from(iv, (byte) => String.fromCharCode(byte)).join(''));
    
    return {
      encryptedData,
      salt: saltB64,
      iv: ivB64,
      version: '1.0'
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypt backup data using PIN-derived key
 */
export async function decryptBackupData(
  encryptedData: string,
  salt: string,
  iv: string,
  pin: string
): Promise<string> {
  try {
    // Convert from base64
    const encryptedArray = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    const saltArray = new Uint8Array(
      atob(salt).split('').map(char => char.charCodeAt(0))
    );
    const ivArray = new Uint8Array(
      atob(iv).split('').map(char => char.charCodeAt(0))
    );
    
    // Derive decryption key from PIN
    const key = await deriveKeyFromPin(pin, saltArray.buffer);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray
      },
      key,
      encryptedArray
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Check if backup should be encrypted based on security settings
 */
export function shouldEncryptBackup(): boolean {
  const settings = getSecuritySettings();
  return settings.hasPin && settings.encryptBackups;
}

/**
 * Wrap backup data with encryption metadata
 */
export interface EncryptedBackup {
  encrypted: boolean;
  version: string; 
  data?: string; // Plain data if not encrypted
  encryptedData?: string; // Encrypted data
  salt?: string; // Encryption salt
  iv?: string; // Encryption IV
  timestamp: string;
  metadata: {
    algorithm: string;
    keyDerivation: string;
    iterations: number;
  };
}

/**
 * Prepare backup data for export with optional encryption
 */
export async function prepareBackupForExport(
  backupData: any,
  pin?: string
): Promise<EncryptedBackup> {
  const timestamp = new Date().toISOString();
  
  // Safe JSON stringify to avoid circular references
  let dataJson: string;
  try {
    dataJson = JSON.stringify(backupData, null, 2);
  } catch (error) {
    // Handle circular references by using a replacer function
    const seen = new WeakSet();
    dataJson = JSON.stringify(backupData, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  }
  
  // Check if PIN is configured and provided
  const shouldEncrypt = shouldEncryptBackup() && pin;
  
  if (shouldEncrypt && pin) {
    const encrypted = await encryptBackupData(dataJson, pin);
    
    return {
      encrypted: true,
      version: '1.0',
      encryptedData: encrypted.encryptedData,
      salt: encrypted.salt,
      iv: encrypted.iv,
      timestamp,
      metadata: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
        iterations: 100000
      }
    };
  } else {
    return {
      encrypted: false,
      version: '1.0',
      data: dataJson,
      timestamp,
      metadata: {
        algorithm: 'none',
        keyDerivation: 'none',
        iterations: 0
      }
    };
  }
}

/**
 * Extract backup data from export with decryption if needed
 */
export async function extractBackupFromExport(
  exportData: EncryptedBackup,
  pin?: string
): Promise<any> {
  if (exportData.encrypted) {
    if (!pin) {
      throw new Error('PIN required to decrypt backup');
    }
    
    if (!exportData.encryptedData || !exportData.salt || !exportData.iv) {
      throw new Error('Invalid encrypted backup format');
    }
    
    const decryptedJson = await decryptBackupData(
      exportData.encryptedData,
      exportData.salt,
      exportData.iv,
      pin
    );
    
    return JSON.parse(decryptedJson);
  } else {
    if (!exportData.data) {
      throw new Error('Invalid backup format');
    }
    
    return JSON.parse(exportData.data);
  }
}

/**
 * Validate encrypted backup format
 */
export function isValidEncryptedBackup(data: any): data is EncryptedBackup {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.encrypted === 'boolean' &&
    typeof data.version === 'string' &&
    typeof data.timestamp === 'string' &&
    typeof data.metadata === 'object' &&
    (
      (!data.encrypted && typeof data.data === 'string') ||
      (data.encrypted && 
       typeof data.encryptedData === 'string' &&
       typeof data.salt === 'string' &&
       typeof data.iv === 'string')
    )
  );
}