import React from 'react';
import { useEncounters } from '../hooks/useDatabase';
import EncounterForm from '../components/EncounterForm';

interface AddEncounterProps {
  onNavigate: (page: string) => void;
}

export default function AddEncounter({ onNavigate }: AddEncounterProps) {
  const allEncounters = useEncounters();

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
        <h2 className="text-xl font-bold">Add Encounter</h2>
      </div>

      <EncounterForm
        mode="add"
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