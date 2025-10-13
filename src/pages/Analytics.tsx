import { useEncounters, useSettings } from '../hooks/useDatabase';
import { calculateAllFriendScores } from '../utils/scoring';
import { useState, useEffect } from 'react';
import type { FriendScore } from '../utils/scoring';

interface AnalyticsProps {
  onNavigate: (page: string) => void;
}

export default function Analytics({ onNavigate }: AnalyticsProps) {
  const encounters = useEncounters();
  const settings = useSettings();
  const [friendScores, setFriendScores] = useState<FriendScore[]>([]);

  useEffect(() => {
    async function loadScores() {
      if (settings) {
        const scores = await calculateAllFriendScores(settings.scoringWeights);
        setFriendScores(scores);
      }
    }
    loadScores();
  }, [encounters, settings]);

  // Calculate stats
  const thisMonth = encounters.filter(e => {
    const encounterDate = new Date(e.date);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return encounterDate >= monthAgo;
  });

  const thisWeek = encounters.filter(e => {
    const encounterDate = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return encounterDate >= weekAgo;
  });

  const averageRating = encounters.length > 0
    ? (encounters.reduce((sum, e) => sum + e.rating, 0) / encounters.length)
    : 0;

  const beneficiaryStats = encounters.reduce((acc, e) => {
    acc[e.beneficiary] = (acc[e.beneficiary] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: encounters.filter(e => e.rating === rating).length
  }));

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#22c55e'; // green-500
    if (score >= 0.6) return '#eab308'; // yellow-500
    if (score >= 0.4) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Analytics</h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{encounters.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Encounters</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{friendScores.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Active Friends</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{thisWeek.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">This Week</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{averageRating.toFixed(1)}⭐</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Avg Rating</div>
        </div>
      </div>

      {/* Friend Leaderboard */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Friend Leaderboard</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg">
          {friendScores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No friends to rank yet</p>
              <button
                onClick={() => onNavigate('friends')}
                className="text-primary mt-2"
              >
                Add friends →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {friendScores.map((friendScore, index) => (
                <div key={friendScore.friend.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        {friendScore.friend.avatarUrl ? (
                          <img
                            src={friendScore.friend.avatarUrl}
                            alt={friendScore.friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span>{friendScore.friend.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{friendScore.friend.name}</div>
                        <div className="text-sm text-gray-500">
                          {friendScore.encounterCount} encounters
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div 
                        className="text-lg font-bold"
                        style={{ color: getScoreColor(friendScore.score) }}
                      >
                        {(friendScore.score * 100).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getScoreLabel(friendScore.score)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Score breakdown */}
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-blue-600">
                        {(friendScore.frequency * 100).toFixed(0)}
                      </div>
                      <div className="text-gray-500">Frequency</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {(friendScore.recency * 100).toFixed(0)}
                      </div>
                      <div className="text-gray-500">Recency</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-yellow-600">
                        {(friendScore.quality * 100).toFixed(0)}
                      </div>
                      <div className="text-gray-500">Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-purple-600">
                        {(friendScore.mutuality * 100).toFixed(0)}
                      </div>
                      <div className="text-gray-500">Mutual</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Rating Distribution</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="space-y-3">
            {ratingDistribution.reverse().map(({ rating, count }) => {
              const percentage = encounters.length > 0 ? (count / encounters.length) * 100 : 0;
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="w-12 text-sm">
                    {rating} ⭐
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-primary h-4 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-gray-600 dark:text-gray-300">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Beneficiary Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Who Benefits?</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'me', label: 'Me', icon: '👤' },
              { key: 'friend', label: 'Friend', icon: '👥' },
              { key: 'both', label: 'Both', icon: '🤝' }
            ].map(({ key, label, icon }) => {
              const count = beneficiaryStats[key] || 0;
              const percentage = encounters.length > 0 ? ((count / encounters.length) * 100).toFixed(1) : '0';
              return (
                <div key={key} className="text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-bold text-primary">{count}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                  <div className="text-xs text-gray-400">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-primary">{thisWeek.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">This Week</div>
              <div className="text-xs text-gray-500">
                {thisWeek.length > 0 ? 
                  `Avg ${(thisWeek.reduce((sum, e) => sum + e.rating, 0) / thisWeek.length).toFixed(1)}⭐` :
                  'No encounters'
                }
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{thisMonth.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">This Month</div>
              <div className="text-xs text-gray-500">
                {thisMonth.length > 0 ? 
                  `Avg ${(thisMonth.reduce((sum, e) => sum + e.rating, 0) / thisMonth.length).toFixed(1)}⭐` :
                  'No encounters'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}