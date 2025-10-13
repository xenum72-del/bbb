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
    typeId: settings?.defaultTypeId || (interactionTypes[0]?.id || 1), // Keep for backward compatibility
    activitiesPerformed: settings?.defaultTypeId ? [settings.defaultTypeId] : (interactionTypes[0]?.id ? [interactionTypes[0].id] : []), // Multiple activities
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
    
    if (formData.activitiesPerformed.length === 0) {
      alert('Please select at least one activity');
      return;
    }

    try {
      const encounter = {
        date: new Date(formData.date),
        rating: formData.rating,
        participants: formData.isAnonymous ? [] : formData.participants,
        isAnonymous: formData.isAnonymous,
        typeId: formData.activitiesPerformed[0] || formData.typeId, // Use first activity for backward compatibility
        activitiesPerformed: formData.activitiesPerformed.length > 0 ? formData.activitiesPerformed : undefined,
        beneficiary: formData.beneficiary,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        notes: formData.notes.trim() || undefined,
        location: (formData.location.lat && formData.location.lon) ? {
          lat: parseFloat(formData.location.lat),
          lon: parseFloat(formData.location.lon),
          place: formData.location.place || undefined,
        } : undefined,
        pictures: formData.pictures.length > 0 ? formData.pictures : undefined,
        createdAt: new Date()
      };      await encountersApi.create(encounter);
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

        {/* Activities Performed */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Activities Performed * 
            <span className="text-xs text-gray-500 font-normal">
              ({formData.activitiesPerformed.length} selected)
            </span>
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
            {interactionTypes.map(type => {
              const isSelected = formData.activitiesPerformed.includes(type.id!);
              return (
                <label
                  key={type.id}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } border`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const typeId = type.id!;
                      setFormData(f => ({
                        ...f,
                        activitiesPerformed: e.target.checked
                          ? [...f.activitiesPerformed, typeId]
                          : f.activitiesPerformed.filter(id => id !== typeId),
                        typeId: e.target.checked && f.activitiesPerformed.length === 0 ? typeId : f.typeId // Update primary typeId
                      }));
                    }}
                    className="rounded text-blue-600"
                  />
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-medium flex-1">{type.name}</span>
                </label>
              );
            })}
          </div>
          {formData.activitiesPerformed.length === 0 && (
            <div className="text-xs text-red-500 mt-1">
              Please select at least one activity
            </div>
          )}
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
          
          {/* Photo Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = async (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files) return;
                  
                  const newPictures: string[] = [];
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                      alert(`${file.name} is too large. Max size is 5MB.`);
                      continue;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const result = e.target?.result as string;
                      newPictures.push(result);
                      if (newPictures.length === files.length || newPictures.length === i + 1) {
                        setFormData(f => ({...f, pictures: [...f.pictures, ...newPictures]}));
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              📷 Choose Photos
            </button>

            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment'; // Use back camera
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  
                  if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    alert('Photo is too large. Max size is 5MB.');
                    return;
                  }
                  
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setFormData(f => ({...f, pictures: [...f.pictures, result]}));
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              }}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              📱 Take Photo
            </button>

            {formData.pictures.length > 0 && (
              <button
                type="button"
                onClick={() => setFormData(f => ({...f, pictures: []}))}
                className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                🗑️ Clear All
              </button>
            )}
          </div>

          {/* Photo Preview */}
          {formData.pictures.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{formData.pictures.length} photo(s) selected:</div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {formData.pictures.map((picture, index) => (
                  <div key={index} className="relative">
                    <img
                      src={picture}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({
                        ...f, 
                        pictures: f.pictures.filter((_, i) => i !== index)
                      }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            Max 5MB per photo. Photos are stored locally in your browser.
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