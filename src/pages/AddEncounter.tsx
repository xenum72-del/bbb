import React from 'react';
import { useEncounters } from '../hooks/useDatabase';
import EncounterForm from '../components/EncounterForm';
import type { Encounter } from '../db/schema';

interface AddEncounterProps {
  onNavigate: (page: string) => void;
}

export default function AddEncounter({ onNavigate }: AddEncounterProps) {
  const allEncounters = useEncounters();

  // Check for cloned encounter data
  const [cloneEncounter, setCloneEncounter] = React.useState<Encounter | null>(null);

  React.useEffect(() => {
    const cloneData = localStorage.getItem('clone-encounter');
    if (cloneData) {
      try {
        const encounter = JSON.parse(cloneData) as Encounter;
        setCloneEncounter(encounter);
        // Clear the clone data after using it
        localStorage.removeItem('clone-encounter');
      } catch (error) {
        console.error('Error parsing clone encounter data:', error);
      }
    }
  }, []);

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

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className="mr-3 text-primary"
        >
          ← Cancel
        </button>
        <h2 className="text-xl font-bold">
          {cloneEncounter ? 'Clone Encounter' : 'Add Encounter'}
        </h2>
      </div>

      {cloneEncounter && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📋 Cloning encounter from {new Date(cloneEncounter.date).toLocaleDateString()}. 
            Date will be set to now - you can adjust other details as needed.
          </p>
        </div>
      )}

      <EncounterForm
        mode="add"
        existingEncounter={cloneEncounter || undefined}
        onSubmit={(success) => {
          if (success) {
            onNavigate('dashboard');
          }
        }}
        onCancel={() => onNavigate('dashboard')}
        availableTags={existingTags}
      />
    </div>
  );
}