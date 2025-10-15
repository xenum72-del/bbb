import { useEncounters, useActiveFriends, useInteractionTypes, encountersApi } from '../hooks/useDatabase';
import { useState, useMemo, useEffect } from 'react';
import MapViewLeaflet from '../components/MapViewLeaflet';
import StarRating from '../components/StarRating';

interface TimelineProps {
  onNavigate: (page: string) => void;
}

export default function Timeline({ onNavigate }: TimelineProps) {
  const allEncounters = useEncounters();
  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();

  const handleDeleteEncounter = async (encounterId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this encounter? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        await encountersApi.delete(encounterId);
      } catch (error) {
        console.error('Failed to delete encounter:', error);
        alert('Failed to delete encounter. Please try again.');
      }
    }
  };
  
  const [filters, setFilters] = useState({
    rating: [1, 5] as [number, number],
    beneficiary: 'all',
    participant: 'all',
    typeId: 'all',
    showAnonymous: true,
    tags: '',
    showPaidOnly: false,
    dateRange: {
      start: '',
      end: ''
    },
    duration: {
      min: 0,
      max: 1000
    },
    paymentAmount: {
      min: 0,
      max: 10000
    },
    location: '',
    showWithLocation: 'all', // 'all', 'with', 'without'
    showWithNotes: 'all', // 'all', 'with', 'without'
    paymentType: 'all' // 'all', 'given', 'received'
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [showMapView, setShowMapView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  const friendsMap = useMemo(() => new Map(friends.map(f => [f.id!, f])), [friends]);
  const typesMap = useMemo(() => new Map(interactionTypes.map(t => [t.id!, t])), [interactionTypes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredEncounters = useMemo(() => allEncounters.filter(encounter => {
    // Rating filter
    if (encounter.rating < filters.rating[0] || encounter.rating > filters.rating[1]) {
      return false;
    }
    
    // Beneficiary filter
    if (filters.beneficiary !== 'all') {
      if (encounter.beneficiary !== filters.beneficiary && encounter.beneficiary !== 'both') {
        return false;
      }
    }

    // Participant filter
    if (filters.participant !== 'all') {
      if (!encounter.participants.includes(Number(filters.participant))) {
        return false;
      }
    }

    // Activity type filter
    if (filters.typeId !== 'all') {
      const targetTypeId = Number(filters.typeId);
      const hasActivity = encounter.activitiesPerformed 
        ? encounter.activitiesPerformed.includes(targetTypeId)
        : encounter.typeId === targetTypeId;
      if (!hasActivity) return false;
    }

    // Anonymous filter
    if (!filters.showAnonymous && encounter.isAnonymous) {
      return false;
    }

    // Tags filter
    if (filters.tags.trim()) {
      const searchTags = filters.tags.toLowerCase().trim().split(/[,\s]+/).filter(tag => tag);
      const encounterTags = encounter.tags || [];
      const hasMatchingTag = searchTags.some(searchTag => 
        encounterTags.some(encounterTag => 
          encounterTag.toLowerCase().includes(searchTag)
        )
      );
      if (!hasMatchingTag) return false;
    }

    // Paid encounters filter
    if (filters.showPaidOnly && !encounter.isPaid) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const encounterDate = new Date(encounter.date);
      if (filters.dateRange.start && encounterDate < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && encounterDate > new Date(filters.dateRange.end + 'T23:59:59')) {
        return false;
      }
    }

    // Duration filter
    if (encounter.durationMinutes !== undefined) {
      if (encounter.durationMinutes < filters.duration.min || encounter.durationMinutes > filters.duration.max) {
        return false;
      }
    } else if (filters.duration.min > 0) {
      // If min duration is set but encounter has no duration, filter it out
      return false;
    }

    // Payment amount filter
    if (encounter.isPaid && filters.paymentAmount.min > 0) {
      const amount = encounter.amountGivenUSD || encounter.amountGiven || 0;
      if (amount < filters.paymentAmount.min || amount > filters.paymentAmount.max) {
        return false;
      }
    }

    // Location filter
    if (filters.location.trim()) {
      const locationText = encounter.location?.place || '';
      if (!locationText.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Show with location filter
    if (filters.showWithLocation !== 'all') {
      const hasLocation = !!encounter.location;
      if (filters.showWithLocation === 'with' && !hasLocation) return false;
      if (filters.showWithLocation === 'without' && hasLocation) return false;
    }

    // Show with notes filter
    if (filters.showWithNotes !== 'all') {
      const hasNotes = !!encounter.notes?.trim();
      if (filters.showWithNotes === 'with' && !hasNotes) return false;
      if (filters.showWithNotes === 'without' && hasNotes) return false;
    }

    // Payment type filter
    if (filters.paymentType !== 'all' && encounter.isPaid) {
      if (encounter.paymentType !== filters.paymentType) {
        return false;
      }
    }

    return true;
  }), [allEncounters, filters]);

  const { paginatedData: groupedByDate, totalPages, totalItems } = useMemo(() => {
    // First, get all encounters and group by date
    const grouped = filteredEncounters.reduce((acc, encounter) => {
      const date = new Date(encounter.date).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(encounter);
      return acc;
    }, {} as Record<string, typeof filteredEncounters>);

    // Convert to array of [date, encounters] pairs and sort by date (newest first)
    const sortedEntries = Object.entries(grouped).sort(([dateA], [dateB]) => {
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Flatten encounters for pagination
    const allEncounters = sortedEntries.flatMap(([date, encounters]) => 
      encounters.map(encounter => ({ ...encounter, dateGroup: date }))
    );

    // Calculate pagination
    const totalItems = allEncounters.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedEncounters = allEncounters.slice(startIndex, endIndex);

    // Re-group paginated encounters by date
    const paginatedGrouped = paginatedEncounters.reduce((acc, encounter) => {
      const date = encounter.dateGroup!;
      if (!acc[date]) acc[date] = [];
      acc[date].push(encounter);
      return acc;
    }, {} as Record<string, typeof filteredEncounters>);

    return {
      paginatedData: paginatedGrouped,
      totalPages,
      totalItems
    };
  }, [filteredEncounters, currentPage, ITEMS_PER_PAGE]);

  return (
    <div className="p-4 space-y-6 min-h-screen relative">
      <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">Timeline</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your encounter history</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowMapView(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Map</span>
          </button>
          <button
            onClick={() => onNavigate('add')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add</span>
          </button>
        </div>
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
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">Advanced Filters</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fine-tune your encounter search</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              showAdvancedFilters 
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="space-y-6">
            {/* Quick Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rating Range</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{filters.rating[0]}★</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={filters.rating[0]}
                      onChange={(e) => setFilters(f => ({...f, rating: [Number(e.target.value), f.rating[1]]}))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500">{filters.rating[1]}★</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={filters.rating[1]}
                      onChange={(e) => setFilters(f => ({...f, rating: [f.rating[0], Number(e.target.value)]}))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Beneficiary</label>
                <select
                  value={filters.beneficiary}
                  onChange={(e) => setFilters(f => ({...f, beneficiary: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="me">Me</option>
                  <option value="friend">Friend</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Friend</label>
                <select
                  value={filters.participant}
                  onChange={(e) => setFilters(f => ({...f, participant: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All Friends</option>
                  {friends.map(friend => (
                    <option key={friend.id} value={friend.id}>
                      {friend.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Activity Type</label>
                <select
                  value={filters.typeId}
                  onChange={(e) => setFilters(f => ({...f, typeId: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All Types</option>
                  {interactionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Start Date</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(f => ({...f, dateRange: {...f.dateRange, start: e.target.value}}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">End Date</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(f => ({...f, dateRange: {...f.dateRange, end: e.target.value}}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                />
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Duration: {filters.duration.min}-{filters.duration.max} minutes
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={filters.duration.min}
                  onChange={(e) => setFilters(f => ({...f, duration: {...f.duration, min: Number(e.target.value)}}))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={filters.duration.max}
                  onChange={(e) => setFilters(f => ({...f, duration: {...f.duration, max: Number(e.target.value)}}))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Location and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Location Search</label>
                <input
                  type="text"
                  placeholder="Search location names..."
                  value={filters.location}
                  onChange={(e) => setFilters(f => ({...f, location: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tags</label>
                <input
                  type="text"
                  placeholder="🏷️ Search by tags..."
                  value={filters.tags}
                  onChange={(e) => setFilters(f => ({...f, tags: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                />
              </div>
            </div>

            {/* Payment Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Payment Type</label>
                <select
                  value={filters.paymentType}
                  onChange={(e) => setFilters(f => ({...f, paymentType: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="given">I Paid</option>
                  <option value="received">I Received</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Payment Amount: ${filters.paymentAmount.min}-${filters.paymentAmount.max}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="50"
                    value={filters.paymentAmount.min}
                    onChange={(e) => setFilters(f => ({...f, paymentAmount: {...f.paymentAmount, min: Number(e.target.value)}}))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="50"
                    value={filters.paymentAmount.max}
                    onChange={(e) => setFilters(f => ({...f, paymentAmount: {...f.paymentAmount, max: Number(e.target.value)}}))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showAnonymous}
                  onChange={(e) => setFilters(f => ({...f, showAnonymous: e.target.checked}))}
                  className="rounded text-blue-600"
                />
                <span className="text-sm font-medium">Anonymous</span>
              </label>

              <label className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showPaidOnly}
                  onChange={(e) => setFilters(f => ({...f, showPaidOnly: e.target.checked}))}
                  className="rounded text-green-600"
                />
                <span className="text-sm font-medium">Paid Only</span>
              </label>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">With Location</label>
                <select
                  value={filters.showWithLocation}
                  onChange={(e) => setFilters(f => ({...f, showWithLocation: e.target.value}))}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 text-sm"
                >
                  <option value="all">All</option>
                  <option value="with">With Location</option>
                  <option value="without">No Location</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">With Notes</label>
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
            </div>

            {/* Reset Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setFilters({
                    rating: [1, 5],
                    beneficiary: 'all',
                    participant: 'all',
                    typeId: 'all',
                    showAnonymous: true,
                    tags: '',
                    showPaidOnly: false,
                    dateRange: { start: '', end: '' },
                    duration: { min: 0, max: 1000 },
                    paymentAmount: { min: 0, max: 10000 },
                    location: '',
                    showWithLocation: 'all',
                    showWithNotes: 'all',
                    paymentType: 'all'
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

      {/* Results */}
      <div className="space-y-4">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No encounters match your filters</p>
            <button
              onClick={() => {
                setFilters({
                  rating: [1, 5],
                  beneficiary: 'all',
                  participant: 'all',
                  typeId: 'all',
                  showAnonymous: true,
                  tags: '',
                  showPaidOnly: false,
                  dateRange: {
                    start: '',
                    end: ''
                  },
                  duration: {
                    min: 0,
                    max: 1000
                  },
                  paymentAmount: {
                    min: 0,
                    max: 10000
                  },
                  location: '',
                  showWithLocation: 'all',
                  showWithNotes: 'all',
                  paymentType: 'all'
                });
                setCurrentPage(1);
              }}
              className="text-primary mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(groupedByDate)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, encounters]) => (
              <div key={date}>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <div className="space-y-2">
                  {encounters.map(encounter => {
                    const type = typesMap.get(encounter.typeId);
                    const activities = encounter.activitiesPerformed 
                      ? encounter.activitiesPerformed.map(id => typesMap.get(id)).filter(Boolean)
                      : [type].filter(Boolean);
                    
                    // If no activities found, provide a fallback
                    const finalActivities = activities.length > 0 
                      ? activities 
                      : [{ name: 'Encounter', icon: '💭', color: '#9CA3AF' }];
                    
                    return (
                      <div
                        key={encounter.id}
                        className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 dark:border-gray-700/30 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 overflow-hidden"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Card content */}
                        <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            {finalActivities.length > 1 ? (
                              <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  {finalActivities.length} Activities:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {finalActivities.slice(0, 3).map((activity, idx) => (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                                    >
                                      <span>{activity?.icon}</span>
                                      <span>{activity?.name}</span>
                                    </span>
                                  ))}
                                  {finalActivities.length > 3 && (
                                    <span className="text-xs text-gray-500 px-2 py-1">
                                      +{finalActivities.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{finalActivities[0]?.icon || '💭'}</span>
                                <span className="font-medium">{finalActivities[0]?.name || 'Unknown'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (encounter.id) {
                                    onNavigate(`edit-encounter/${encounter.id}`);
                                  } else {
                                    alert('Cannot edit encounter: No ID found');
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Edit encounter"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleDeleteEncounter(encounter.id!, e)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Delete encounter"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <div className="text-right">
                              <StarRating rating={encounter.rating} size="md" />
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(encounter.date).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            <span className="font-medium">Participants: </span>
                            {encounter.isAnonymous ? (
                              <span className="italic">Anonymous</span>
                            ) : encounter.participants.length === 0 ? (
                              <span className="italic">Solo</span>
                            ) : (
                              encounter.participants
                                .map(id => friendsMap.get(id)?.name || 'Unknown')
                                .join(', ')
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Beneficiary: </span>
                            <span className="capitalize">{encounter.beneficiary}</span>
                          </div>
                          {encounter.durationMinutes && (
                            <div>
                              <span className="font-medium">Duration: </span>
                              {encounter.durationMinutes} minutes
                            </div>
                          )}
                          {encounter.location && (
                            <div>
                              <span className="font-medium">Location: </span>
                              {encounter.location.place || `${encounter.location.lat}, ${encounter.location.lon}`}
                            </div>
                          )}
                          {encounter.tags && encounter.tags.length > 0 && (
                            <div className="mt-2">
                              {encounter.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-block bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded mr-1"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {encounter.notes && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                              {encounter.notes}
                            </div>
                          )}
                          {encounter.isPaid && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="font-medium">
                                  {encounter.paymentType === 'given' ? 'Paid' : 'Received'} 
                                  {encounter.currency !== 'USD' && encounter.currency ? (
                                    <>
                                      {encounter.currency} {parseFloat(String(encounter.amountGiven || '0')).toFixed(2)}
                                      {encounter.amountGivenUSD && (
                                        <span className="text-xs ml-1">
                                          (${encounter.amountGivenUSD.toFixed(2)} USD)
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    `$${parseFloat(String(encounter.amountGiven || '0')).toFixed(2)}`
                                  )}
                                </span>
                                {encounter.paymentMethod && (
                                  <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded capitalize">
                                    {encounter.paymentMethod}
                                  </span>
                                )}
                              </div>
                              {encounter.amountAsked && parseFloat(String(encounter.amountAsked)) !== parseFloat(String(encounter.amountGiven || '0')) && (
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  Originally asked: 
                                  {encounter.currency !== 'USD' && encounter.currency ? (
                                    <>
                                      {encounter.currency} {parseFloat(String(encounter.amountAsked)).toFixed(2)}
                                      {encounter.amountAskedUSD && (
                                        <span className="ml-1">
                                          (${encounter.amountAskedUSD.toFixed(2)} USD)
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    ` $${parseFloat(String(encounter.amountAsked)).toFixed(2)}`
                                  )}
                                </div>
                              )}
                              {encounter.exchangeRate && encounter.exchangeRate !== 1 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Exchange rate: 1 {encounter.currency} = ${(1 / encounter.exchangeRate).toFixed(4)} USD
                                </div>
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} encounters
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

        {/* Map View Modal */}
        {showMapView && (
          <MapViewLeaflet
            encounters={filteredEncounters}
            onClose={() => setShowMapView(false)}
            onViewEncounter={(encounterId) => {
              // Navigate to encounter details - assuming we have an encounter details page
              onNavigate(`encounter-${encounterId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}