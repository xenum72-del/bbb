import { useEncounters, useActiveFriends, useSettings } from '../hooks/useDatabase';
import { calculateAllFriendScores } from '../utils/scoring';
import { useState, useEffect } from 'react';
import type { FriendScore } from '../utils/scoring';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const encounters = useEncounters(10); // Last 10 encounters
  const friends = useActiveFriends();
  const settings = useSettings();
  const [topFriends, setTopFriends] = useState<FriendScore[]>([]);

  useEffect(() => {
    async function loadTopFriends() {
      if (settings) {
        const scores = await calculateAllFriendScores(settings.scoringWeights);
        setTopFriends(scores.slice(0, 3));
      }
    }
    loadTopFriends();
  }, [friends, encounters, settings]);

  const thisWeekEncounters = encounters.filter(e => {
    const encounterDate = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return encounterDate >= weekAgo;
  });

  const averageRating = encounters.length > 0 
    ? (encounters.reduce((sum, e) => sum + e.rating, 0) / encounters.length).toFixed(1)
    : '0';

  return (
    <div className="p-6 space-y-6">
      {/* Quick Add Button */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 shadow-lg border border-white/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Quick Add</h2>
            <p className="text-sm text-gray-600 mt-1">Log a new encounter</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">✨</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('add')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300"
        >
          ➕ Log New Encounter
        </button>
      </div>

      {/* Summary Stats */}
            {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {thisWeekEncounters.length}
              </div>
              <div className="text-sm font-semibold text-gray-600 mt-1">This Week</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg">📈</span>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {averageRating}⭐
              </div>
              <div className="text-sm font-semibold text-gray-600 mt-1">Avg Rating</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Friends */}
      {/* Top Friends */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Top Friends</h3>
            <p className="text-sm text-gray-600 mt-1">Your closest connections</p>
          </div>
          <button
            onClick={() => onNavigate('analytics')}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {topFriends.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-gray-600 font-medium">No friends yet!</p>
              <button
                onClick={() => onNavigate('friends')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
              >
                Add your first friend →
              </button>
            </div>
          ) : (
            topFriends.map((friendScore, index) => (
              <div
                key={friendScore.friend.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-102"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-lg text-white font-bold">
                        {friendScore.friend.avatarUrl ? (
                          <img 
                            src={friendScore.friend.avatarUrl} 
                            alt={friendScore.friend.name}
                            className="w-12 h-12 rounded-2xl object-cover"
                          />
                        ) : (
                          friendScore.friend.name.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{friendScore.friend.name}</div>
                    <div className="text-sm text-gray-500">
                      {friendScore.encounterCount} encounters
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: getScoreColor(friendScore.score) }}>
                    {(friendScore.score * 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Score
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>      {/* Recent Encounters */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Recent Encounters</h3>
          <button
            onClick={() => onNavigate('timeline')}
            className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {encounters.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-lg font-medium mb-2">No encounters yet!</p>
              <button
                onClick={() => onNavigate('add')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Log your first encounter →
              </button>
            </div>
          ) : (
            encounters.slice(0, 5).map(encounter => (
              <div
                key={encounter.id}
                className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      {encounter.isAnonymous ? 'Anonymous encounter' : 
                        `With ${encounter.participants.length} friend${encounter.participants.length > 1 ? 's' : ''}`
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(encounter.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl mb-1">
                      {'⭐'.repeat(encounter.rating)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {encounter.beneficiary}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return '#22c55e'; // green-500
  if (score >= 0.6) return '#eab308'; // yellow-500
  if (score >= 0.4) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}