import { useActiveFriends, useInteractionTypes, useSettings, useEncounters, encountersApi } from '../hooks/useDatabase';
import React, { useState } from 'react';

interface AddEncounterProps {
  onNavigate: (page: string) => void;
}

export default function AddEncounter({ onNavigate }: AddEncounterProps) {
  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();
  const settings = useSettings();
  const allEncounters = useEncounters();

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
    pictures: [] as string[], // Array of image URLs
    // Payment fields
    isPaid: false,
    paymentType: 'given' as 'received' | 'given',
    amountAsked: '',
    amountGiven: '',
    currency: 'USD',
    paymentMethod: 'cash' as 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other',
    paymentNotes: ''
  });

  const [searchQueries, setSearchQueries] = useState({
    activities: '',
    participants: ''
  });

  const [locationState, setLocationState] = useState({
    isSearching: false,
    suggestions: [] as Array<{name: string, lat?: number, lon?: number}>,
    showCurrentLocation: false
  });

  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Suggested starter tags for new users
  const suggestedTags = [
    // Contexts & Situations
    'first-time', 'hookup', 'fwb', 'dating', 'relationship', 'one-night-stand',
    'vacation', 'travel', 'hotel', 'home', 'his-place', 'my-place',
    'spontaneous', 'planned', 'romantic', 'casual', 'wild', 'intimate',
    
    // Timing & Occasions
    'morning', 'afternoon', 'evening', 'late-night', 'weekend', 'weekday',
    'birthday', 'celebration', 'holiday', 'new-years', 'pride', 'anniversary',
    
    // Moods & Emotions  
    'horny', 'drunk', 'high', 'sober', 'kinky', 'vanilla', 'rough', 'gentle',
    'passionate', 'experimental', 'nervous', 'confident', 'lustful', 'romantic-mood',
    
    // Relationship Dynamics
    'makeup-sex', 'breakup-sex', 'goodbye-sex', 'reunion', 'revenge', 
    'rebound', 'jealous', 'forbidden', 'secret', 'public-ish',
    
    // Performance & Experience
    'amazing', 'disappointing', 'awkward', 'hot', 'intense', 'playful',
    'marathon', 'quickie', 'multiple-rounds', 'edging-session', 'power-play',
    
    // Settings & Locations
    'outdoors', 'car', 'bathroom', 'shower', 'sauna', 'gym', 'office', 'park',
    'beach', 'camping', 'party', 'club', 'bar-hookup', 'app-meetup',
    
    // Special Circumstances
    'bareback', 'safe', 'tested', 'prep', 'anonymous', 'masked', 'blindfolded',
    'recorded', 'photographed', 'threesome', 'group', 'orgy', 'exhibition',
    
    // Gear & Accessories
    'toys', 'poppers', 'lube', 'condoms', 'underwear', 'leather', 'uniform',
    'jockstrap', 'harness', 'collar', 'blindfold', 'ropes'
  ];

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

  // Use existing tags if available, otherwise show suggested starter tags
  const availableTags = existingTags.length > 0 ? existingTags : suggestedTags;

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
        createdAt: new Date(),
        // Payment fields
        isPaid: formData.isPaid,
        paymentType: formData.isPaid ? formData.paymentType : undefined,
        amountAsked: formData.isPaid && formData.amountAsked ? parseFloat(formData.amountAsked) : undefined,
        amountGiven: formData.isPaid && formData.amountGiven ? parseFloat(formData.amountGiven) : undefined,
        currency: formData.isPaid ? formData.currency : undefined,
        paymentMethod: formData.isPaid ? formData.paymentMethod : undefined,
        paymentNotes: formData.isPaid && formData.paymentNotes.trim() ? formData.paymentNotes.trim() : undefined
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
          
          {/* Activities Search */}
          <input
            type="text"
            placeholder="🔍 Search activities..."
            value={searchQueries.activities}
            onChange={(e) => setSearchQueries(sq => ({...sq, activities: e.target.value}))}
            className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
          />
          
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
            {interactionTypes
              .filter(type => 
                searchQueries.activities === '' ||
                type.name.toLowerCase().includes(searchQueries.activities.toLowerCase())
              )
              .map(type => {
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
              <div>
                {/* Participants Search */}
                <input
                  type="text"
                  placeholder="🔍 Search friends..."
                  value={searchQueries.participants}
                  onChange={(e) => setSearchQueries(sq => ({...sq, participants: e.target.value}))}
                  className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
                
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {friends
                    .filter(friend =>
                      searchQueries.participants === '' ||
                      friend.name.toLowerCase().includes(searchQueries.participants.toLowerCase())
                    )
                    .map(friend => (
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
          <label className="block text-sm font-medium mb-1">
            Location 
            <span className="text-xs text-gray-500 font-normal"> (with live search)</span>
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={formData.location.place}
              onChange={async (e) => {
                const value = e.target.value;
                setFormData(f => ({
                  ...f, 
                  location: {...f.location, place: value}
                }));
                
                // Simple location search using OpenStreetMap Nominatim (free)
                if (value.length > 3) {
                  setLocationState(ls => ({...ls, isSearching: true}));
                  try {
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`
                    );
                    const results = await response.json();
                    const suggestions = results.map((r: any) => ({
                      name: r.display_name,
                      lat: parseFloat(r.lat),
                      lon: parseFloat(r.lon)
                    }));
                    setLocationState(ls => ({...ls, suggestions, isSearching: false}));
                  } catch (error) {
                    console.log('Location search failed:', error);
                    setLocationState(ls => ({...ls, isSearching: false, suggestions: []}));
                  }
                } else {
                  setLocationState(ls => ({...ls, suggestions: []}));
                }
              }}
              onFocus={() => setLocationState(ls => ({...ls, showCurrentLocation: true}))}
              onBlur={() => setTimeout(() => setLocationState(ls => ({...ls, suggestions: []})), 200)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700"
              placeholder="🔍 Search for places or enter manually..."
            />
            
            {/* Get Current Location Button */}
            {locationState.showCurrentLocation && (
              <button
                type="button"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    setLocationState(ls => ({...ls, isSearching: true}));
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                          // Reverse geocoding to get place name
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                          );
                          const result = await response.json();
                          setFormData(f => ({
                            ...f,
                            location: {
                              place: result.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                              lat: latitude.toString(),
                              lon: longitude.toString()
                            }
                          }));
                        } catch (error) {
                          setFormData(f => ({
                            ...f,
                            location: {
                              ...f.location,
                              place: `Current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                              lat: latitude.toString(),
                              lon: longitude.toString()
                            }
                          }));
                        }
                        setLocationState(ls => ({...ls, isSearching: false}));
                      },
                      (_error) => {
                        alert('Could not get your location. Please enter manually.');
                        setLocationState(ls => ({...ls, isSearching: false}));
                      }
                    );
                  } else {
                    alert('Geolocation is not supported by this browser.');
                  }
                }}
                className="absolute right-2 top-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                📍 Use Current
              </button>
            )}
            
            {/* Location Suggestions */}
            {locationState.suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg max-h-48 overflow-y-auto">
                {locationState.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setFormData(f => ({
                        ...f,
                        location: {
                          place: suggestion.name,
                          lat: suggestion.lat?.toString() || '',
                          lon: suggestion.lon?.toString() || ''
                        }
                      }));
                      setLocationState(ls => ({...ls, suggestions: []}));
                    }}
                    className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0"
                  >
                    <div className="font-medium text-sm truncate">{suggestion.name}</div>
                  </button>
                ))}
              </div>
            )}
            
            {locationState.isSearching && (
              <div className="absolute right-8 top-2 text-gray-500">
                🔄 Searching...
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            🌍 <strong>Live Search:</strong> Type to search worldwide locations or click "📍 Use Current" for your location.
            Common examples: "Hotel Marriott", "Central Park NYC", "Starbucks", "My place", etc.
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Tags 
            <span className="text-xs text-gray-500 font-normal"> (for filtering & analytics)</span>
            {existingTags.length > 0 ? (
              <span className="text-xs text-green-600 font-normal"> - {existingTags.length} existing tags available</span>
            ) : (
              <span className="text-xs text-blue-600 font-normal"> - {suggestedTags.length} suggested starter tags</span>
            )}
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(f => ({...f, tags: value}));
                
                // Filter available tags for suggestions
                if (value.trim()) {
                  const lastTag = value.split(',').pop()?.trim().toLowerCase() || '';
                  const matchingTags = availableTags.filter(tag => 
                    tag.toLowerCase().includes(lastTag) && tag.toLowerCase() !== lastTag
                  );
                  setTagSuggestions(matchingTags.slice(0, 8)); // Limit to 8 suggestions
                } else {
                  setTagSuggestions([]);
                }
              }}
              onFocus={() => {
                setShowTagSuggestions(true);
                if (!formData.tags.trim() && availableTags.length > 0) {
                  setTagSuggestions(availableTags.slice(0, 8)); // Show popular/suggested tags when focused
                }
              }}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700"
              placeholder={existingTags.length > 0 
                ? `e.g., ${existingTags.slice(0, 3).join(', ')}... (or create new ones)`
                : `e.g., ${suggestedTags.slice(0, 3).join(', ')}... (suggested starter tags)`
              }
            />
            
            {/* Tag Suggestions */}
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg max-h-48 overflow-y-auto">
                {tagSuggestions.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      // Add tag to existing tags string
                      const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                      const lastTag = currentTags.pop() || '';
                      
                      // Replace partial last tag or add new tag
                      const newTags = lastTag 
                        ? [...currentTags, tag]
                        : [...currentTags, tag];
                      
                      setFormData(f => ({...f, tags: newTags.join(', ') + ', '}));
                      setTagSuggestions([]);
                      setShowTagSuggestions(false);
                    }}
                    className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 flex items-center justify-between"
                  >
                    <span className="text-sm">{tag}</span>
                    <span className="text-xs text-gray-500">
                      {allEncounters?.filter(e => e.tags?.includes(tag)).length || 0} uses
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Popular/Suggested Tags (if no input) */}
          {!formData.tags.trim() && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">
                {existingTags.length > 0 ? 'Popular existing tags:' : 'Suggested starter tags:'}
              </div>
              <div className="flex flex-wrap gap-1">
                {availableTags.slice(0, 8).map((tag, index) => {
                  const usageCount = existingTags.length > 0 
                    ? allEncounters?.filter(e => e.tags?.includes(tag)).length || 0
                    : null;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const currentTags = formData.tags ? formData.tags + ', ' + tag : tag;
                        setFormData(f => ({...f, tags: currentTags + ', '}));
                      }}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {tag} {usageCount !== null && `(${usageCount})`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            {existingTags.length > 0 
              ? `💡 Start typing to see suggestions from your ${existingTags.length} existing tags, or create new ones. Separate with commas.`
              : `💡 Start typing or click chips above to add tags. Use them to categorize encounters for easy filtering later. ${suggestedTags.length} starter suggestions provided!`
            }
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

        {/* Payment Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData(f => ({...f, isPaid: e.target.checked}))}
                className="rounded"
              />
              <span className="font-medium">💰 Money Involved</span>
            </label>
          </div>

          {formData.isPaid && (
            <div className="space-y-3">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Direction</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 p-2 rounded border flex-1">
                    <input
                      type="radio"
                      value="given"
                      checked={formData.paymentType === 'given'}
                      onChange={(e) => setFormData(f => ({...f, paymentType: e.target.value as 'given' | 'received'}))}
                    />
                    <span>💸 I Paid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 p-2 rounded border flex-1">
                    <input
                      type="radio"
                      value="received"
                      checked={formData.paymentType === 'received'}
                      onChange={(e) => setFormData(f => ({...f, paymentType: e.target.value as 'given' | 'received'}))}
                    />
                    <span>💵 I Got Paid</span>
                  </label>
                </div>
              </div>

              {/* Amount Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.paymentType === 'given' ? 'Amount Asked' : 'Amount I Asked For'}
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(f => ({...f, currency: e.target.value}))}
                      className="w-20 p-2 border rounded-l bg-white dark:bg-gray-700 border-r-0"
                    >
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                      <option value="GBP">£</option>
                      <option value="CAD">C$</option>
                      <option value="AUD">A$</option>
                    </select>
                    <input
                      type="number"
                      value={formData.amountAsked}
                      onChange={(e) => setFormData(f => ({...f, amountAsked: e.target.value}))}
                      className="flex-1 p-2 border rounded-r bg-white dark:bg-gray-700"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.paymentType === 'given' ? 'Amount Actually Paid' : 'Amount Actually Received'}
                  </label>
                  <div className="flex">
                    <div className="w-20 p-2 border rounded-l bg-gray-100 dark:bg-gray-600 border-r-0 flex items-center justify-center text-gray-600 dark:text-gray-300">
                      {formData.currency === 'USD' ? '$' : 
                       formData.currency === 'EUR' ? '€' :
                       formData.currency === 'GBP' ? '£' :
                       formData.currency === 'CAD' ? 'C$' :
                       formData.currency === 'AUD' ? 'A$' : '$'}
                    </div>
                    <input
                      type="number"
                      value={formData.amountGiven}
                      onChange={(e) => setFormData(f => ({...f, amountGiven: e.target.value}))}
                      className="flex-1 p-2 border rounded-r bg-white dark:bg-gray-700"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(f => ({...f, paymentMethod: e.target.value as 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other'}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="venmo">📱 Venmo</option>
                  <option value="cashapp">💚 Cash App</option>
                  <option value="paypal">🅿️ PayPal</option>
                  <option value="zelle">⚡ Zelle</option>
                  <option value="crypto">₿ Crypto</option>
                  <option value="gift">🎁 Gift/Items</option>
                  <option value="other">🔄 Other</option>
                </select>
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Details</label>
                <textarea
                  value={formData.paymentNotes}
                  onChange={(e) => setFormData(f => ({...f, paymentNotes: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                  rows={2}
                  placeholder="Additional payment details, negotiations, etc..."
                />
              </div>
            </div>
          )}
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