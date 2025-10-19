import { useActiveFriends, friendsApi, useEncountersByFriend } from '../hooks/useDatabase';
import { useState, useMemo } from 'react';
import type { Friend } from '../db/schema';
import { GAY_ACTIVITIES } from '../db/schema';
import StarRating from '../components/StarRating';
import { showBackupPrompt, triggerAutoAzureBackup, shouldShowBackupPrompt } from '../utils/backup';


interface FriendsProps {
  onNavigate: (page: string) => void;
  showAddFormInitially?: boolean;
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

export default function Friends({ onNavigate, showAddFormInitially = false }: FriendsProps) {
  const friends = useActiveFriends();
  const [showAddForm, setShowAddForm] = useState(showAddFormInitially);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [formData, setFormData] = useState(getInitialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    ageRange: { min: 18, max: 80 },
    bodyType: 'all',
    sexualRole: 'all',
    hivStatus: 'all',
    onPrep: 'all', // 'all', 'yes', 'no'
    showWithNotes: 'all', // 'all', 'with', 'without'
    showWithPhotos: 'all', // 'all', 'with', 'without'
    relationshipStatus: 'all',
    livingDistance: 'all',
    socialMediaFilter: 'all', // 'all', 'with', 'without'
    lastEncounterDays: 0 // 0 = all, 7 = last week, 30 = last month, etc.
  });

  const selectedFriendEncounters = useEncountersByFriend(selectedFriend?.id);

