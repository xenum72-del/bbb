import { useEncounters, useActiveFriends, useInteractionTypes, encountersApi } from '../hooks/useDatabase';
import { useState } from 'react';

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
    tags: ''
  });  const friendsMap = new Map(friends.map(f => [f.id!, f]));
  const typesMap = new Map(interactionTypes.map(t => [t.id!, t]));

  const filteredEncounters = allEncounters.filter(encounter => {
    if (encounter.rating < filters.rating[0] || encounter.rating > filters.rating[1]) {
      return false;
    }
    
    if (filters.beneficiary !== 'all') {
      // "both" should match any filter since it includes everyone
      // "me" filter should show "me" and "both"
      // "friend" filter should show "friend" and "both"
      if (encounter.beneficiary !== filters.beneficiary && encounter.beneficiary !== 'both') {
        return false;
      }
    }

    if (filters.participant !== 'all') {
      if (!encounter.participants.includes(Number(filters.participant))) {
        return false;
      }
    }

    if (filters.typeId !== 'all') {
      const targetTypeId = Number(filters.typeId);
      const hasActivity = encounter.activitiesPerformed 
        ? encounter.activitiesPerformed.includes(targetTypeId)
        : encounter.typeId === targetTypeId;
      if (!hasActivity) return false;
    }

    if (!filters.showAnonymous && encounter.isAnonymous) {
      return false;
    }

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

    return true;
  });

  const groupedByDate = filteredEncounters.reduce((acc, encounter) => {
    const date = new Date(encounter.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(encounter);
    return acc;
  }, {} as Record<string, typeof filteredEncounters>);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Timeline</h2>
        <button
          onClick={() => onNavigate('add')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <h3 className="font-medium mb-3">Filters</h3>
        
        <div className="space-y-3">
          {/* Rating Filter */}
          <div>
            <label className="text-sm font-medium">Rating: {filters.rating[0]}-{filters.rating[1]} stars</label>
            <div className="flex space-x-2 mt-1">
              <input
                type="range"
                min="1"
                max="5"
                value={filters.rating[0]}
                onChange={(e) => setFilters(f => ({...f, rating: [Number(e.target.value), f.rating[1]]}))}
                className="flex-1"
              />
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

          {/* Beneficiary Filter */}
          <div>
            <label className="text-sm font-medium">Beneficiary:</label>
            <select
              value={filters.beneficiary}
              onChange={(e) => setFilters(f => ({...f, beneficiary: e.target.value}))}
              className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
            >
              <option value="all">All</option>
              <option value="me">Me</option>
              <option value="friend">Friend</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Participant Filter */}
          <div>
            <label className="text-sm font-medium">Friend:</label>
            <select
              value={filters.participant}
              onChange={(e) => setFilters(f => ({...f, participant: e.target.value}))}
              className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
            >
              <option value="all">All Friends</option>
              {friends.map(friend => (
                <option key={friend.id} value={friend.id}>
                  {friend.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium">Type:</label>
            <select
              value={filters.typeId}
              onChange={(e) => setFilters(f => ({...f, typeId: e.target.value}))}
              className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
            >
              <option value="all">All Types</option>
              {interactionTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              placeholder="🏷️ Search by tags..."
              value={filters.tags}
              onChange={(e) => setFilters(f => ({...f, tags: e.target.value}))}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Search encounters by tags (e.g., "vacation", "kinky", "drunk")
            </div>
          </div>

          {/* Anonymous Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.showAnonymous}
              onChange={(e) => setFilters(f => ({...f, showAnonymous: e.target.checked}))}
              className="rounded"
            />
            <span className="text-sm">Show anonymous encounters</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No encounters match your filters</p>
            <button
              onClick={() => setFilters({
                rating: [1, 5],
                beneficiary: 'all',
                participant: 'all',
                typeId: 'all',
                showAnonymous: true,
                tags: ''
              })}
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
                    
                    return (
                      <div
                        key={encounter.id}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            {activities.length > 1 ? (
                              <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  {activities.length} Activities:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {activities.slice(0, 3).map((activity, idx) => (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                                    >
                                      <span>{activity?.icon}</span>
                                      <span>{activity?.name}</span>
                                    </span>
                                  ))}
                                  {activities.length > 3 && (
                                    <span className="text-xs text-gray-500 px-2 py-1">
                                      +{activities.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{activities[0]?.icon || '💭'}</span>
                                <span className="font-medium">{activities[0]?.name || 'Unknown'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteEncounter(encounter.id!, e)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Delete encounter"
                              >
                                🗑️
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="text-lg">{'⭐'.repeat(encounter.rating)}</div>
                              <div className="text-xs text-gray-500">
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
                                <span>💰</span>
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
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}