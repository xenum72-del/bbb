import { useState } from 'react';
import { useActiveFriends } from '../hooks/useDatabase';
import type { Friend } from '../db/schema';

interface ParticipantsSelectProps {
  selectedParticipants: number[];
  onParticipantsChange: (participants: number[]) => void;
  isAnonymous: boolean;
  onAnonymousChange: (isAnonymous: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export default function ParticipantsSelect({
  selectedParticipants,
  onParticipantsChange,
  isAnonymous,
  onAnonymousChange,
  searchQuery,
  onSearchChange,
  className = ''
}: ParticipantsSelectProps) {
  const friends = useActiveFriends();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleParticipantToggle = (friendId: number) => {
    const isSelected = selectedParticipants.includes(friendId);
    if (isSelected) {
      onParticipantsChange(selectedParticipants.filter(id => id !== friendId));
    } else {
      onParticipantsChange([...selectedParticipants, friendId]);
    }
  };

  const handleAddCustomFriend = async () => {
    if (!customName.trim()) return;
    
    // For now, just show an alert. In a real implementation, you'd create a new friend
    alert(`Custom friend "${customName}" would be added here. For now, please use the Friends page to add them first.`);
    setCustomName('');
    setShowCustomInput(false);
  };

  const filteredFriends = friends.filter((friend: Friend) =>
    searchQuery === '' ||
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Anonymous Toggle */}
      <div className="flex items-center space-x-2 mb-3">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => onAnonymousChange(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="anonymous" className="text-sm font-medium">
          Anonymous encounter (no specific participants)
        </label>
      </div>

      {!isAnonymous && (
        <>
          <label className="block text-sm font-medium mb-1">
            Participants *
            {selectedParticipants.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                ({selectedParticipants.length} selected)
              </span>
            )}
          </label>

          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Search participants..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
          />

          {/* Friends List */}
          <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800 space-y-1">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                {friends.length === 0 ? (
                  <>
                    No friends added yet.{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => alert('Navigate to Friends page to add friends')}
                    >
                      Add friends first
                    </button>
                  </>
                ) : (
                  'No friends match your search'
                )}
              </div>
            ) : (
              filteredFriends.map((friend: Friend) => {
                const isSelected = selectedParticipants.includes(friend.id!);
                return (
                  <label
                    key={friend.id}
                    className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleParticipantToggle(friend.id!)}
                      className="rounded text-blue-600"
                    />
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        friend.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-medium flex-1">{friend.name}</span>
                  </label>
                );
              })
            )}
          </div>

          {/* Add Custom Friend */}
          <div className="mt-2">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add someone not in friends list
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter name..."
                  className="flex-1 p-1 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomFriend()}
                />
                <button
                  type="button"
                  onClick={handleAddCustomFriend}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomName('');
                  }}
                  className="px-2 py-1 border rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Validation Message */}
          {!isAnonymous && selectedParticipants.length === 0 && (
            <div className="text-xs text-red-500 mt-1">
              Please select at least one participant or mark as anonymous
            </div>
          )}
        </>
      )}
    </div>
  );
}