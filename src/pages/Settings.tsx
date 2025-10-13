import { useSettings, useInteractionTypes, settingsApi } from '../hooks/useDatabase';
import { useState, useEffect } from 'react';
import { db } from '../db/schema';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({}: SettingsProps) {
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
    reminderFrequency: 'none' as 'daily' | 'weekly' | 'none'
  });

  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        scoringWeights: settings.scoringWeights,
        defaultRating: settings.defaultRating,
        defaultTypeId: settings.defaultTypeId,
        theme: settings.theme,
        notificationsEnabled: settings.notificationsEnabled,
        reminderFrequency: settings.reminderFrequency
      });
    }
  }, [settings]);

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
      const friends = await db.friends.toArray();
      const encounters = await db.encounters.toArray();
      const types = await db.interactionTypes.toArray();
      const settings = await db.settings.toArray();

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          friends,
          encounters,
          interactionTypes: types,
          settings
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encounter-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExport(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
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
        
        if (!importData.data) {
          alert('Invalid backup file format');
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
        if (importData.data.friends) {
          await db.friends.bulkAdd(importData.data.friends.map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
            updatedAt: f.updatedAt ? new Date(f.updatedAt) : undefined,
            lastTested: f.lastTested ? new Date(f.lastTested) : undefined
          })));
        }

        if (importData.data.encounters) {
          await db.encounters.bulkAdd(importData.data.encounters.map((e: any) => ({
            ...e,
            date: new Date(e.date),
            createdAt: new Date(e.createdAt),
            updatedAt: e.updatedAt ? new Date(e.updatedAt) : undefined
          })));
        }

        if (importData.data.interactionTypes) {
          await db.interactionTypes.bulkAdd(importData.data.interactionTypes);
        }

        if (importData.data.settings) {
          await db.settings.bulkAdd(importData.data.settings.map((s: any) => ({
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

  const handleResetToGayActivities = async () => {
    if (!confirm('This will replace all current interaction types with explicit gay sex activities. Continue?')) {
      return;
    }

    try {
      // Clear existing types
      await db.interactionTypes.clear();
      
      // Add new gay sex activities
      const gayActivities = [
        { name: 'Oral (Giving)', color: '#FF6B6B', icon: '👄' },
        { name: 'Oral (Receiving)', color: '#4ECDC4', icon: '😋' },
        { name: 'Anal (Topping)', color: '#45B7D1', icon: '🍆' },
        { name: 'Anal (Bottoming)', color: '#96CEB4', icon: '🍑' },
        { name: 'Rimming (Giving)', color: '#FFEAA7', icon: '👅' },
        { name: 'Rimming (Receiving)', color: '#DDA0DD', icon: '🌟' },
        { name: 'Handjob (Giving)', color: '#98D8C8', icon: '✋' },
        { name: 'Handjob (Receiving)', color: '#F7DC6F', icon: '👏' },
        { name: 'Mutual Masturbation', color: '#BB8FCE', icon: '🤝' },
        { name: 'Frotting/Grinding', color: '#85C1E9', icon: '🔥' },
        { name: 'Body Contact/Massage', color: '#F8C471', icon: '💆' },
        { name: 'Kissing/Making Out', color: '#F1948A', icon: '💋' },
        { name: 'Nipple Play', color: '#AED6F1', icon: '🎯' },
        { name: 'BDSM Dom', color: '#2C3E50', icon: '⛓️' },
        { name: 'BDSM Sub', color: '#8E44AD', icon: '🔒' },
        { name: 'Spanking (Giving)', color: '#E74C3C', icon: '✋' },
        { name: 'Spanking (Receiving)', color: '#C0392B', icon: '🍑' },
        { name: 'Role Play', color: '#9B59B6', icon: '🎭' },
        { name: 'Daddy/Son Play', color: '#34495E', icon: '👨‍👦' },
        { name: 'Public/Semi-Public', color: '#16A085', icon: '🏞️' },
        { name: 'Car Play', color: '#2980B9', icon: '🚗' },
        { name: 'Shower/Bath', color: '#3498DB', icon: '🚿' },
        { name: 'Toy Play', color: '#E67E22', icon: '🧸' },
        { name: 'Dildo/Vibrator', color: '#D35400', icon: '🍆' },
        { name: 'Cock Ring', color: '#8E44AD', icon: '⭕' },
        { name: 'Poppers', color: '#F39C12', icon: '💨' },
        { name: 'Threesome (MMM)', color: '#27AE60', icon: '👥' },
        { name: 'Group (4+)', color: '#229954', icon: '👨‍👨‍👦‍👦' },
        { name: 'Orgy', color: '#196F3D', icon: '🎉' },
        { name: 'Cruising', color: '#5DADE2', icon: '🚶' },
        { name: 'Glory Hole', color: '#AF7AC5', icon: '🕳️' },
        { name: 'Sauna/Spa', color: '#F7DC6F', icon: '🧖' },
        { name: 'Leather/Fetish', color: '#1C2833', icon: '🖤' },
        { name: 'Watersports', color: '#F4D03F', icon: '💦' },
        { name: 'Spit Play', color: '#85C1E9', icon: '💧' },
        { name: 'Feet/Foot Worship', color: '#D7BDE2', icon: '🦶' },
        { name: 'Armpit Worship', color: '#AED6F1', icon: '💪' },
        { name: 'Scent/Musk Play', color: '#A9DFBF', icon: '👃' },
        { name: 'Rough Play', color: '#EC7063', icon: '💥' },
        { name: 'Gentle/Romantic', color: '#F8BBD9', icon: '💕' },
        { name: 'Marathon Session', color: '#85929E', icon: '⏰' },
        { name: 'Quick/Lunch Break', color: '#F0B27A', icon: '⚡' },
        { name: 'Overnight', color: '#5499C7', icon: '🌙' },
        { name: 'Breeding/Cum Play', color: '#CD6155', icon: '🥛' },
        { name: 'Bareback', color: '#DC7633', icon: '🚫' },
        { name: 'Safe/Condom', color: '#58D68D', icon: '✅' }
      ];

      await db.interactionTypes.bulkAdd(gayActivities);
      alert('Reset to explicit gay sex activities successfully!');
    } catch (error) {
      console.error('Error resetting activities:', error);
      alert('Failed to reset activities');
    }
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
    <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">⚙️</span>
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Customize your experience</p>
          </div>
        </div>

        {/* Friend Scoring Algorithm */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Friend Scoring Algorithm
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Adjust how friend rankings are calculated</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {Object.entries(localSettings.scoringWeights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium capitalize">{key}</label>
                  <span className="text-sm text-gray-500">{(value * 100).toFixed(0)}%</span>
                </div>
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
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
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏷️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  Interaction Types
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage activity categories</p>
              </div>
            </div>
            <button
              onClick={handleResetToGayActivities}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Reset to Explicit Gay Sex Activities
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

        {/* Data Management */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💾</span>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Data Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Backup and manage your data</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowExport(true)}
              className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">Export Data</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Download all your data as JSON</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleImportData}
              className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📥</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">Import Data</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Restore from JSON backup file</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleClearData}
              className="w-full p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-xl text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🗑️</span>
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
            {isWeightValid ? '💾 Save Settings' : 'Fix Weights First (must total 100%)'}
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
                  📱 Export to Downloads
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
    </div>
  );
}