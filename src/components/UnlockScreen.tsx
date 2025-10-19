import { useState, useEffect } from 'react';
import { 
  verifyPin, 
  activateSession, 
  setupPin, 
  getSecuritySettings, 
  isBiometricsSupported, 
  authenticateBiometrics 
} from '../utils/security';
import { storePinForAutoBackups } from '../utils/pinManager';

interface UnlockScreenProps {
  onUnlocked: () => void;
}

export default function UnlockScreen({ onUnlocked }: UnlockScreenProps) {
  const [pin, setPin] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    const settings = getSecuritySettings();
    setIsSetupMode(!settings.hasPin);
    setBiometricsAvailable(isBiometricsSupported() && settings.biometricsEnabled);
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSetupMode) {
        // Setup new PIN
        if (pin.length < 4) {
          setError('PIN must be at least 4 digits');
          return;
        }
        
        if (pin !== confirmPin) {
          setError('PINs do not match');
          return;
        }

        await setupPin(pin);
        
        // Store PIN for backups when successfully set up
        try {
          await storePinForAutoBackups(pin);
          console.log('🔒 PIN stored for backup use');
        } catch (error) {
          console.warn('Failed to store PIN for backups:', error);
        }
        
        activateSession();
        onUnlocked();
      } else {
        // Verify existing PIN
        const isValid = await verifyPin(pin);
        if (isValid) {
          // Store PIN for backups when successfully unlocked
          try {
            await storePinForAutoBackups(pin);
            console.log('🔒 PIN stored for backup use');
          } catch (error) {
            console.warn('Failed to store PIN for backups:', error);
          }
          
          activateSession();
          onUnlocked();
        } else {
          setError('Incorrect PIN');
          setPin('');
        }
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const success = await authenticateBiometrics();
      if (success) {
        activateSession();
        onUnlocked();
      } else {
        setError('Biometric authentication failed');
      }
    } catch {
      setError('Biometric authentication not available');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(numericValue);
    setError('');
  };

  const handleConfirmPinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setConfirmPin(numericValue);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isSetupMode ? 'Secure Your App' : 'Enter PIN'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {isSetupMode 
              ? 'Set up a PIN to protect your privacy' 
              : 'Enter your PIN to access your legendary sex life'
            }
          </p>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isSetupMode ? 'Create PIN (4-6 digits)' : 'Enter PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={isSetupMode ? '••••' : '••••'}
              autoFocus
              disabled={loading}
            />
            {!isSetupMode && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                🔒 This PIN encrypts all your backups automatically
              </p>
            )}
            {isSetupMode && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center font-medium">
                🔒 This PIN will encrypt all your backups automatically
              </p>
            )}
          </div>

          {isSetupMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={confirmPin}
                  onChange={(e) => handleConfirmPinChange(e.target.value)}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="••••"
                  disabled={loading}
                />
              </div>
              
              {/* Encryption Notice - Early and Prominent */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 dark:text-blue-400 text-2xl">�</div>
                  <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-base mb-2">
                      🚨 Important: Backup Encryption
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                      <strong>This PIN will automatically encrypt ALL your backups!</strong><br/>
                      • Manual file downloads → Encrypted<br/>
                      • Azure cloud backups → Encrypted<br/>
                      • Automatic backups → Encrypted<br/><br/>
                      <span className="text-blue-700 dark:text-blue-300">
                        Choose a PIN you'll remember - you'll need it to restore any backup.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4 || (isSetupMode && confirmPin.length < 4)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{isSetupMode ? 'Setting up...' : 'Verifying...'}</span>
              </div>
            ) : (
              isSetupMode ? 'Secure App 🔒' : 'Unlock App 🔓'
            )}
          </button>

          {biometricsAvailable && !isSetupMode && (
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={loading}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Use Fingerprint/Face ID 👆
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isSetupMode 
              ? 'Your PIN is stored securely on your device only' 
              : 'Privacy protected • Data stays local'
            }
          </p>
        </div>
      </div>
    </div>
  );
}