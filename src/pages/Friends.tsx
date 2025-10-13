import { useActiveFriends, friendsApi, useEncountersByFriend } from '../hooks/useDatabase';
import { useState } from 'react';
import type { Friend } from '../db/schema';

interface FriendsProps {
  onNavigate: (page: string) => void;
}

const getInitialFormData = () => ({
  name: '',
  notes: '',
  avatarUrl: '',
  age: '',
  height: '',
  weight: '',
  bodyType: '',
  sexualRole: '',
  dickSize: '',
  sexualPreferences: '',
  relationship: '',
  livingDistance: '',
  socialMedia: {
    grindr: '',
    scruff: '',
    instagram: '',
    twitter: '',
    telegram: '',
    snapchat: '',
    whatsapp: '',
    phone: ''
  },
  pictures: [] as string[], // Array of image URLs or base64
  healthStatus: {
    hivStatus: '',
    lastTested: '',
    onPrep: false,
    stdHistory: ''
  },
  kinks: '',
  boundaries: '',
  meetupPreference: '',
  isVerified: false
});

export default function Friends({ onNavigate }: FriendsProps) {
  const friends = useActiveFriends();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [formData, setFormData] = useState(getInitialFormData);

  const selectedFriendEncounters = useEncountersByFriend(selectedFriend?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await friendsApi.create({
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
        avatarUrl: formData.avatarUrl.trim() || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        height: formData.height.trim() || undefined,
        weight: formData.weight.trim() || undefined,
        bodyType: formData.bodyType as any || undefined,
        sexualRole: formData.sexualRole as any || undefined,
        dickSize: formData.dickSize.trim() || undefined,
        preferences: formData.sexualPreferences ? formData.sexualPreferences.split(',').map(p => p.trim()) : undefined,
        relationshipStatus: formData.relationship as any || undefined,
        location: formData.livingDistance.trim() || undefined,
        socialProfiles: {
          grindr: formData.socialMedia.grindr.trim() || undefined,
          instagram: formData.socialMedia.instagram.trim() || undefined,
          twitter: formData.socialMedia.twitter.trim() || undefined,
          telegram: formData.socialMedia.telegram.trim() || undefined,
          whatsapp: formData.socialMedia.whatsapp.trim() || undefined,
          phone: formData.socialMedia.phone.trim() || undefined
        },
        photos: formData.pictures.length > 0 ? formData.pictures : undefined,
        hivStatus: formData.healthStatus.hivStatus as any || undefined,
        lastTested: formData.healthStatus.lastTested ? new Date(formData.healthStatus.lastTested) : undefined,
        onPrep: formData.healthStatus.onPrep,
        limits: formData.boundaries ? formData.boundaries.split(',').map(b => b.trim()) : undefined
      });
      
      setFormData(getInitialFormData());
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleArchive = async (id: number) => {
    if (confirm('Archive this friend? They will be hidden from the main list.')) {
      try {
        await friendsApi.archive(id);
        setSelectedFriend(null);
      } catch (error) {
        console.error('Error archiving friend:', error);
      }
    }
  };

  if (selectedFriend) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setSelectedFriend(null)}
            className="mr-3 text-primary"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold">Friend Details</h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              {selectedFriend.avatarUrl ? (
                <img
                  src={selectedFriend.avatarUrl}
                  alt={selectedFriend.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl">
                  {selectedFriend.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{selectedFriend.name}</h3>
              <p className="text-gray-500 text-sm">
                Added {new Date(selectedFriend.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleArchive(selectedFriend.id!)}
              className="text-red-500 text-sm"
            >
              Archive
            </button>
          </div>

          {selectedFriend.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-sm">{selectedFriend.notes}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">
              Encounters ({selectedFriendEncounters.length})
            </h3>
            <button
              onClick={() => onNavigate('add')}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2">
            {selectedFriendEncounters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No encounters yet</p>
                <button
                  onClick={() => onNavigate('add')}
                  className="text-primary mt-2"
                >
                  Log your first encounter →
                </button>
              </div>
            ) : (
              selectedFriendEncounters.map(encounter => (
                <div
                  key={encounter.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {new Date(encounter.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {encounter.beneficiary} benefited
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg">
                        {'⭐'.repeat(encounter.rating)}
                      </div>
                      {encounter.durationMinutes && (
                        <div className="text-xs text-gray-500">
                          {encounter.durationMinutes}m
                        </div>
                      )}
                    </div>
                  </div>
                  {encounter.notes && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {encounter.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Friends</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          + Add Friend
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border">
          <h3 className="font-semibold mb-3">Add New Friend</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Basic Info</h4>
              
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({...f, name: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Friend's name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(f => ({...f, age: e.target.value}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="25"
                    min="18"
                    max="99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData(f => ({...f, height: e.target.value}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="5'10&quot; or 180cm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData(f => ({...f, weight: e.target.value}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="150 lbs"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Body Type</label>
                  <select
                    value={formData.bodyType}
                    onChange={(e) => setFormData(f => ({...f, bodyType: e.target.value}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select...</option>
                    <option value="Slim">Slim</option>
                    <option value="Athletic">Athletic</option>
                    <option value="Average">Average</option>
                    <option value="Muscular">Muscular</option>
                    <option value="Chubby">Chubby</option>
                    <option value="Bear">Bear</option>
                    <option value="Daddy">Daddy</option>
                    <option value="Twink">Twink</option>
                    <option value="Otter">Otter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sexual Info */}
            <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Sexual Details</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Sexual Role</label>
                  <select
                    value={formData.sexualRole}
                    onChange={(e) => setFormData(f => ({...f, sexualRole: e.target.value}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select...</option>
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Versatile">Versatile</option>
                    <option value="Vers Top">Vers Top</option>
                    <option value="Vers Bottom">Vers Bottom</option>
                    <option value="Side">Side</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Dick Size</label>
                  <input
                    type="text"
                    value={formData.dickSize}
                    onChange={(e) => setFormData(f => ({...f, dickSize: e.target.value}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="6 inches"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sexual Preferences</label>
                <input
                  type="text"
                  value={formData.sexualPreferences}
                  onChange={(e) => setFormData(f => ({...f, sexualPreferences: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Oral, Anal, Kinky (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Boundaries/Limits</label>
                <input
                  type="text"
                  value={formData.boundaries}
                  onChange={(e) => setFormData(f => ({...f, boundaries: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="No bareback, No pain (comma separated)"
                />
              </div>
            </div>

            {/* Health & Safety */}
            <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Health & Safety</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">HIV Status</label>
                  <select
                    value={formData.healthStatus.hivStatus}
                    onChange={(e) => setFormData(f => ({...f, healthStatus: {...f.healthStatus, hivStatus: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select...</option>
                    <option value="Negative">Negative</option>
                    <option value="Positive Undetectable">Positive Undetectable</option>
                    <option value="Positive">Positive</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Prefer Not to Say">Prefer Not to Say</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Last Tested</label>
                  <input
                    type="date"
                    value={formData.healthStatus.lastTested}
                    onChange={(e) => setFormData(f => ({...f, healthStatus: {...f.healthStatus, lastTested: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="onPrep"
                  checked={formData.healthStatus.onPrep}
                  onChange={(e) => setFormData(f => ({...f, healthStatus: {...f.healthStatus, onPrep: e.target.checked}}))}
                  className="rounded"
                />
                <label htmlFor="onPrep" className="text-sm font-medium">On PrEP</label>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Social Media</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Grindr</label>
                  <input
                    type="text"
                    value={formData.socialMedia.grindr}
                    onChange={(e) => setFormData(f => ({...f, socialMedia: {...f.socialMedia, grindr: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Username or profile link"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData(f => ({...f, socialMedia: {...f.socialMedia, instagram: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.socialMedia.whatsapp}
                    onChange={(e) => setFormData(f => ({...f, socialMedia: {...f.socialMedia, whatsapp: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">X (Twitter)</label>
                  <input
                    type="text"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => setFormData(f => ({...f, socialMedia: {...f.socialMedia, twitter: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telegram</label>
                  <input
                    type="text"
                    value={formData.socialMedia.telegram}
                    onChange={(e) => setFormData(f => ({...f, socialMedia: {...f.socialMedia, telegram: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.socialMedia.phone}
                    onChange={(e) => setFormData(f => ({...f, socialMedia: {...f.socialMedia, phone: e.target.value}}))}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Pictures */}
            <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Pictures</h4>
              
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
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {formData.pictures.map((picture, index) => (
                      <div key={index} className="relative">
                        <img
                          src={picture}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
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
              
              <div className="text-xs text-gray-500">
                Max 5MB per photo. Photos are stored locally in your browser.
              </div>
            </div>

            {/* Other Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Other Details</h4>
              
              <div>
                <label className="block text-sm font-medium mb-1">Relationship Status</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData(f => ({...f, relationship: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Taken">Taken</option>
                  <option value="Open Relationship">Open Relationship</option>
                  <option value="Married">Married</option>
                  <option value="Complicated">Complicated</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location/Distance</label>
                <input
                  type="text"
                  value={formData.livingDistance}
                  onChange={(e) => setFormData(f => ({...f, livingDistance: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="2 miles away, Downtown, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Profile Picture</label>
                
                {/* Avatar Actions */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
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
                          setFormData(f => ({...f, avatarUrl: result}));
                        };
                        reader.readAsDataURL(file);
                      };
                      input.click();
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    📷 Choose Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.capture = 'user'; // Use front camera for profile pic
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
                          setFormData(f => ({...f, avatarUrl: result}));
                        };
                        reader.readAsDataURL(file);
                      };
                      input.click();
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    🤳 Take Selfie
                  </button>

                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({...f, avatarUrl: ''}))}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                {/* Avatar Preview */}
                {formData.avatarUrl && (
                  <div className="mb-2">
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
                
                {/* Fallback URL input */}
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">Or enter URL manually</summary>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData(f => ({...f, avatarUrl: e.target.value}))}
                    className="w-full p-1 mt-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-xs"
                    placeholder="https://..."
                  />
                </details>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(f => ({...f, notes: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-2 rounded font-medium"
              >
                Add Friend
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData(getInitialFormData());
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No friends added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-primary mt-2"
            >
              Add your first friend →
            </button>
          </div>
        ) : (
          friends.map(friend => (
            <div
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg">
                    {friend.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{friend.name}</div>
                <div className="text-sm text-gray-500">
                  Added {new Date(friend.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-gray-400">→</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}