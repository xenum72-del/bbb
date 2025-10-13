import { useActiveFriends, useInteractionTypes, useSettings, encountersApi } from '../hooks/useDatabase';
import { useState } from 'react';

interface AddEncounterProps {
  onNavigate: (page: string) => void;
}

export default function AddEncounter({ onNavigate }: AddEncounterProps) {
  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();
  const settings = useSettings();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    rating: settings?.defaultRating || 4,
    participants: [] as number[],
    isAnonymous: false,
    typeId: settings?.defaultTypeId || (interactionTypes[0]?.id || 1),
    beneficiary: 'both' as 'me' | 'friend' | 'both',
    durationMinutes: '',
    notes: '',
    tags: '',
    location: {
      place: '',
      lat: '',
      lon: ''
    },
    pictures: [] as string[] // Array of image URLs
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.isAnonymous && formData.participants.length === 0) {
      alert('Please select at least one friend or mark as anonymous');
      return;
    }

    try {
      const encounter = {
        date: new Date(formData.date),
        rating: formData.rating,
        participants: formData.participants,
        isAnonymous: formData.isAnonymous,
        typeId: formData.typeId,
        beneficiary: formData.beneficiary,
        durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags.trim() ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        location: (formData.location.place || formData.location.lat) ? {
          place: formData.location.place.trim() || undefined,
          lat: formData.location.lat ? Number(formData.location.lat) : 0,
          lon: formData.location.lon ? Number(formData.location.lon) : 0,
        } : undefined,
        photos: formData.pictures.length > 0 ? formData.pictures : undefined
      };

      await encountersApi.create(encounter);
      onNavigate('dashboard');
    } catch (error) {
      console.error('Error creating encounter:', error);
      alert('Failed to save encounter. Please try again.');
    }
  };

  const toggleParticipant = (friendId: number) => {
    setFormData(f => ({
      ...f,
      participants: f.participants.includes(friendId)
        ? f.participants.filter(id => id !== friendId)
        : [...f.participants, friendId]
    }));
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium mb-1">Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData(f => ({...f, date: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            required
          />
        </div>

        {/* Interaction Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {interactionTypes.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData(f => ({...f, typeId: type.id!}))}
                className={`p-3 rounded border text-left ${
                  formData.typeId === type.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-medium">{type.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rating: {formData.rating} stars
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData(f => ({...f, rating}))}
                className={`text-2xl ${
                  rating <= formData.rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous Toggle */}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData(f => ({
              ...f, 
              isAnonymous: e.target.checked,
              participants: e.target.checked ? [] : f.participants
            }))}
            className="rounded"
          />
          <span className="text-sm font-medium">Anonymous encounter</span>
        </label>

        {/* Participants */}
        {!formData.isAnonymous && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Participants {formData.participants.length > 0 && `(${formData.participants.length} selected)`}
            </label>
            {friends.length === 0 ? (
              <div className="p-4 border rounded text-center text-gray-500">
                <p>No friends added yet</p>
                <button
                  type="button"
                  onClick={() => onNavigate('friends')}
                  className="text-primary mt-1"
                >
                  Add friends first →
                </button>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {friends.map(friend => (
                  <label
                    key={friend.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.participants.includes(friend.id!)}
                      onChange={() => toggleParticipant(friend.id!)}
                      className="rounded"
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
                    <span>{friend.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Beneficiary */}
        <div>
          <label className="block text-sm font-medium mb-1">Who benefited? *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'me', label: 'Me', icon: '👤' },
              { value: 'friend', label: 'Friend', icon: '👥' },
              { value: 'both', label: 'Both', icon: '🤝' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(f => ({...f, beneficiary: option.value as any}))}
                className={`p-2 rounded border text-center ${
                  formData.beneficiary === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="text-sm">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => setFormData(f => ({...f, durationMinutes: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="e.g., 60"
            min="0"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={formData.location.place}
            onChange={(e) => setFormData(f => ({
              ...f, 
              location: {...f.location, place: e.target.value}
            }))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="e.g., My apartment, Hotel, Bar name, Address, etc."
          />
          <div className="text-xs text-gray-500 mt-1">
            Enter any location: home, hotel, address, venue name
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(f => ({...f, tags: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="e.g., work, casual, celebration (comma-separated)"
          />
          <div className="text-xs text-gray-500 mt-1">
            Separate multiple tags with commas
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(f => ({...f, notes: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            rows={3}
            placeholder="How did it go? What happened?"
          />
        </div>

        {/* Pictures */}
        <div>
          <label className="block text-sm font-medium mb-1">Pictures</label>
          <textarea
            value={formData.pictures.join('\n')}
            onChange={(e) => setFormData(f => ({...f, pictures: e.target.value.split('\n').filter(url => url.trim())}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            rows={3}
            placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;(one URL per line)"
          />
          <div className="text-xs text-gray-500 mt-1">
            Add photo URLs, one per line
          </div>
        </div>

        {/* Submit */}
        <div className="flex space-x-2 pt-4">
          <button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium"
          >
            Save Encounter
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 border rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}