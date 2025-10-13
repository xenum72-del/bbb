import { useSettings, useInteractionTypes, settingsApi, interactionTypesA    };

import { useState, useEffect } from 'react'; } from '../hooks/useDatabase';

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
  };ks/useDatabase';
import { useState, useEffect } from 'react';
import { db, type InteractionType } from '../db/schema';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({ }: SettingsProps) {
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
  const [editingType, setEditingType] = useState<InteractionType | null>(null);
  const [showAddType, setShowAddType] = useState(false);
  const [newType, setNewType] = useState({ name: '', color: '#3B82F6', icon: '📝' });

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
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const handleClearData = async () => {
    if (confirm('This will delete ALL your data permanently. Are you sure?')) {
      if (confirm('This action cannot be undone. Really delete everything?')) {
        try {
          await db.transaction('rw', db.friends, db.encounters, db.interactionTypes, db.settings, async () => {
            await db.friends.clear();
            await db.encounters.clear();
            await db.interactionTypes.clear();
            await db.settings.clear();
          });
          alert('All data has been cleared');
          window.location.reload();
        } catch (error) {
          console.error('Failed to clear data:', error);
          alert('Failed to clear data');
        }
      }
    }
  };

  const handleResetInteractionTypes = async () => {
    if (confirm('Reset to new gay dating interaction types? This will replace current types.')) {
      try {
        await db.interactionTypes.clear();
        // Trigger the seeding by reloading
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset interaction types:', error);
        alert('Failed to reset interaction types');
      }
    }
  };

  const totalWeight = Object.values(localSettings.scoringWeights).reduce((sum, w) => sum + w, 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  // Interaction type CRUD functions
  const handleAddType = async () => {
    if (newType.name.trim()) {
      try {
        await interactionTypesApi.create({
          name: newType.name.trim(),
          color: newType.color,
          icon: newType.icon
        });
        setNewType({ name: '', color: '#3B82F6', icon: '📝' });
        setShowAddType(false);
      } catch (error) {
        console.error('Failed to add interaction type:', error);
        alert('Failed to add interaction type');
      }
    }
  };

  const handleEditType = async (id: number, changes: Partial<InteractionType>) => {
    try {
      await interactionTypesApi.update(id, changes);
      setEditingType(null);
    } catch (error) {
      console.error('Failed to update interaction type:', error);
      alert('Failed to update interaction type');
    }
  };

  const handleDeleteType = async (id: number, typeName: string) => {
    if (confirm(`Delete "${typeName}" interaction type? This cannot be undone.`)) {
      try {
        // Check if any encounters use this type
        const encountersWithType = await db.encounters.where('typeId').equals(id).count();
        if (encountersWithType > 0) {
          if (!confirm(`This type is used in ${encountersWithType} encounters. Delete anyway?`)) {
            return;
          }
        }
        await interactionTypesApi.delete(id);
      } catch (error) {
        console.error('Failed to delete interaction type:', error);
        alert('Failed to delete interaction type');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your Encounter Ledger experience</p>
        </div>

        <div className="space-y-6">
        {/* Scoring Weights */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⚖️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Friend Scoring Algorithm
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adjust how friends are ranked in your dashboard
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-2">📊 How Scoring Works:</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li><strong>Frequency:</strong> How often you meet (last 90 days)</li>
              <li><strong>Recency:</strong> How recent your last encounter was (today = 100%, decreases over time)</li>
              <li><strong>Quality:</strong> Average rating of your encounters (1-5 stars)</li>
              <li><strong>Mutuality:</strong> Balance of who benefits (both, you, or them)</li>
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency Weight: {localSettings.scoringWeights.frequency.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.scoringWeights.frequency}
                onChange={(e) => setLocalSettings(s => ({
                  ...s,
                  scoringWeights: {
                    ...s.scoringWeights,
                    frequency: parseFloat(e.target.value)
                  }
                }))}
                className="w-full slider"
              />
              <div className="text-xs text-gray-500">How often you interact (last 90 days)</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Recency Weight: {localSettings.scoringWeights.recency.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.scoringWeights.recency}
                onChange={(e) => setLocalSettings(s => ({
                  ...s,
                  scoringWeights: {
                    ...s.scoringWeights,
                    recency: parseFloat(e.target.value)
                  }
                }))}
                className="w-full slider"
              />
              <div className="text-xs text-gray-500">How recently you last met (more recent = higher score)</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Quality Weight: {localSettings.scoringWeights.quality.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.scoringWeights.quality}
                onChange={(e) => setLocalSettings(s => ({
                  ...s,
                  scoringWeights: {
                    ...s.scoringWeights,
                    quality: parseFloat(e.target.value)
                  }
                }))}
                className="w-full slider"
              />
              <div className="text-xs text-gray-500">Average rating of encounters</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mutuality Weight: {localSettings.scoringWeights.mutuality.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.scoringWeights.mutuality}
                onChange={(e) => setLocalSettings(s => ({
                  ...s,
                  scoringWeights: {
                    ...s.scoringWeights,
                    mutuality: parseFloat(e.target.value)
                  }
                }))}
                className="w-full slider"
              />
              <div className="text-xs text-gray-500">% of encounters where both benefited</div>
            </div>

            <div className={`text-sm p-2 rounded ${
              isWeightValid 
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              Total weight: {totalWeight.toFixed(2)} {isWeightValid ? '✓' : '(should equal 1.00)'}
            </div>
          </div>
        </div>

        {/* Interaction Types Management */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏷️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Interaction Types
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your encounter categories</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {interactionTypes.map(type => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                    <span className="text-lg">{type.icon}</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-white">{type.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full shadow-inner border-2 border-white/50"
                    style={{ backgroundColor: type.color }}
                  />
                  <button
                    onClick={() => setEditingType(type)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id!, type.name)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => setShowAddType(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span className="text-lg">➕</span>
              <span>Add New Interaction Type</span>
            </button>
            
            <button
              onClick={handleResetInteractionTypes}
              className="w-full p-2 text-sm bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>🔥</span>
              <span>Reset to Explicit Gay Sex Activities</span>
            </button>
          </div>
        </div>

        {/* Default Values */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Default Values
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pre-fill new encounters</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setLocalSettings(s => ({...s, defaultRating: rating}))}
                    className={`text-2xl ${
                      rating <= localSettings.defaultRating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Default Interaction Type</label>
              <select
                value={localSettings.defaultTypeId || ''}
                onChange={(e) => setLocalSettings(s => ({
                  ...s, 
                  defaultTypeId: e.target.value ? Number(e.target.value) : undefined
                }))}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700"
              >
                <option value="">None</option>
                {interactionTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Appearance</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Light', icon: '☀️' },
                { value: 'dark', label: 'Dark', icon: '🌙' },
                { value: 'system', label: 'System', icon: '⚙️' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocalSettings(s => ({...s, theme: option.value as any}))}
                  className={`p-2 rounded border text-center ${
                    localSettings.theme === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg mb-1">{option.icon}</div>
                  <div className="text-sm">{option.label}</div>
                </button>
              ))}
            </div>
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
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📤</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Export Data
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will download all your friends, encounters, and settings as a JSON file.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleExportData}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                📥 Download
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {showAddType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">➕</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Add Interaction Type
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newType.name}
                  onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Coffee Chat"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <input
                  type="text"
                  value={newType.icon}
                  onChange={(e) => setNewType(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  placeholder="☕"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <input
                  type="color"
                  value={newType.color}
                  onChange={(e) => setNewType(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddType}
                disabled={!newType.name.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none"
              >
                Add Type
              </button>
              <button
                onClick={() => setShowAddType(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Type Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✏️</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Edit Interaction Type
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editingType.name}
                  onChange={(e) => setEditingType(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <input
                  type="text"
                  value={editingType.icon}
                  onChange={(e) => setEditingType(prev => prev ? { ...prev, icon: e.target.value } : null)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <input
                  type="color"
                  value={editingType.color}
                  onChange={(e) => setEditingType(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleEditType(editingType.id!, editingType)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingType(null)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}