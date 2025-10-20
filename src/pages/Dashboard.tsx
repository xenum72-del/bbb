import { useEncounters, useActiveFriends, useSettings } from '../hooks/useDatabase';
import { calculateAllFriendScores } from '../utils/scoring';
import { useState, useEffect } from 'react';
import type { FriendScore } from '../utils/scoring';
import StarRating from '../components/StarRating';

interface DashboardProps {
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  isGayMode: boolean;
}

export default function Dashboard({ onNavigate, isGayMode }: DashboardProps) {
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
    <div className="p-6 space-y-8 relative">
      {/* Quick Add Section */}
      <div className={`relative backdrop-blur-xl rounded-2xl p-6 shadow-lg border ${
        isGayMode 
          ? 'bg-gradient-to-br from-pink-50/80 to-purple-50/80 border-pink-200/50' 
          : 'bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50'
      }`}>
        <div className="mb-4">
          <h2 className={`text-lg font-semibold ${
            isGayMode 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600' 
              : 'text-gray-800 dark:text-gray-200'
          }`}>Quick Actions</h2>
          <p className={`text-sm ${
            isGayMode 
              ? 'text-purple-600' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>Add new content</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('add')}
            className={`group relative rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${
              isGayMode
                ? 'bg-gradient-to-br from-pink-50 to-purple-100 hover:from-pink-100 hover:to-purple-200 border-pink-200/50 hover:border-pink-300/50'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 border-blue-200/50 dark:border-blue-700/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 ${
                isGayMode ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-blue-500'
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <div className={`font-medium text-sm ${
                  isGayMode ? 'text-purple-800' : 'text-gray-800 dark:text-gray-200'
                }`}>New Encounter</div>
                <div className={`text-xs ${
                  isGayMode ? 'text-purple-600' : 'text-gray-500 dark:text-gray-400'
                }`}>Log activity</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate('friends-add')}
            className={`group relative rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${
              isGayMode
                ? 'bg-gradient-to-br from-green-50 to-teal-100 hover:from-green-100 hover:to-teal-200 border-green-200/50 hover:border-green-300/50'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 border-green-200/50 dark:border-green-700/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 ${
                isGayMode ? 'bg-gradient-to-r from-green-500 to-teal-600' : 'bg-green-500'
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <div className={`font-medium text-sm ${
                  isGayMode ? 'text-green-800' : 'text-gray-800 dark:text-gray-200'
                }`}>New Friend</div>
                <div className={`text-xs ${
                  isGayMode ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'
                }`}>Add contact</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className={`group relative backdrop-blur-xl p-8 rounded-3xl shadow-2xl border hover:shadow-3xl hover:scale-[1.03] transition-all duration-300 overflow-hidden ${
          isGayMode 
            ? 'bg-gradient-to-br from-pink-50/90 to-purple-100/90 border-pink-200/40' 
            : 'bg-white/90 dark:bg-gray-800/90 border-white/40 dark:border-gray-700/40'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm">
                {thisWeekEncounters.length}
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">This Week</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-xl drop-shadow-sm">📈</span>
            </div>
          </div>
        </div>
        <div className={`group relative backdrop-blur-xl p-8 rounded-3xl shadow-2xl border hover:shadow-3xl hover:scale-[1.03] transition-all duration-300 overflow-hidden ${
          isGayMode 
            ? 'bg-gradient-to-br from-orange-50/90 to-yellow-100/90 border-orange-200/40' 
            : 'bg-white/90 dark:bg-gray-800/90 border-white/40 dark:border-gray-700/40'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 text-center">
            <div>
              <div className="mb-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">{averageRating}</span>
              </div>
              <div className="flex justify-center mb-2">
                <StarRating rating={parseFloat(averageRating)} size="md" />
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Friends */}
      <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="flex justify-between items-start gap-4 mb-8 relative z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">Top Friends</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Your closest connections</p>
          </div>
          <button
            onClick={() => onNavigate('friends')}
            className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-200/80 hover:to-indigo-200/80 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 text-blue-700 dark:text-blue-300 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 whitespace-nowrap"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {topFriends.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
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
                className={`flex items-center justify-between p-4 rounded-2xl shadow-md border hover:shadow-lg transition-all duration-300 hover:scale-102 ${
                  isGayMode
                    ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200'
                    : 'bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 border-gray-100 dark:border-gray-600'
                }`}
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
                    <div className={`font-bold ${
                      isGayMode 
                        ? 'text-purple-800' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>{friendScore.friend.name}</div>
                    <div className={`text-sm ${
                      isGayMode 
                        ? 'text-purple-600' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {friendScore.encounterCount} encounters
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: getScoreColor(friendScore.score) }}>
                    {(friendScore.score * 100).toFixed(0)}
                  </div>
                  <div className={`text-xs font-medium ${
                    isGayMode 
                      ? 'text-purple-600' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Score
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>      {/* Recent Encounters */}
      <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-gray-700/40 hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="flex justify-between items-start gap-4 mb-8 relative z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm">Recent Encounters</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Your latest activities</p>
          </div>
          <button
            onClick={() => onNavigate('timeline')}
            className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-red-100/80 to-orange-100/80 dark:from-red-900/30 dark:to-orange-900/30 hover:from-red-200/80 hover:to-orange-200/80 dark:hover:from-red-800/40 dark:hover:to-orange-800/40 text-red-700 dark:text-red-300 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm border border-red-200/50 dark:border-red-700/50 whitespace-nowrap"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {encounters.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No encounters yet!</p>
              <button
                onClick={() => onNavigate('add')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg"
              >
                Log your first encounter →
              </button>
            </div>
          ) : (
            encounters.slice(0, 5).map(encounter => (
              <div
                key={encounter.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl shadow-md border border-gray-100 dark:border-gray-600/30 hover:shadow-lg transition-all duration-300 hover:scale-102"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-lg text-white font-bold">
                        {encounter.isAnonymous ? '?' : encounter.participants.length}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">
                      {encounter.isAnonymous ? 'Anonymous encounter' : 
                        `With ${encounter.participants.length} friend${encounter.participants.length > 1 ? 's' : ''}`
                      }
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(encounter.date).toLocaleDateString()} • {encounter.beneficiary}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1">
                    <StarRating rating={encounter.rating} size="md" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Rating
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