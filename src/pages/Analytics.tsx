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

  // Calculate exciting personal stats
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

  // Exciting personal metrics
  const totalMinutes = encounters.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const avgDuration = encounters.length > 0 ? Math.floor(totalMinutes / encounters.length) : 0;
  const topRatedEncounters = encounters.filter(e => e.rating >= 4);
  const kinkiestEncounters = encounters.filter(e => (e.kinkiness || 0) >= 4);
  const repeatableGuys = encounters.filter(e => e.wouldRepeat);
  const safeEncounters = encounters.filter(e => e.condomUsed);
  const safePercentage = encounters.length > 0 ? Math.round((safeEncounters.length / encounters.length) * 100) : 0;

  const beneficiaryStats = encounters.reduce((acc, e) => {
    acc[e.beneficiary] = (acc[e.beneficiary] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: encounters.filter(e => e.rating === rating).length
  }));

  // Payment Analytics (all in USD)
  const paidEncounters = encounters.filter(e => e.isPaid);
  const totalSpent = paidEncounters
    .filter(e => e.paymentType === 'given')
    .reduce((sum, e) => sum + (e.amountGivenUSD || parseFloat(String(e.amountGiven || '0')) || 0), 0);
  const totalEarned = paidEncounters
    .filter(e => e.paymentType === 'received')
    .reduce((sum, e) => sum + (e.amountGivenUSD || parseFloat(String(e.amountGiven || '0')) || 0), 0);
  const netAmount = totalEarned - totalSpent;
  
  const paymentMethodStats = paidEncounters.reduce((acc, e) => {
    if (e.paymentMethod) {
      acc[e.paymentMethod] = (acc[e.paymentMethod] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);



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
      <h2 className="text-xl font-bold mb-4">🔥 Your Legendary Sex Life</h2>

      {/* Personal Sex Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{encounters.length}</div>
          <div className="text-sm opacity-90">🍆 Total Encounters</div>
          <div className="text-xs opacity-75 mt-1">You're clearly popular! 😏</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{friendScores.length}</div>
          <div className="text-sm opacity-90">👑 Guys in Your List</div>
          <div className="text-xs opacity-75 mt-1">Building an empire!</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{averageRating.toFixed(1)}⭐</div>
          <div className="text-sm opacity-90">🔥 Your Average Rating</div>
          <div className="text-xs opacity-75 mt-1">You know how to pick 'em!</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{topRatedEncounters.length}</div>
          <div className="text-sm opacity-90">⭐ Amazing Experiences</div>
          <div className="text-xs opacity-75 mt-1">4+ star encounters!</div>
        </div>
      </div>

      {/* Exciting Personal Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-pink-500">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">😈</span>
            <div>
              <div className="text-lg font-bold text-pink-600">{kinkiestEncounters.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Kinky AF Sessions</div>
              <div className="text-xs text-gray-500">You're adventurous!</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔁</span>
            <div>
              <div className="text-lg font-bold text-green-600">{repeatableGuys.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Want You Again</div>
              <div className="text-xs text-gray-500">Amazing in bed!</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏰</span>
            <div>
              <div className="text-lg font-bold text-blue-600">{totalHours}h</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Fun Time</div>
              <div className="text-xs text-gray-500">Avg {avgDuration}min sessions</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-emerald-500">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="text-lg font-bold text-emerald-600">{safePercentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Safe Encounters</div>
              <div className="text-xs text-gray-500">Smart AND sexy!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Money Moves */}
      {paidEncounters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">💰 MONEY MOVES</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
              <div className="text-sm opacity-90">💸 You MADE</div>
              <div className="text-xs opacity-75 mt-1">Worth every penny! 🔥</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <div className="text-sm opacity-90">💳 You Invested</div>
              <div className="text-xs opacity-75 mt-1">In good times! 😈</div>
            </div>
            <div className={`p-4 rounded-lg text-white ${
              netAmount >= 0 
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              <div className="text-2xl font-bold">${Math.abs(netAmount).toFixed(2)}</div>
              <div className="text-sm opacity-90">
                {netAmount >= 0 ? '🎯 NET PROFIT' : '🛍️ INVESTMENT'}
              </div>
              <div className="text-xs opacity-75 mt-1">
                {netAmount >= 0 ? "You're making bank! 💅" : "Money well spent! 🥳"}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500">
              <div className="text-2xl font-bold text-yellow-600">{paidEncounters.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">💰 Paid Sessions</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {((paidEncounters.length / encounters.length) * 100).toFixed(1)}% involved money
              </div>
            </div>
          </div>
          
          {/* Payment Methods Breakdown */}
          {Object.keys(paymentMethodStats).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Payment Methods Used</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(paymentMethodStats).map(([method, count]) => (
                  <div key={method} className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                    <div className="text-sm font-medium capitalize">{method}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{count} times</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Your Top Performers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🏆 Your Top 10 Performers</h3>
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
              {friendScores.slice(0, 10).map((friendScore, index) => (
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

      {/* Your Newest Additions */}
      {friendScores.length > 10 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🆕 Your Newest Additions (Last 10)</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[...friendScores]
                .sort((a, b) => new Date(b.friend.createdAt).getTime() - new Date(a.friend.createdAt).getTime())
                .slice(0, 10)
                .map((friendScore, index) => {
                  const daysSinceAdded = Math.floor((Date.now() - new Date(friendScore.friend.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={friendScore.friend.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center font-bold text-blue-600">
                            #{index + 1}
                          </div>
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            {friendScore.friend.avatarUrl ? (
                              <img
                                src={friendScore.friend.avatarUrl}
                                alt={friendScore.friend.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600">{friendScore.friend.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center space-x-2">
                              <span>{friendScore.friend.name}</span>
                              {daysSinceAdded <= 7 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Fresh! 🔥</span>}
                            </div>
                            <div className="text-sm text-gray-500">
                              {friendScore.encounterCount} encounters
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              Added {daysSinceAdded === 0 ? 'today' : 
                                     daysSinceAdded === 1 ? 'yesterday' : 
                                     daysSinceAdded <= 7 ? `${daysSinceAdded} days ago` :
                                     daysSinceAdded <= 30 ? `${Math.floor(daysSinceAdded/7)} weeks ago` :
                                     `${Math.floor(daysSinceAdded/30)} months ago`}
                              {daysSinceAdded <= 3 && ' 🆕'}
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
                          <div className="text-xs text-blue-600 mt-1">
                            {friendScore.encounterCount === 0 ? '🎯 Ready to connect!' : 
                             friendScore.encounterCount <= 2 ? '🔥 Getting started!' : 
                             '⭐ Building chemistry!'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick stats for new friends */}
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
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">⭐ Your Performance Ratings</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="space-y-3">
            {ratingDistribution.reverse().map(({ rating, count }) => {
              const percentage = encounters.length > 0 ? (count / encounters.length) * 100 : 0;
              // Different colors for different ratings
              const barColor = rating === 5 ? 'bg-green-500' :
                             rating === 4 ? 'bg-blue-500' :
                             rating === 3 ? 'bg-yellow-500' :
                             rating === 2 ? 'bg-orange-500' : 'bg-red-500';
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="w-12 text-sm font-medium">
                    {rating} ⭐
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`${barColor} h-6 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${Math.max(percentage, 0)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {percentage > 5 ? `${percentage.toFixed(1)}%` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pleasure Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">😈 Who Got the Most Pleasure?</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'me', label: 'You Won! 🎯', icon: '👑', color: 'text-yellow-600' },
              { key: 'friend', label: 'They Did 😏', icon: '🍆', color: 'text-purple-600' },
              { key: 'both', label: 'BOTH! 🔥', icon: '💥', color: 'text-red-600' }
            ].map(({ key, label, icon, color }) => {
              const count = beneficiaryStats[key] || 0;
              const percentage = encounters.length > 0 ? ((count / encounters.length) * 100).toFixed(1) : '0';
              return (
                <div key={key} className="text-center p-3 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                  <div className="text-xs text-gray-500">{percentage}% of encounters</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Your Recent Conquests */}
      <div>
        <h3 className="text-lg font-semibold mb-3">🔥 Your Recent Conquests</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-4 rounded-lg">
            <div className="text-2xl font-bold">{thisWeek.length}</div>
            <div className="text-sm opacity-90">🍆 This Week</div>
            <div className="text-xs opacity-75">
              {thisWeek.length > 0 ? 
                `Averaging ${(thisWeek.reduce((sum, e) => sum + e.rating, 0) / thisWeek.length).toFixed(1)}⭐ - Hot streak!` :
                'Time to get back out there! 😉'
              }
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 rounded-lg">
            <div className="text-2xl font-bold">{thisMonth.length}</div>
            <div className="text-sm opacity-90">📅 This Month</div>
            <div className="text-xs opacity-75">
              {thisMonth.length > 0 ? 
                `${(thisMonth.reduce((sum, e) => sum + e.rating, 0) / thisMonth.length).toFixed(1)}⭐ average - Legendary!` :
                'New month, new adventures! 🚀'
              }
            </div>
          </div>
        </div>
        
        {/* Quick Action */}
        {thisWeek.length === 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-center">
            <div className="text-lg font-bold mb-2">🔥 Ready for Action?</div>
            <div className="text-sm opacity-90 mb-3">Your stats are waiting for some heat!</div>
            <button
              onClick={() => onNavigate('add')}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
            >
              Log New Encounter 🍆
            </button>
          </div>
        )}
      </div>
    </div>
  );
}