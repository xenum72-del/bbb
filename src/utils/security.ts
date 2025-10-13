/**
 * Simple client-side security utilities for app protection
 * This provides basic protection against casual access, not sophisticated attacks
 */

const SECURITY_STORAGE_KEY = 'encounter_security_settings';
const SESSION_KEY = 'encounter_session_active';

export interface SecuritySettings {
  hasPin: boolean;
  pinHash?: string;
  biometricsEnabled: boolean;
  autoLockMinutes: number;
  lastActivity: number;
}

/**
 * Simple hash function for PIN storage
 * Note: This is basic obfuscation, not cryptographic security
 */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'encounter_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get current security settings
 */
export function getSecuritySettings(): SecuritySettings {
  const stored = localStorage.getItem(SECURITY_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // If parsing fails, return defaults
    }
  }
  
  return {
    hasPin: false,
    biometricsEnabled: false,
    autoLockMinutes: 15,
    lastActivity: Date.now()
  };
}

/**
 * Save security settings
 */
export function saveSecuritySettings(settings: SecuritySettings): void {
  localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Set up a new PIN
 */
export async function setupPin(pin: string): Promise<void> {
  const settings = getSecuritySettings();
  settings.hasPin = true;
  settings.pinHash = await hashPin(pin);
  saveSecuritySettings(settings);
}

/**
 * Verify PIN against stored hash
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const settings = getSecuritySettings();
  if (!settings.hasPin || !settings.pinHash) {
    return true; // No PIN set, allow access
  }
  
  const inputHash = await hashPin(pin);
  return inputHash === settings.pinHash;
}

/**
 * Remove PIN protection
 */
export function removePin(): void {
  const settings = getSecuritySettings();
  settings.hasPin = false;
  settings.pinHash = undefined;
  saveSecuritySettings(settings);
}

/**
 * Check if app is currently unlocked in this session
 */
export function isSessionActive(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

/**
 * Mark session as active (unlocked)
 */
export function activateSession(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
  updateLastActivity();
}

/**
 * Lock the session
 */
export function lockSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  const settings = getSecuritySettings();
  settings.lastActivity = Date.now();
  saveSecuritySettings(settings);
}

/**
 * Check if session should auto-lock due to inactivity
 */
export function shouldAutoLock(): boolean {
  const settings = getSecuritySettings();
  if (!settings.hasPin || settings.autoLockMinutes === 0) {
    return false; // No PIN or auto-lock disabled
  }
  
  const inactiveMinutes = (Date.now() - settings.lastActivity) / (1000 * 60);
  return inactiveMinutes >= settings.autoLockMinutes;
}

/**
 * Check if biometrics are supported in this browser
 */
export function isBiometricsSupported(): boolean {
  return 'credentials' in navigator && 'create' in navigator.credentials;
}

/**
 * Set up biometric authentication (WebAuthn)
 */
export async function setupBiometrics(): Promise<boolean> {
  if (!isBiometricsSupported()) {
    return false;
  }
  
  try {
    // Create a simple WebAuthn credential for app unlock
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "Encounter Ledger",
          id: window.location.hostname
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "user",
          displayName: "App User"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "none"
      }
    });
    
    if (credential) {
      const settings = getSecuritySettings();
      settings.biometricsEnabled = true;
      saveSecuritySettings(settings);
      return true;
    }
  } catch (error) {
    console.warn('Biometrics setup failed:', error);
  }
  
  return false;
}

/**
 * Authenticate using biometrics
 */
export async function authenticateBiometrics(): Promise<boolean> {
  if (!isBiometricsSupported()) {
    return false;
  }
  
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: "required"
      }
    });
    
    return assertion !== null;
  } catch (error) {
    console.warn('Biometric authentication failed:', error);
    return false;
  }
}

/**
 * Disable biometric authentication
 */
export function disableBiometrics(): void {
  const settings = getSecuritySettings();
  settings.biometricsEnabled = false;
  saveSecuritySettings(settings);
}

/**
 * Check if app requires unlock (has PIN and session not active)
 */
export function requiresUnlock(): boolean {
  const settings = getSecuritySettings();
  
  // No security set up
  if (!settings.hasPin) {
    return false;
  }
  
  // Session is active and not auto-locked
  if (isSessionActive() && !shouldAutoLock()) {
    return false;
  }
  
  // Requires unlock
  return true;
}