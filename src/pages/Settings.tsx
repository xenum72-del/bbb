import { useSettings, useInteractionTypes, settingsApi } from '../hooks/useDatabase';
import { useState, useEffect } from 'react';
import { db } from '../db/schema';
import { isiOS } from '../utils/iosBackup';
import {
  getSecuritySettings,
  saveSecuritySettings,
  setupPin,
  removePin,
  verifyPin,
  setupBiometrics,
  disableBiometrics,
  lockSession,
  setBackupEncryption
} from '../utils/security';
import { useAnalytics } from '../utils/analytics';
import AzureBackup from '../components/AzureBackup';
import InteractionTypeManager from '../components/InteractionTypeManager';
import { generateRealisticSampleData } from '../db/sampleData';

// Developer mode - activated by tapping Settings title 7 times within 3 seconds


interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const settings = useSettings();
  const interactionTypes = useInteractionTypes();
  
  const [localSettings, setLocalSettings] = useState({
    scoringWeights: {
      frequency: 0.35,
      recency: 0.25,
      quality: 0.30,
      mutuality: 0.10
    },
    defaultRating: 4,
    defaultTypeId: undefined as number | undefined,
    theme: 'system' as 'light' | 'dark' | 'system',
    notificationsEnabled: false,
    reminderFrequency: 'none' as 'daily' | 'weekly' | 'none',
    enableOnlineGeocoding: false
  });

  const [showExport, setShowExport] = useState(false);
  const [securitySettings, setSecuritySettings] = useState(() => getSecuritySettings());
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  
  // Analytics hook
  const { enable, disable, getStatus } = useAnalytics();
  const [analyticsStatus, setAnalyticsStatus] = useState(() => getStatus());
  
  // Azure Backup state
  const [showAzureBackup, setShowAzureBackup] = useState(false);
  
  // Interaction Type Manager state
  const [showTypeManager, setShowTypeManager] = useState(false);

  // Developer mode state
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<number | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // Developer mode activation function
  const handleTitleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Clear existing timeout
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    // Reset counter after 3 seconds
    const timeout = setTimeout(() => {
      setTapCount(0);
      setTapTimeout(null);
    }, 3000);
    setTapTimeout(timeout);

    // Activate developer mode after 7 taps
    if (newCount === 7) {
      setIsDeveloperMode(true);
      setTapCount(0);
      if (tapTimeout) clearTimeout(tapTimeout);
      setTapTimeout(null);
      
      // Show confirmation
      alert('🔧 Developer mode activated! Developer tools are now visible.');
    }
  };
  



  useEffect(() => {
    if (settings) {
      setLocalSettings({
        scoringWeights: settings.scoringWeights,
        defaultRating: settings.defaultRating,
        defaultTypeId: settings.defaultTypeId,
        theme: settings.theme,
        notificationsEnabled: settings.notificationsEnabled,
        reminderFrequency: settings.reminderFrequency,
        enableOnlineGeocoding: settings.enableOnlineGeocoding ?? false
      });
    }
  }, [settings]);

  // Refresh security settings
  useEffect(() => {
    setSecuritySettings(getSecuritySettings());
  }, []);

  // Security functions
  const handlePinSetup = async () => {
    if (newPin !== confirmPin) {
      alert('PINs do not match');
      return;
    }
    if (newPin.length < 4) {
      alert('PIN must be at least 4 digits');
      return;
    }
    
    try {
      await setupPin(newPin);
      
      // Automatically enable backup encryption when PIN is set
      setBackupEncryption(true);
      
      setSecuritySettings(getSecuritySettings());
      setShowPinSetup(false);
      setNewPin('');
      setConfirmPin('');
      alert('PIN set successfully! Backup encryption has been automatically enabled.');
    } catch (error) {
      alert('Error setting PIN: ' + (error as Error).message);
    }
  };

  const handlePinRemove = async () => {
    if (!currentPin) {
      alert('Please enter your current PIN');
      return;
    }
    
    try {
      // Verify current PIN first
      const isValid = await verifyPin(currentPin);
      if (!isValid) {
        alert('Incorrect PIN');
        return;
      }
      
      removePin();
      setSecuritySettings(getSecuritySettings());
      setCurrentPin('');
      alert('PIN removed successfully');
    } catch (error) {
      alert('Error removing PIN: ' + (error as Error).message);
    }
  };

  const handleBiometricsToggle = async () => {
    try {
      if (securitySettings.biometricsEnabled) {
        await disableBiometrics();
      } else {
        await setupBiometrics();
      }
      setSecuritySettings(getSecuritySettings());
    } catch (error) {
      alert('Error with biometrics: ' + (error as Error).message);
    }
  };

  const handleAutoLockChange = (minutes: number) => {
    const updated = { ...securitySettings, autoLockMinutes: minutes };
    saveSecuritySettings(updated);
    setSecuritySettings(updated);
  };

  const handleBackupEncryptionToggle = () => {
    const newValue = !securitySettings.encryptBackups;
    setBackupEncryption(newValue);
    setSecuritySettings(getSecuritySettings());
  };

  // Analytics functions
  const handleAnalyticsToggle = () => {
    if (analyticsStatus.enabled) {
      disable();
    } else {
      enable();
    }
    setAnalyticsStatus(getStatus());
  };



  const handleSaveSettings = async () => {
    try {
      await settingsApi.update(localSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };



  const handleExportData = async () => {
    try {
      const { exportToFiles } = await import('../utils/backup');
      await exportToFiles(true); // true = include photos
      setShowExport(false);
      alert('✅ Data exported to Files app!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data: ' + (error as Error).message);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Support both old format (with .data) and new format (direct)
        const backupData = importData.data || importData;
        
        // Validate backup format - check for required fields
        if (!backupData.friends && !backupData.encounters && !backupData.interactionTypes) {
          alert('Invalid backup file format. Expected friends, encounters, or interactionTypes data.');
          return;
        }

        // Ask user if they want to merge or replace
        const replace = confirm(
          'Do you want to REPLACE all existing data? Click OK to replace, Cancel to merge with existing data.'
        );

        if (replace) {
          // Clear existing data first
          await db.transaction('rw', [db.friends, db.encounters, db.interactionTypes, db.settings], async () => {
            await db.friends.clear();
            await db.encounters.clear();
            await db.interactionTypes.clear();
            await db.settings.clear();
          });
        }

        // Import data
        if (backupData.friends && backupData.friends.length > 0) {
          await db.friends.bulkAdd(backupData.friends.map((f: Record<string, any>) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            updatedAt: f.updatedAt ? new Date(f.updatedAt) : undefined,
            lastTested: f.lastTested ? new Date(f.lastTested) : undefined
          })));
        }

        if (backupData.encounters && backupData.encounters.length > 0) {
          await db.encounters.bulkAdd(backupData.encounters.map((e: Record<string, any>) => ({
            ...e,
            date: new Date(e.date),
            createdAt: new Date(e.createdAt),
            updatedAt: e.updatedAt ? new Date(e.updatedAt) : undefined
          })));
        }

        if (backupData.interactionTypes && backupData.interactionTypes.length > 0) {
          await db.interactionTypes.bulkAdd(backupData.interactionTypes);
        }

        if (backupData.settings && backupData.settings.length > 0) {
          await db.settings.bulkAdd(backupData.settings.map((s: Record<string, any>) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined
          })));
        }

        alert('Data imported successfully! Refresh the page to see changes.');
        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Failed to import data. Make sure the file is a valid backup.');
      }
    };
    input.click();
  };



  const handleClearData = async () => {
    if (!confirm('This will permanently delete ALL your data. This cannot be undone. Are you sure?')) {
      return;
    }
    
    if (!confirm('Last chance! This will delete everything: friends, encounters, settings. Continue?')) {
      return;
    }

    try {
      await db.delete();
      await db.open();
      alert('All data cleared successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data');
    }
  };

  const totalWeight = Object.values(localSettings.scoringWeights).reduce((a, b) => a + b, 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  return (
    <div className="p-4 space-y-4 min-h-screen relative">
      <div className="space-y-6 relative z-10">
        <div className="flex items-center mb-8 p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
          <div className="ml-6" onClick={handleTitleTap} style={{ cursor: 'default', userSelect: 'none' }}>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
              Settings
              {tapCount > 0 && tapCount < 7 && (
                <span className="text-xs ml-2 opacity-50">({tapCount}/7)</span>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-1">
              Customize your experience
              {isDeveloperMode && <span className="text-xs ml-2 text-orange-500">🔧 Dev Mode</span>}
            </p>
          </div>
        </div>

        {/* Friend Scoring Algorithm */}
        <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
                Friend Scoring Algorithm
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Adjust how friend rankings are calculated</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-4">
            {Object.entries(localSettings.scoringWeights).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-300">{key}</label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={value}
                    onChange={(e) => setLocalSettings(s => ({
                      ...s,
                      scoringWeights: {
                        ...s.scoringWeights,
                        [key]: parseFloat(e.target.value)
                      }
                    }))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${value * 100}%, #E5E7EB ${value * 100}%, #E5E7EB 100%)`,
                    }}
                  />
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg pointer-events-none transition-all duration-200"
                    style={{ left: `calc(${value * 100}% - 10px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>

          <div className={`text-sm p-3 rounded-lg ${
            isWeightValid 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            Total: {(totalWeight * 100).toFixed(0)}% {!isWeightValid && '(Must equal 100%)'}
          </div>
        </div>

        {/* Interaction Types */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  Interaction Types
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage activity categories</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowTypeManager(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Manage Types
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {interactionTypes.map(type => (
              <div key={type.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm flex-1 truncate">{type.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 via-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl drop-shadow-sm">🔒</span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
                Security & Privacy
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Protect your intimate data with PIN or biometrics</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* PIN Section */}
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">PIN Protection</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {securitySettings.hasPin 
                      ? 'PIN is enabled - encrypts all backups automatically' 
                      : 'Secure app & encrypt backups with PIN'
                    }
                  </p>
                </div>
                <div className="flex space-x-2">
                  {securitySettings.hasPin ? (
                    <button
                      onClick={() => {
                        const pin = prompt('Enter current PIN to remove:');
                        if (pin) {
                          setCurrentPin(pin);
                          handlePinRemove();
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPinSetup(!showPinSetup)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Set PIN
                    </button>
                  )}
                </div>
              </div>

              {showPinSetup && (
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                  <input
                    type="password"
                    placeholder="Enter 4+ digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-inner hover:shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
                  <input
                    type="password"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-inner hover:shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
                  
                  {/* Encryption Warning */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 shadow-lg">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-600 dark:text-blue-400 text-2xl">🔐</div>
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
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePinSetup}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-300"
                    >
                      Save PIN
                    </button>
                    <button
                      onClick={() => {
                        setShowPinSetup(false);
                        setNewPin('');
                        setConfirmPin('');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium shadow-lg hover:from-gray-600 hover:to-gray-700 hover:scale-105 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Biometrics Section */}
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Biometric Authentication</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use Face ID, Touch ID, or fingerprint
                  </p>
                </div>
                <button
                  onClick={handleBiometricsToggle}
                  className={`px-6 py-3 text-sm font-medium rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                    securitySettings.biometricsEnabled
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 hover:from-gray-400 hover:to-gray-500 dark:from-gray-600 dark:to-gray-700 dark:text-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-600 shadow-gray-400/30'
                  }`}
                >
                  {securitySettings.biometricsEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Auto-lock Section */}
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div>
                <h4 className="font-medium mb-3">Auto-lock Timer</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Lock app after: {securitySettings.autoLockMinutes} minutes
                </p>
                <select
                  value={securitySettings.autoLockMinutes}
                  onChange={(e) => handleAutoLockChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-inner hover:shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                >
                  <option value={1}>1 minute</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>

            {/* Backup Encryption Section */}
            {securitySettings.hasPin && (
              <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Encrypt Backups</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {securitySettings.encryptBackups 
                        ? 'Backups will be encrypted with your PIN' 
                        : 'Backups will be saved as plain text (not recommended)'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleBackupEncryptionToggle}
                    className={`px-6 py-3 text-sm font-medium rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                      securitySettings.encryptBackups
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-red-500/30'
                    }`}
                  >
                    {securitySettings.encryptBackups ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            )}

            {/* Lock Now Button */}
            {securitySettings.hasPin || securitySettings.biometricsEnabled ? (
              <button
                onClick={() => {
                  lockSession();
                  window.location.reload(); // Force re-authentication
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                🔒 Lock App Now
              </button>
            ) : null}
          </div>
        </div>

        {/* Analytics Settings */}
        <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
                Anonymous Usage Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Help improve the app with completely anonymous data</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Analytics Toggle */}
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Enable Anonymous Analytics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analyticsStatus.enabled ? 'Sharing anonymous usage data' : 'No data collection (default)'}
                  </p>
                </div>
                <button
                  onClick={handleAnalyticsToggle}
                  className={`px-6 py-3 text-sm font-medium rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                    analyticsStatus.enabled
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 hover:from-gray-400 hover:to-gray-500 dark:from-gray-600 dark:to-gray-700 dark:text-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-600 shadow-gray-400/30'
                  }`}
                >
                  {analyticsStatus.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              
              {analyticsStatus.enabled && (
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-3">
                  <p className="mb-1">📊 Anonymous ID: {analyticsStatus.anonymousId.substring(0, 16)}...</p>
                  <p className="mb-1">📈 Events queued: {analyticsStatus.eventsQueued}</p>
                </div>
              )}
            </div>

            {/* What We Collect */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📋 What We Collect (If Enabled)</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>✅ Anonymous app interactions (button clicks, page views)</p>
                <p>✅ General location (city/state level only)</p>
                <p>✅ Feature usage patterns and error rates</p>
                <p>✅ Performance metrics and app version</p>
                <p className="font-medium text-green-700 dark:text-green-300 mt-2">❌ NO personal data, names, or encounter details</p>
                <p className="font-medium text-green-700 dark:text-green-300">❌ NO precise location or device identification</p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🛡️ Privacy Guarantee</h4>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p>• All analytics are completely anonymous and cannot be traced back to you</p>
                <p>• Your encounter data, friends list, and personal info are NEVER shared</p>
                <p>• You can disable this anytime with zero impact on app functionality</p>
                <p>• Data helps us improve features but your privacy comes first, always</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Search Settings */}
        <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-green-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
                Location Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Enable online location search and suggestions</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Location Search Toggle */}
            <div className="p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-600/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Enable Online Location Search</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {localSettings.enableOnlineGeocoding ? 'Location suggestions enabled' : 'Manual location entry only (default)'}
                  </p>
                </div>
                <button
                  onClick={() => setLocalSettings(s => ({...s, enableOnlineGeocoding: !s.enableOnlineGeocoding}))}
                  className={`px-6 py-3 text-sm font-medium rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                    localSettings.enableOnlineGeocoding
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 hover:from-gray-400 hover:to-gray-500 dark:from-gray-600 dark:to-gray-700 dark:text-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-600 shadow-gray-400/30'
                  }`}
                >
                  {localSettings.enableOnlineGeocoding ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {/* What Happens When Enabled */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🌍 When Enabled</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>✅ Auto-complete location suggestions as you type</p>
                <p>✅ Search for places, addresses, and landmarks</p>
                <p>✅ Reverse geocoding for "Use current location" button</p>
                <p>✅ Uses OpenStreetMap Nominatim service (free)</p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">🔒 Privacy & Usage Information</h4>
              <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <p>• Location searches are sent to OpenStreetMap's servers</p>
                <p>• No personal data is transmitted with location queries</p>
                <p>• Search queries are not stored or associated with your account</p>
                <p>• Disabled by default to maximize privacy</p>
                <p>• Search is rate-limited to prevent service overload</p>
                <p>• Global search enabled (not restricted to specific countries)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">
                Data Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Backup and manage your data</p>
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <button
              onClick={() => onNavigate('help')}
              className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">Help & Guide</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Complete user manual and app documentation</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleExportData}
              className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {isiOS() ? 'Share Data' : 'Export Data'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isiOS() ? 'iOS-optimized sharing options' : 'Download all your data as JSON'}
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={handleImportData}
              className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">Import Data</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Restore from JSON backup file</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowAzureBackup(true)}
              className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">Azure Backup & Restore</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Backup to Microsoft Azure with date selection</div>
                </div>
              </div>
            </button>

            {/* Developer-only features */}
            {isDeveloperMode && (
              <>
                <button
                  onClick={async () => {
                    if (confirm('This will replace all current data with 221 realistic sample encounters and 65 friends. Are you sure?')) {
                      try {
                        await generateRealisticSampleData();
                        alert('✅ Successfully generated 221 realistic encounters and 65 friends!\n\n📍 Locations: Central/Eastern Europe, India, Los Angeles\n⏱️ Duration: 15-90 minutes\n💰 Very few paid (mostly massage)\n⭐ Average rating: >4 stars\n🎯 All activities match proper IDs');
                        window.location.reload(); // Refresh to show new data
                      } catch (error) {
                        console.error('Sample data generation failed:', error);
                        alert('❌ Failed to generate sample data. Check console for details.');
                      }
                    }
                  }}
                  className="w-full p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">🔧 Generate Sample Data</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">221 realistic encounters + 65 friends (developer only)</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('tests')}
                  className="w-full p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">🔧 Run Data Tests</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Comprehensive data integrity validation (developer only)</div>
                    </div>
                  </div>
                </button>
              </>
            )}

            <button
              onClick={handleClearData}
              className="w-full p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-red-700 dark:text-red-400">Clear All Data</div>
                  <div className="text-sm text-red-600 dark:text-red-500">Permanently delete everything</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSaveSettings}
            disabled={!isWeightValid}
            className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-xl transform transition-all duration-200 ${
              isWeightValid
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-[1.02] hover:shadow-2xl'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isWeightValid ? 'Save Settings' : 'Fix Weights First (must total 100%)'}
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl border border-white/20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-white text-2xl">📤</span>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2">Export Your Data</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Download all your encounters, friends, and settings as a JSON file. 
                  Save this file to iCloud Drive via Files app for backup.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportData}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Export to Downloads
                </button>
                
                <button
                  onClick={() => setShowExport(false)}
                  className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Azure Backup Modal */}
      <AzureBackup
        isOpen={showAzureBackup}
        onClose={() => setShowAzureBackup(false)}
      />

      {/* Interaction Type Manager Modal */}
      <InteractionTypeManager
        isOpen={showTypeManager}
        onClose={() => setShowTypeManager(false)}
      />
    </div>
  );
}