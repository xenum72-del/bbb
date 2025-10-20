import { useState, useEffect } from 'react';
import { AzureStorageService, type AzureConfig, type MigrationProgress } from '../utils/azureStorage';
import { shouldEncryptBackup } from '../utils/encryption';
import { hasPinForAutoBackups, clearStoredPin, getPinForAutoBackups } from '../utils/pinManager';

interface AzureBackupProps {
  isOpen: boolean;
  onClose: () => void;
}



export default function AzureBackup({ isOpen, onClose }: AzureBackupProps) {
  const [config, setConfig] = useState<AzureConfig>({
    storageAccount: '',
    storageKey: '',
    sasToken: '',
    containerName: 'backups',
    tableName: 'theloaddown',
    enabled: false,
    autoBackupEnabled: false,
    autoBackupContainer: 'auto-backups',
    autoBackupRetention: 10
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'connecting' | 'connected' | 'error'>('offline');
  const [service, setService] = useState<AzureStorageService | null>(null);
  const [backups, setBackups] = useState<string[]>([]);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [isOperating, setIsOperating] = useState(false);

  // Load saved config
  useEffect(() => {
    const saved = localStorage.getItem('azure-backup-config');
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved);
        setConfig(savedConfig);
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, []);

  const testConnection = async () => {
    if (!config.storageAccount || !config.sasToken) {
      alert('Please enter storage account name and SAS token');
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      // Debug info
      console.log('Testing Azure connection with:', {
        storageAccount: config.storageAccount,
        containerName: config.containerName,
        sasTokenStart: config.sasToken.substring(0, 20) + '...',
        sasTokenLength: config.sasToken.length
      });
      
      const newService = new AzureStorageService(config, 'backup-user');
      
      // Initialize storage (create table and container)
      await newService.initializeStorage();
      
      const isConnected = await newService.testConnection();
      
      if (isConnected) {
        setService(newService);
        setConnectionStatus('connected');
        
        // Set enabled to true when connection is successful
        const updatedConfig = { ...config, enabled: true };
        setConfig(updatedConfig);
        localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
        
        // Load existing backups
        try {
          const existingBackups = await newService.listBackups();
          setBackups(existingBackups);
        } catch (error) {
          console.warn('Could not load existing backups:', error);
        }
        
        alert('Configuration saved and storage initialized! Ready to create backups.');
      } else {
        setConnectionStatus('error');
        alert('Connection failed. Please check:\n\n1. Storage account name is correct\n2. Container exists and is named correctly\n3. SAS token has read/write/list permissions\n4. SAS token is not expired\n5. Container name matches exactly (case-sensitive)');
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMsg = (error as Error).message;
      let troubleshootingMsg = 'Connection error: ' + errorMsg + '\n\nTroubleshooting:\n';
      
      if (errorMsg.includes('NetworkError') || errorMsg.includes('fetch')) {
        troubleshootingMsg += '• Check your internet connection\n• Ensure you\'re not on a restricted network';
      } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
        troubleshootingMsg += '• SAS token lacks required permissions\n• Generate new SAS token with read/write/list permissions';
      } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
        troubleshootingMsg += '• Storage account name is incorrect\n• Container doesn\'t exist - create it in Azure Portal first';
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        troubleshootingMsg += '• SAS token is invalid or expired\n• Generate a new SAS token';
      } else {
        troubleshootingMsg += '• Verify all credentials are correct\n• Try generating a new SAS token';
      }
      
      alert(troubleshootingMsg);
    }
  };

  const createBackup = async () => {
    if (!service) {
      alert('Please test connection first');
      return;
    }

    if (!confirm('This will create a backup of all your data in Azure. Continue?')) {
      return;
    }

    setIsOperating(true);
    
    try {
      // Check if encryption is required and get PIN
      const needsEncryption = shouldEncryptBackup();
      let pin: string | undefined = undefined;
      
      if (needsEncryption) {
        // Get stored PIN (should be available since user unlocked the app)
        const storedPin = await getPinForAutoBackups();
        
        if (!storedPin) {
          throw new Error('PIN not available. Please unlock the app first.');
        }
        
        pin = storedPin;
      }
      
      const backupId = await service.createBackup(
        (progress: MigrationProgress) => {
          setProgress(progress);
        },
        pin
      );
      
      const displayInfo = needsEncryption ? ' (encrypted)' : '';
      alert(`Backup created successfully!${displayInfo} ID: ${backupId}`);
      
      // Refresh backup list
      const updatedBackups = await service.listBackups();
      setBackups(updatedBackups);
      
    } catch (error) {
      alert('Backup failed: ' + (error as Error).message);
    } finally {
      setIsOperating(false);
      setProgress(null);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!service) return;

    if (!confirm(`This will replace ALL your current data with the backup from ${backupId}. This cannot be undone. Continue?`)) {
      return;
    }

    setIsOperating(true);
    let pin: string | undefined = undefined;
    
    try {
      // If backup filename suggests it's encrypted, prompt for PIN upfront
      if (backupId.includes('encrypted')) {
        const userPin = prompt('Enter your PIN to decrypt the backup:');
        if (!userPin) {
          throw new Error('PIN required to decrypt Azure backup');
        }
        pin = userPin;
      }
      
      await service.restoreFromBackup(backupId, (progress: MigrationProgress) => {
        setProgress(progress);
      }, pin);
      
      alert('Restore completed successfully! Please refresh the page to see changes.');
      
    } catch (error) {
      // If it failed due to missing PIN, try again with PIN prompt
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('PIN required') && !pin) {
        try {
          const userPin = prompt('This backup is encrypted. Enter your PIN to decrypt:');
          if (!userPin) {
            throw new Error('PIN required to decrypt backup');
          }
          
          await service.restoreFromBackup(backupId, (progress: MigrationProgress) => {
            setProgress(progress);
          }, userPin);
          
          alert('Restore completed successfully! Please refresh the page to see changes.');
        } catch (retryError) {
          alert('Restore failed: ' + (retryError as Error).message);
        }
      } else {
        alert('Restore failed: ' + errorMsg);
      }
    } finally {
      setIsOperating(false);
      setProgress(null);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!service) return;

    if (!confirm(`Delete backup ${backupId}? This cannot be undone.`)) {
      return;
    }

    try {
      await service.deleteBackup(backupId);
      alert('Backup deleted successfully!');
      
      // Refresh backup list
      const updatedBackups = await service.listBackups();
      setBackups(updatedBackups);
      
    } catch (error) {
      alert('Delete failed: ' + (error as Error).message);
    }
  };

  const exportConfig = () => {
    const configData = JSON.stringify(config, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `azure-backup-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedConfig = JSON.parse(text);
        setConfig(importedConfig);
        alert('Configuration imported successfully!');
      } catch (error) {
        alert('Failed to import configuration: ' + (error as Error).message);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">☁️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Azure Backup & Restore</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Backup your data to Microsoft Azure</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>

          {!isOperating ? (
            <>
              {/* Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Configuration</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={importConfig}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Import
                    </button>
                    <button
                      onClick={exportConfig}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Export
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Storage Account Name</label>
                    <input
                      type="text"
                      placeholder="youraccount"
                      value={config.storageAccount}
                      onChange={(e) => {
                        const updatedConfig = { ...config, storageAccount: e.target.value };
                        setConfig(updatedConfig);
                        localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Container Name</label>
                    <input
                      type="text"
                      placeholder="backups"
                      value={config.containerName}
                      onChange={(e) => {
                        const updatedConfig = { ...config, containerName: e.target.value };
                        setConfig(updatedConfig);
                        localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Create this container manually in Azure Portal first
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium">Authentication Method</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">SAS Token (Recommended)</label>
                        <input
                          type="text"
                          placeholder="sv=2020-08-04&ss=t&srt=sco&sp=rwdlacup&se=..."
                          value={config.sasToken || ''}
                          onChange={(e) => {
                            const updatedConfig = { ...config, sasToken: e.target.value };
                            setConfig(updatedConfig);
                            localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Generate a SAS token in Azure Portal for easier authentication
                        </p>
                      </div>
                      
                      <div className="border-t pt-3">
                        <label className="block text-sm font-medium mb-1">
                          Storage Account Key (Alternative)
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your storage account key"
                          value={config.storageKey}
                          onChange={(e) => {
                            const updatedConfig = { ...config, storageKey: e.target.value };
                            setConfig(updatedConfig);
                            localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Only needed if not using SAS token
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto Backup Settings */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">🔄</span>
                    <h4 className="font-semibold text-gray-800 dark:text-white">Automatic Backup Settings</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Enable Auto Backup Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 dark:text-gray-300">Enable Auto Backup</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Automatically backup to Azure when you add/edit data</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={config.autoBackupEnabled || false}
                          onChange={(e) => {
                            const updatedConfig = { 
                              ...config, 
                              autoBackupEnabled: e.target.checked 
                            };
                            setConfig(updatedConfig);
                            localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Auto Backup Container */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Auto Backup Container</label>
                      <input
                        type="text"
                        placeholder="auto-backups"
                        value={config.autoBackupContainer || ''}
                        onChange={(e) => {
                          const updatedConfig = { 
                            ...config, 
                            autoBackupContainer: e.target.value 
                          };
                          setConfig(updatedConfig);
                          localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                        }}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Dedicated container for automatic backups (separate from manual backups)
                      </p>
                    </div>

                    {/* Retention Count */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 dark:text-gray-300">Backup Retention</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Number of automatic backups to keep (older ones are deleted)</div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.autoBackupRetention || 10}
                          onChange={(e) => {
                            const newRetention = Math.max(1, Math.min(100, parseInt(e.target.value) || 10));
                            const updatedConfig = { 
                              ...config, 
                              autoBackupRetention: newRetention 
                            };
                            setConfig(updatedConfig);
                            localStorage.setItem('azure-backup-config', JSON.stringify(updatedConfig));
                          }}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">backups</span>
                      </div>
                    </div>

                    {config.autoBackupEnabled && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>ℹ️ Note:</strong> Auto backups are data-only (no photos) for faster uploads. 
                          Manual backups from below still include photos if you choose.
                        </div>
                        
                        {/* PIN Status for Auto-Backups */}
                        {shouldEncryptBackup() && (
                          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-600">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-blue-900 dark:text-blue-100">
                                  🔒 Auto-Backup Encryption Status
                                </div>
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                  {hasPinForAutoBackups() 
                                    ? 'PIN stored securely (will be cleared when app locks)'
                                    : 'No PIN stored - auto-backups will be skipped for security'
                                  }
                                </div>
                              </div>
                              {hasPinForAutoBackups() && (
                                <button
                                  onClick={() => {
                                    if (confirm('Clear stored PIN? Auto-backups will be disabled until next manual backup.')) {
                                      clearStoredPin();
                                      // Force re-render by updating a state
                                      setConfig({...config});
                                    }
                                  }}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40"
                                >
                                  Clear PIN
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionStatus === 'offline' ? 'bg-gray-400' :
                      connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                      connectionStatus === 'connected' ? 'bg-green-400' :
                      'bg-red-400'
                    }`}></div>
                    <span className="text-sm capitalize">{connectionStatus}</span>
                  </div>
                  <button
                    onClick={testConnection}
                    disabled={connectionStatus === 'connecting'}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                  >
                    {connectionStatus === 'connecting' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Backup Operations */}
              {connectionStatus === 'connected' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Backup Operations</h4>
                    <button
                      onClick={createBackup}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      Create Backup
                    </button>
                  </div>

                  {/* Backup List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {backups.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No backups found</p>
                    ) : (
                      backups.map((backup) => {
                        // Parse backup filename for display info
                        const backupName = backup.replace('.json', '');
                        const isEncrypted = backupName.includes('encrypted');
                        
                        // Look for Unix timestamp (13 digits)
                        const timestampMatch = backupName.match(/\d{13}/);
                        let displayDate = 'Unknown Date';
                        if (timestampMatch) {
                          const timestamp = parseInt(timestampMatch[0]);
                          displayDate = new Date(timestamp).toLocaleString();
                        } else {
                          // Fallback: look for ISO date format
                          const datePart = backupName.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
                          if (datePart) {
                            displayDate = new Date(datePart[0].replace(/-/g, ':').replace('T', ' ')).toLocaleString();
                          }
                        }
                        
                        // Extract a cleaner display name (remove user prefix and timestamp)
                        const cleanName = backupName
                          .replace(/^user_[^_]+_/, '') // Remove user prefix
                          .replace(/\d{13}/, '') // Remove Unix timestamp
                          .replace(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/, '') // Remove ISO timestamp
                          .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
                          .replace(/_encrypted/, '') // Remove encrypted suffix for display
                          .replace(/_/g, ' ') || 'Backup'; // Replace underscores with spaces, fallback to 'Backup'
                        
                        return (
                          <div key={backup} className={`p-3 border rounded-lg transition-all duration-200 ${
                            isEncrypted 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                {isEncrypted && (
                                  <div className="flex-shrink-0">
                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium text-sm flex items-center gap-1 ${
                                    isEncrypted 
                                      ? 'text-blue-800 dark:text-blue-200' 
                                      : 'text-gray-800 dark:text-gray-200'
                                  }`}>
                                    {displayDate}
                                    {isEncrypted && (
                                      <span className="text-xs font-normal text-blue-600 dark:text-blue-400">
                                        (Encrypted)
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-xs truncate ${
                                    isEncrypted 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {cleanName}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => restoreBackup(backup)}
                                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => deleteBackup(backup)}
                                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Progress Display */
            <div className="text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              
              {progress && (
                <div>
                  <p className="font-medium mb-2">{progress.message}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.current}/{progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Phase: {progress.phase}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}