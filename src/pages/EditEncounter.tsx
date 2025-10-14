import React, { useEffect } from 'react';
import { useEncounter, useEncounters } from '../hooks/useDatabase';
import EncounterForm from '../components/EncounterForm';

interface EditEncounterProps {
  onNavigate: (page: string) => void;
  encounterId: number;
}

export default function EditEncounter({ onNavigate, encounterId }: EditEncounterProps) {
  const allEncounters = useEncounters();
  const existingEncounter = useEncounter(encounterId);

  // Get all existing tags from encounters for suggestions
  const existingTags = React.useMemo(() => {
    if (!allEncounters) return [];
    const tagSet = new Set<string>();
    allEncounters.forEach(encounter => {
      if (encounter.tags) {
        encounter.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allEncounters]);
  
  // Handle not found case
  useEffect(() => {
    if (existingEncounter === null) {
      console.error(`Encounter with ID ${encounterId} not found`);
      alert(`Encounter not found (ID: ${encounterId})`);
      onNavigate('timeline');
    }
  }, [existingEncounter, onNavigate, encounterId]);

  // Show loading state while encounter is being fetched
  if (existingEncounter === undefined) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => onNavigate('timeline')}
            className="mr-3 text-primary"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold">Edit Encounter</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">Loading encounter...</div>
        </div>
      </div>
    );
  }

  // This should not render if encounter is null (handled by useEffect redirect)
  if (!existingEncounter) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate('timeline')}
            className="mr-3 text-primary"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold">Edit Encounter</h2>
        </div>
        
        {/* Delete Button */}
        <button
          onClick={async () => {
            if (window.confirm('Are you sure you want to delete this encounter? This cannot be undone.')) {
              try {
                const { encountersApi } = await import('../hooks/useDatabase');
                await encountersApi.delete(existingEncounter.id!);
                
                // Show backup prompt after successful delete (only if auto backup not enabled)
                const { showBackupPrompt, shouldShowBackupPrompt, triggerAutoAzureBackup } = await import('../utils/backup');
                
                // Trigger auto backup first
                triggerAutoAzureBackup().catch(err => 
                  console.warn('Auto Azure backup failed:', err)
                );
                
                // Only show manual prompt if needed
                if (shouldShowBackupPrompt()) {
                  setTimeout(() => {
                    showBackupPrompt();
                  }, 100);
                }
                
                onNavigate('timeline');
              } catch (error) {
                console.error('Error deleting encounter:', error);
                alert('Failed to delete encounter. Please try again.');
              }
            }
          }}
          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          🗑️ Delete
        </button>
      </div>

      <EncounterForm
        mode="edit"
        existingEncounter={existingEncounter}
        onSubmit={(success) => {
          if (success) {
            onNavigate('timeline');
          }
        }}
        onCancel={() => onNavigate('timeline')}
        availableTags={existingTags}
      />
    </div>
  );
}