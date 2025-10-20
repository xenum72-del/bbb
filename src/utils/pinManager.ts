/**
 * Secure in-memory PIN manager for auto-backups
 * Stores PIN encrypted in memory without expiration (will be cleared when app locks)
 */

class SecurePinManager {
  private encryptedPin: string | null = null;
  private sessionKey: Uint8Array;

  constructor() {
    // Generate a random session key that only exists in memory
    this.sessionKey = this.generateSessionKey();
    
    // Clear on page unload
    window.addEventListener('beforeunload', () => this.clearPin());
  }

  private generateSessionKey(): Uint8Array {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    return array;
  }

  private async encryptText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Use WebCrypto API for encryption
    const key = await crypto.subtle.importKey(
      'raw',
      this.sessionKey.slice(), // Create a copy to ensure correct type
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  private async decryptText(encryptedText: string): Promise<string> {
    const decoder = new TextDecoder();
    
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const key = await crypto.subtle.importKey(
      'raw',
      this.sessionKey.slice(), // Create a copy to ensure correct type
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  }

  /**
   * Store PIN securely in memory
   */
  async storePin(pin: string): Promise<void> {
    try {
      this.encryptedPin = await this.encryptText(pin);
      console.log('🔒 PIN stored securely in memory (will be cleared when app locks)');
    } catch (error) {
      console.error('Failed to store PIN securely:', error);
      throw new Error('Failed to store PIN securely');
    }
  }

  /**
   * Retrieve PIN from secure memory storage
   */
  async getPin(): Promise<string | null> {
    if (!this.encryptedPin) {
      return null;
    }
    
    try {
      return await this.decryptText(this.encryptedPin);
    } catch (error) {
      console.error('Failed to decrypt stored PIN:', error);
      this.clearPin();
      return null;
    }
  }

  /**
   * Check if PIN is available in memory
   */
  hasPin(): boolean {
    return this.encryptedPin !== null;
  }

  /**
   * Clear PIN from memory
   */
  clearPin(): void {
    this.encryptedPin = null;
    // Don't regenerate session key to avoid breaking ongoing operations
  }
}

// Global instance
const pinManager = new SecurePinManager();

export default pinManager;

/**
 * Store PIN for auto-backups with user consent
 */
export async function storePinForAutoBackups(pin: string): Promise<void> {
  await pinManager.storePin(pin);
}

/**
 * Get stored PIN for auto-backups
 */
export async function getPinForAutoBackups(): Promise<string | null> {
  return await pinManager.getPin();
}

/**
 * Check if PIN is available for auto-backups
 */
export function hasPinForAutoBackups(): boolean {
  return pinManager.hasPin();
}

/**
 * Clear stored PIN
 */
export function clearStoredPin(): void {
  pinManager.clearPin();
}