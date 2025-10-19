import { useState, useEffect } from 'react';
import { 
  verifyPin, 
  activateSession, 
  setupPin, 
  getSecuritySettings, 
  isBiometricsSupported, 
  authenticateBiometrics 
} from '../utils/security';

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
        activateSession();
        onUnlocked();
      } else {
        // Verify existing PIN
        const isValid = await verifyPin(pin);
        if (isValid) {
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
          </div>

          {isSetupMode && (
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