  // Apply filters to friends
  const filteredFriends = useMemo(() => {
    return friends.filter(friend => {
      // Search filter
      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = friend.name.toLowerCase().includes(searchLower);
        const notesMatch = friend.notes?.toLowerCase().includes(searchLower);
        if (!nameMatch && !notesMatch) return false;
      }

      // Age filter
      if (friend.age !== undefined) {
        if (friend.age < filters.ageRange.min || friend.age > filters.ageRange.max) {
          return false;
        }
      } else if (filters.ageRange.min > 18 || filters.ageRange.max < 80) {
        // If age range is set but friend has no age, filter out
        return false;
      }

      // Body type filter
      if (filters.bodyType !== 'all' && friend.bodyType !== filters.bodyType) {
        return false;
      }

      // Sexual role filter
      if (filters.sexualRole !== 'all' && friend.sexualRole !== filters.sexualRole) {
        return false;
      }

      // HIV status filter
      if (filters.hivStatus !== 'all' && friend.hivStatus !== filters.hivStatus) {
        return false;
      }

      // PrEP filter
      if (filters.onPrep !== 'all') {
        const isOnPrep = friend.onPrep === true;
        if (filters.onPrep === 'yes' && !isOnPrep) return false;
        if (filters.onPrep === 'no' && isOnPrep) return false;
      }

      // Notes filter
      if (filters.showWithNotes !== 'all') {
        const hasNotes = !!friend.notes?.trim();
        if (filters.showWithNotes === 'with' && !hasNotes) return false;
        if (filters.showWithNotes === 'without' && hasNotes) return false;
      }

      // Photos filter
      if (filters.showWithPhotos !== 'all') {
        const hasPhotos = !!(friend.avatarUrl?.trim() || (friend.photos && friend.photos.length > 0));
        if (filters.showWithPhotos === 'with' && !hasPhotos) return false;
        if (filters.showWithPhotos === 'without' && hasPhotos) return false;
      }

      // Relationship status filter
      if (filters.relationshipStatus !== 'all' && friend.relationshipStatus !== filters.relationshipStatus) {
        return false;
      }

      // Living distance filter
      if (filters.livingDistance !== 'all' && friend.location !== filters.livingDistance) {
        return false;
      }

      // Social media filter
      if (filters.socialMediaFilter !== 'all') {
        const hasSocialMedia = !!(friend.socialProfiles && Object.values(friend.socialProfiles).some(profile => profile?.trim()));
        if (filters.socialMediaFilter === 'with' && !hasSocialMedia) return false;
        if (filters.socialMediaFilter === 'without' && hasSocialMedia) return false;
      }

      // Last encounter filter (would need encounter data to implement fully)
      // For now, just a placeholder
      if (filters.lastEncounterDays > 0) {
        // TODO: Implement last encounter filtering if needed
        // This would require cross-referencing with encounter data
      }

      return true;
    });
  }, [friends, filters]);

  // Pagination logic
  const totalItems = filteredFriends.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFriends = filteredFriends.slice(startIndex, endIndex);

  const handleEdit = (friend: Friend) => {
    // Populate form with existing friend data
    setFormData({
      name: friend.name || '',
      notes: friend.notes || '',
      avatarUrl: friend.avatarUrl || '',
      age: friend.age?.toString() || '',
      height: friend.height || '',
      weight: friend.weight || '',
      bodyType: friend.bodyType || '',
      sexualRole: friend.sexualRole || '',
      dickSize: friend.dickSize || '',
      sexualPreferences: friend.preferences?.join(', ') || '',
      relationship: friend.relationshipStatus || '',
      livingDistance: friend.location || '',
      socialMedia: {
        grindr: friend.socialProfiles?.grindr || '',
        scruff: '', // Not in schema, keeping empty
        instagram: friend.socialProfiles?.instagram || '',
        twitter: friend.socialProfiles?.twitter || '',
        telegram: friend.socialProfiles?.telegram || '',
        snapchat: '', // Not in schema, keeping empty
        whatsapp: friend.socialProfiles?.whatsapp || '',
        phone: friend.socialProfiles?.phone || ''
      },
      pictures: friend.photos || [],
      healthStatus: {
        hivStatus: friend.hivStatus || '',
        lastTested: friend.lastTested ? new Date(friend.lastTested).toISOString().slice(0, 10) : '',
        onPrep: friend.onPrep || false,
        stdHistory: '' // This field might not exist in the schema, keeping for consistency
      },
      kinks: '', // This field might not exist in the schema
      boundaries: friend.limits?.join(', ') || '',
      meetupPreference: '', // This field might not exist in the schema
      isVerified: false // This field might not exist in the schema
    });
    setEditingFriend(friend);
    setSelectedFriend(null); // Hide detail view
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingFriend) {
        // Update existing friend
        await friendsApi.update(editingFriend.id!, {
          name: formData.name.trim(),
          notes: formData.notes.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          height: formData.height.trim() || undefined,
          weight: formData.weight.trim() || undefined,
          bodyType: (formData.bodyType as 'Slim' | 'Athletic' | 'Average' | 'Muscular' | 'Chubby' | 'Bear' | 'Daddy' | 'Twink' | 'Otter' | 'Other') || undefined,
          sexualRole: (formData.sexualRole as 'Top' | 'Bottom' | 'Versatile' | 'Vers Top' | 'Vers Bottom' | 'Side' | 'Unknown') || undefined,
          dickSize: formData.dickSize.trim() || undefined,
          preferences: formData.sexualPreferences ? formData.sexualPreferences.split(',').map(p => p.trim()) : undefined,
          relationshipStatus: (formData.relationship as 'Single' | 'Taken' | 'Open Relationship' | 'Married' | 'Complicated' | 'Unknown') || undefined,
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
          hivStatus: (formData.healthStatus.hivStatus as 'Negative' | 'Positive Undetectable' | 'Positive' | 'Unknown' | 'Prefer Not to Say') || undefined,
          lastTested: formData.healthStatus.lastTested ? new Date(formData.healthStatus.lastTested) : undefined,
          onPrep: formData.healthStatus.onPrep,
          limits: formData.boundaries ? formData.boundaries.split(',').map(b => b.trim()) : undefined,
          updatedAt: new Date()
        });
        
        setEditingFriend(null);
      } else {
        // Create new friend
        await friendsApi.create({
          name: formData.name.trim(),
          notes: formData.notes.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          height: formData.height.trim() || undefined,
          weight: formData.weight.trim() || undefined,
          bodyType: (formData.bodyType as 'Slim' | 'Athletic' | 'Average' | 'Muscular' | 'Chubby' | 'Bear' | 'Daddy' | 'Twink' | 'Otter' | 'Other') || undefined,
          sexualRole: (formData.sexualRole as 'Top' | 'Bottom' | 'Versatile' | 'Vers Top' | 'Vers Bottom' | 'Side' | 'Unknown') || undefined,
          dickSize: formData.dickSize.trim() || undefined,
          preferences: formData.sexualPreferences ? formData.sexualPreferences.split(',').map(p => p.trim()) : undefined,
          relationshipStatus: (formData.relationship as 'Single' | 'Taken' | 'Open Relationship' | 'Married' | 'Complicated' | 'Unknown') || undefined,
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
          hivStatus: (formData.healthStatus.hivStatus as 'Negative' | 'Positive Undetectable' | 'Positive' | 'Unknown' | 'Prefer Not to Say') || undefined,
          lastTested: formData.healthStatus.lastTested ? new Date(formData.healthStatus.lastTested) : undefined,
          onPrep: formData.healthStatus.onPrep,
          limits: formData.boundaries ? formData.boundaries.split(',').map(b => b.trim()) : undefined
        });
        
        setShowAddForm(false);
      }
      
      setFormData(getInitialFormData());
      
      // Trigger automatic Azure backup (async, non-blocking)
      triggerAutoAzureBackup().catch(err => 
        console.warn('Auto Azure backup failed:', err)
      );
      
      // Show manual backup prompt only if auto backup is not enabled
      if (shouldShowBackupPrompt()) {
        setTimeout(() => {
          showBackupPrompt();
        }, 100);
      }
    } catch (error) {
      console.error('Error saving friend:', error);
      alert('Failed to save friend. Please try again.');
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
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(selectedFriend)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
              >
                <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleArchive(selectedFriend.id!)}
                className="text-red-500 text-sm hover:text-red-600 transition-colors"
              >
                🗄️ Archive
              </button>
            </div>
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
              <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
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
                      <div className="mb-1">
                        <StarRating rating={encounter.rating} size="md" />
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
    <div className="p-4 space-y-6 min-h-screen relative">
      <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">Friends</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your connections</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-xl font-medium text-sm border border-green-200/50 dark:border-green-700/30 transition-all duration-200 hover:shadow-md flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Add Friend
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 dark:border-gray-700/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">Friend Filters</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find exactly who you're looking for</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 border ${
              showAdvancedFilters 
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/30 shadow-md' 
                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/30 hover:bg-gray-100 dark:hover:bg-gray-600/50 hover:shadow-sm'
            }`}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search bar always visible */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search friends by name or notes..."
            value={filters.search}
            onChange={(e) => {
              setFilters(f => ({...f, search: e.target.value}));
              setCurrentPage(1);
            }}
            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {showAdvancedFilters && (
          <div className="space-y-6">
            {/* Age Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Age Range: {filters.ageRange.min}-{filters.ageRange.max} years
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={filters.ageRange.min}
                  onChange={(e) => setFilters(f => ({...f, ageRange: {...f.ageRange, min: Number(e.target.value)}}))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={filters.ageRange.max}
                  onChange={(e) => setFilters(f => ({...f, ageRange: {...f.ageRange, max: Number(e.target.value)}}))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Physical Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Body Type</label>
                <select
                  value={filters.bodyType}
                  onChange={(e) => setFilters(f => ({...f, bodyType: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All Body Types</option>
                  <option value="slim">Slim</option>
                  <option value="athletic">Athletic</option>
                  <option value="average">Average</option>
                  <option value="muscular">Muscular</option>
                  <option value="stocky">Stocky</option>
                  <option value="bear">Bear</option>
                  <option value="chubby">Chubby</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Sexual Role</label>
                <select
                  value={filters.sexualRole}
                  onChange={(e) => setFilters(f => ({...f, sexualRole: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="versatile">Versatile</option>
                  <option value="side">Side</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Relationship Status</label>
                <select
                  value={filters.relationshipStatus}
                  onChange={(e) => setFilters(f => ({...f, relationshipStatus: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="single">Single</option>
                  <option value="taken">Taken</option>
                  <option value="open">Open Relationship</option>
                  <option value="married">Married</option>
                  <option value="complicated">It's Complicated</option>
                </select>
              </div>
            </div>

            {/* Health Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">HIV Status</label>
                <select
                  value={filters.hivStatus}
                  onChange={(e) => setFilters(f => ({...f, hivStatus: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="negative">Negative</option>
                  <option value="positive">Positive</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">On PrEP</label>
                <select
                  value={filters.onPrep}
                  onChange={(e) => setFilters(f => ({...f, onPrep: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="yes">On PrEP</option>
                  <option value="no">Not on PrEP</option>
                </select>
              </div>
            </div>

            {/* Content Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Notes</label>
                <select
                  value={filters.showWithNotes}
                  onChange={(e) => setFilters(f => ({...f, showWithNotes: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="with">With Notes</option>
                  <option value="without">No Notes</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Photos</label>
                <select
                  value={filters.showWithPhotos}
                  onChange={(e) => setFilters(f => ({...f, showWithPhotos: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="with">With Photos</option>
                  <option value="without">No Photos</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Social Media</label>
                <select
                  value={filters.socialMediaFilter}
                  onChange={(e) => setFilters(f => ({...f, socialMediaFilter: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="with">With Social Media</option>
                  <option value="without">No Social Media</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Last Encounter</label>
                <select
                  value={filters.lastEncounterDays}
                  onChange={(e) => setFilters(f => ({...f, lastEncounterDays: Number(e.target.value)}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value={0}>All Time</option>
                  <option value={7}>Last Week</option>
                  <option value={30}>Last Month</option>
                  <option value={90}>Last 3 Months</option>
                  <option value={365}>Last Year</option>
                </select>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    ageRange: { min: 18, max: 80 },
                    bodyType: 'all',
                    sexualRole: 'all',
                    hivStatus: 'all',
                    onPrep: 'all',
                    showWithNotes: 'all',
                    showWithPhotos: 'all',
                    relationshipStatus: 'all',
                    livingDistance: 'all',
                    socialMediaFilter: 'all',
                    lastEncounterDays: 0
                  });
                  setCurrentPage(1);
                }}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {(showAddForm || editingFriend) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border">
          <h3 className="font-semibold mb-3">
            {editingFriend ? `Edit ${editingFriend.name}` : 'Add New Friend'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">{/* Scrollable form content */}
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
                <div className="border rounded bg-white dark:bg-gray-700 dark:border-gray-600 p-3">
                  {/* Search within preferences */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="🔍 Search activities..."
                      className="w-full p-2 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const checkboxes = document.querySelectorAll('.preference-checkbox');
                        checkboxes.forEach((checkbox) => {
                          const label = checkbox.parentElement;
                          const text = label?.textContent?.toLowerCase() || '';
                          const shouldShow = searchTerm === '' || text.includes(searchTerm);
                          if (label) {
                            (label as HTMLElement).style.display = shouldShow ? 'flex' : 'none';
                          }
                        });
                      }}
                    />
                  </div>
                  
                  {/* Full activities list in scrollable container */}
                  <div className="max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-600 rounded p-2">
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {GAY_ACTIVITIES.map(activity => {
                        const isSelected = formData.sexualPreferences.split(', ').filter(p => p.trim()).includes(activity.name);
                        return (
                          <label key={activity.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                            <input
                              type="checkbox"
                              className="preference-checkbox w-3 h-3 flex-shrink-0"
                              checked={isSelected}
                              onChange={(e) => {
                                const preferences = formData.sexualPreferences.split(', ').filter(p => p.trim());
                                if (e.target.checked) {
                                  preferences.push(activity.name);
                                } else {
                                  const index = preferences.indexOf(activity.name);
                                  if (index > -1) preferences.splice(index, 1);
                                }
                                setFormData(f => ({...f, sexualPreferences: preferences.join(', ')}));
                              }}
                            />
                            <span className="text-xs flex-1" style={{ color: activity.color }}>
                              {activity.icon} {activity.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Quick action buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({...f, sexualPreferences: ''}))}
                      className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-700 dark:text-red-300 rounded"
                    >
                      Clear All
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const commonTopActivities = [
                          'Anal (Topping)', 'Oral (Receiving)', 'Rimming (Receiving)', 'Handjob (Receiving)',
                          'Kissing/Making Out', 'Body Contact/Massage', 'Cock Worship', 'Face Fucking',
                          'Spanking (Giving)', 'Service Top', 'Deep Throat', 'Muscle Worship'
                        ];
                        setFormData(f => ({...f, sexualPreferences: commonTopActivities.join(', ')}));
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded"
                    >
                      🔝 Common for Tops
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const commonBottomActivities = [
                          'Anal (Bottoming)', 'Oral (Giving)', 'Rimming (Giving)', 'Handjob (Giving)',
                          'Kissing/Making Out', 'Body Contact/Massage', 'Ass Worship', 'Power Bottom',
                          'Spanking (Receiving)', 'Prostate Massage', 'Body Worship', 'Fingering'
                        ];
                        setFormData(f => ({...f, sexualPreferences: commonBottomActivities.join(', ')}));
                      }}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-700 dark:text-green-300 rounded"
                    >
                      🔻 Common for Bottoms
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const versActivities = [
                          'Anal (Topping)', 'Anal (Bottoming)', 'Oral (Giving)', 'Oral (Receiving)', 
                          'Kissing/Making Out', 'Mutual Masturbation', 'Rimming (Giving)', 'Rimming (Receiving)',
                          'Body Contact/Massage', 'Handjob (Giving)', 'Handjob (Receiving)', '69', 'Flip Fucking'
                        ];
                        setFormData(f => ({...f, sexualPreferences: versActivities.join(', ')}));
                      }}
                      className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-300 rounded"
                    >
                      ↕️ Versatile Common
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const kinkActivities = [
                          'BDSM Dom', 'BDSM Sub', 'Bondage', 'Spanking (Giving)', 'Spanking (Receiving)',
                          'Leather/Fetish', 'Role Play', 'Rough/Aggressive', 'Power Bottom', 'Daddy/Son Play'
                        ];
                        const current = formData.sexualPreferences.split(', ').filter(p => p.trim());
                        const combined = [...new Set([...current, ...kinkActivities])];
                        setFormData(f => ({...f, sexualPreferences: combined.join(', ')}));
                      }}
                      className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded"
                    >
                      ⛓️ + Kink
                    </button>
                  </div>
                  
                  {/* Selected count and preview */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        {formData.sexualPreferences.split(', ').filter(p => p.trim()).length} selected
                      </span>
                      {formData.sexualPreferences && (
                        <div className="mt-1 text-gray-500 dark:text-gray-500 max-h-16 overflow-y-auto">
                          {formData.sexualPreferences}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </button>

                {formData.pictures.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({...f, pictures: []}))}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
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
                      <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
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
            {/* Close scrollable container */}
            </div>

            {/* Buttons outside scrollable area */}
            <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-2 rounded font-medium"
              >
                {editingFriend ? 'Save Changes' : 'Add Friend'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFriend(null);
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
          paginatedFriends.map(friend => (
            <div
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/30 dark:border-gray-700/30 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Card content */}
              <div className="relative z-10 flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white/50 dark:border-gray-600/50 shadow-md"
                      />
                    ) : (
                      <span className="text-xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                    {friend.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    Added {new Date(friend.createdAt).toLocaleDateString()}
                  </div>
                  {friend.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                      {friend.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-2xl text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/30 dark:border-gray-700/30">
            <div className="flex flex-col items-center space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} friends
              </div>
              
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 rounded-lg font-medium transition-all duration-300 ${
                    currentPage === 1 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  ←
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 rounded-lg font-medium transition-all duration-300 ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}