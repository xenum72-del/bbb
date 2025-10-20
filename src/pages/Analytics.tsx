import { useEncounters, useSettings, useActiveFriends, useInteractionTypes } from '../hooks/useDatabase';
import { calculateAllFriendScores } from '../utils/scoring';
import { useState, useEffect } from 'react';
import type { FriendScore } from '../utils/scoring';
import StarRating from '../components/StarRating';

interface AnalyticsProps {
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  isGayMode: boolean;
}

export default function Analytics({ onNavigate, isGayMode }: AnalyticsProps) {
  const encounters = useEncounters();
  const settings = useSettings();
  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();
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

  // Age distribution of friends
  const ageDistribution = friends.reduce((acc, friend) => {
    if (friend.age) {
      const ageGroup = friend.age < 25 ? '18-24' : 
                     friend.age < 30 ? '25-29' :
                     friend.age < 35 ? '30-34' :
                     friend.age < 40 ? '35-39' :
                     friend.age < 45 ? '40-44' : '45+';
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Duration distribution of encounters
  const durationDistribution = encounters.reduce((acc, encounter) => {
    if (encounter.durationMinutes) {
      const durationGroup = encounter.durationMinutes < 30 ? 'Quick (<30min)' :
                           encounter.durationMinutes < 60 ? 'Standard (30-60min)' :
                           encounter.durationMinutes < 120 ? 'Extended (1-2h)' :
                           encounter.durationMinutes < 180 ? 'Marathon (2-3h)' : 'Epic (3h+)';
      acc[durationGroup] = (acc[durationGroup] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Top 5 countries (extract from location)
  const countryStats = encounters.reduce((acc, encounter) => {
    if (encounter.location?.place) {
      // Extract country from location string (assumes format includes country)
      const locationParts = encounter.location.place.split(',');
      const country = locationParts[locationParts.length - 1]?.trim();
      if (country) {
        acc[country] = (acc[country] || 0) + 1;
      }
    }
    return acc;
  }, {} as Record<string, number>);
  
  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Comprehensive activity analytics - match InteractionTypeManager logic exactly
  const activityStats: Record<string, { total: number; asMain: number; asSecondary: number }> = {};
  
  interactionTypes.forEach(type => {
    if (!type.id) return;
    
    // Count encounters where this is the main type
    const asMainCount = encounters.filter(e => e.typeId === type.id).length;
    
    // Count encounters where this appears in activitiesPerformed
    const inActivitiesCount = encounters.filter(e => 
      e.activitiesPerformed?.includes(type.id!)
    ).length;
    
    // Calculate secondary: appears in activities but NOT as main type
    const asSecondaryCount = encounters.filter(e => 
      e.activitiesPerformed?.includes(type.id!) && e.typeId !== type.id
    ).length;
    
    // Total appearances matches InteractionTypeManager: main + activities (with potential overlap)
    const totalAppearances = asMainCount + inActivitiesCount;
    
    if (totalAppearances > 0) {
      activityStats[type.name] = {
        total: totalAppearances,
        asMain: asMainCount,
        asSecondary: asSecondaryCount
      };
    }
  });

  const topActivities = Object.entries(activityStats)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 10);



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
    <div className="p-4 space-y-6 min-h-screen relative">
      {/* Main content */}
      <div className="space-y-6 relative z-10">
        <div className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-gray-300 drop-shadow-sm mb-2">🔥 Your Legendary Sex Life</h2>
          <p className="text-gray-600 dark:text-gray-400">Deep insights into your connections</p>
        </div>

      {/* Personal Sex Stats Overview */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className={`group relative p-6 rounded-2xl shadow-2xl border hover:shadow-3xl hover:scale-[1.03] transition-all duration-300 overflow-hidden ${
          isGayMode 
            ? 'bg-gradient-to-br from-pink-50/90 to-rose-100/90 border-pink-200/50' 
            : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className={`text-3xl font-bold drop-shadow-sm ${
              isGayMode 
                ? 'text-red-600' 
                : 'text-red-600 dark:text-red-400'
            }`}>{encounters.length}</div>
            <div className={`text-sm font-medium ${
              isGayMode 
                ? 'text-pink-800' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>🍆 Total Encounters</div>
            <div className={`text-xs mt-1 ${
              isGayMode 
                ? 'text-pink-600' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>You're clearly popular! 😏</div>
          </div>
        </div>
        <div className={`group relative p-6 rounded-2xl shadow-2xl border hover:shadow-3xl hover:scale-[1.03] transition-all duration-300 overflow-hidden ${
          isGayMode 
            ? 'bg-gradient-to-br from-purple-50/90 to-indigo-100/90 border-purple-200/50' 
            : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className={`text-3xl font-bold drop-shadow-sm ${
              isGayMode 
                ? 'text-purple-600' 
                : 'text-purple-600 dark:text-purple-400'
            }`}>{friendScores.length}</div>
            <div className={`text-sm font-medium ${
              isGayMode 
                ? 'text-purple-800' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>👑 Guys in Your List</div>
            <div className={`text-xs mt-1 ${
              isGayMode 
                ? 'text-purple-600' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>Building an empire!</div>
          </div>
        </div>
        <div className={`group relative p-6 rounded-2xl shadow-2xl border hover:shadow-3xl hover:scale-[1.03] transition-all duration-300 overflow-hidden ${
          isGayMode 
            ? 'bg-gradient-to-br from-green-50/90 to-emerald-100/90 border-green-200/50' 
            : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-3xl font-bold drop-shadow-sm ${
                isGayMode 
                  ? 'text-green-600' 
                  : 'text-green-600 dark:text-green-400'
              }`}>{averageRating.toFixed(1)}</span>
              <StarRating rating={averageRating} size="lg" />
            </div>
            <div className={`text-sm font-medium ${
              isGayMode 
                ? 'text-green-800' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>🔥 Your Average Rating</div>
            <div className={`text-xs mt-1 ${
              isGayMode 
                ? 'text-green-600' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>You know how to pick 'em!</div>
          </div>
        </div>
        <div className={`group relative p-6 rounded-2xl shadow-2xl border hover:shadow-3xl hover:scale-[1.03] transition-all duration-300 overflow-hidden ${
          isGayMode 
            ? 'bg-gradient-to-br from-orange-50/90 to-red-100/90 border-orange-200/50' 
            : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className={`text-3xl font-bold drop-shadow-sm ${
              isGayMode 
                ? 'text-orange-600' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>{topRatedEncounters.length}</div>
            <div className={`text-sm font-medium flex items-center justify-center gap-1 ${
              isGayMode 
                ? 'text-orange-800' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Amazing Experiences
            </div>
            <div className={`text-xs mt-1 ${
              isGayMode 
                ? 'text-orange-600' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>4+ star encounters!</div>
          </div>
        </div>
      </div>

      {/* Exciting Personal Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-l-4 border-pink-500 ${
          isGayMode 
            ? 'bg-pink-50/80 border-pink-300' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">😈</span>
            <div>
              <div className={`text-lg font-bold ${
                isGayMode 
                  ? 'text-pink-700' 
                  : 'text-pink-600'
              }`}>{kinkiestEncounters.length}</div>
              <div className={`text-sm ${
                isGayMode 
                  ? 'text-pink-800' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>Kinky AF Sessions</div>
              <div className={`text-xs ${
                isGayMode 
                  ? 'text-pink-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>You're adventurous!</div>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-l-4 border-green-500 ${
          isGayMode 
            ? 'bg-green-50/80 border-green-300' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔁</span>
            <div>
              <div className={`text-lg font-bold ${
                isGayMode 
                  ? 'text-green-700' 
                  : 'text-green-600'
              }`}>{repeatableGuys.length}</div>
              <div className={`text-sm ${
                isGayMode 
                  ? 'text-green-800' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>Want You Again</div>
              <div className={`text-xs ${
                isGayMode 
                  ? 'text-green-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>Amazing in bed!</div>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
          isGayMode 
            ? 'bg-blue-50/80 border-blue-300' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏰</span>
            <div>
              <div className={`text-lg font-bold ${
                isGayMode 
                  ? 'text-blue-700' 
                  : 'text-blue-600'
              }`}>{totalHours}h</div>
              <div className={`text-sm ${
                isGayMode 
                  ? 'text-blue-800' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>Total Fun Time</div>
              <div className={`text-xs ${
                isGayMode 
                  ? 'text-blue-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>Avg {avgDuration}min sessions</div>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-l-4 border-emerald-500 ${
          isGayMode 
            ? 'bg-emerald-50/80 border-emerald-300' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className={`text-lg font-bold ${
                isGayMode 
                  ? 'text-emerald-700' 
                  : 'text-emerald-600'
              }`}>{safePercentage}%</div>
              <div className={`text-sm ${
                isGayMode 
                  ? 'text-emerald-800' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>Safe Encounters</div>
              <div className={`text-xs ${
                isGayMode 
                  ? 'text-emerald-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>Smart AND sexy!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Money Moves */}
      {paidEncounters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">💰 MONEY MOVES</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${
              isGayMode 
                ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' 
                : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
            }`}>
              <div className={`text-2xl font-bold ${
                isGayMode ? 'text-green-700' : 'text-white'
              }`}>${totalEarned.toFixed(2)}</div>
              <div className={`text-sm ${
                isGayMode ? 'text-green-800' : 'text-white opacity-90'
              }`}>💸 You MADE</div>
              <div className={`text-xs mt-1 ${
                isGayMode ? 'text-green-600' : 'text-white opacity-75'
              }`}>Worth every penny! 🔥</div>
            </div>
            <div className={`p-4 rounded-lg border ${
              isGayMode 
                ? 'bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200' 
                : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
            }`}>
              <div className={`text-2xl font-bold ${
                isGayMode ? 'text-purple-700' : 'text-white'
              }`}>${totalSpent.toFixed(2)}</div>
              <div className={`text-sm ${
                isGayMode ? 'text-purple-800' : 'text-white opacity-90'
              }`}>💳 You Invested</div>
              <div className={`text-xs mt-1 ${
                isGayMode ? 'text-purple-600' : 'text-white opacity-75'
              }`}>In good times! 😈</div>
            </div>
            <div className={`p-4 rounded-lg border ${
              isGayMode
                ? (netAmount >= 0 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200')
                : (netAmount >= 0 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white')
            }`}>
              <div className={`text-2xl font-bold ${
                isGayMode 
                  ? (netAmount >= 0 ? 'text-yellow-700' : 'text-blue-700')
                  : 'text-white'
              }`}>${Math.abs(netAmount).toFixed(2)}</div>
              <div className={`text-sm ${
                isGayMode 
                  ? (netAmount >= 0 ? 'text-yellow-800' : 'text-blue-800')
                  : 'text-white opacity-90'
              }`}>
                {netAmount >= 0 ? '🎯 NET PROFIT' : '🛍️ INVESTMENT'}
              </div>
              <div className={`text-xs mt-1 ${
                isGayMode 
                  ? (netAmount >= 0 ? 'text-yellow-600' : 'text-blue-600')
                  : 'text-white opacity-75'
              }`}>
                {netAmount >= 0 ? "You're making bank! 💅" : "Money well spent! 🥳"}
              </div>
            </div>
            <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${
              isGayMode 
                ? 'bg-yellow-50/80 border-yellow-300' 
                : 'bg-white dark:bg-gray-800'
            }`}>
              <div className={`text-2xl font-bold ${
                isGayMode 
                  ? 'text-yellow-700' 
                  : 'text-yellow-600'
              }`}>{paidEncounters.length}</div>
              <div className={`text-sm ${
                isGayMode 
                  ? 'text-yellow-800' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>💰 Paid Sessions</div>
              <div className={`text-xs mt-1 ${
                isGayMode 
                  ? 'text-yellow-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
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
                        <button
                          onClick={() => onNavigate(`friends/${friendScore.friend.id}`)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors text-left"
                          title={`View ${friendScore.friend.name}'s profile`}
                        >
                          {friendScore.friend.name}
                        </button>
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

      {/* Age Distribution of Friends */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
          isGayMode ? 'text-gray-800' : 'text-gray-900 dark:text-gray-100'
        }`}>
          👥 Age Distribution of Friends
        </h3>
        <div className={`rounded-lg p-4 ${
          isGayMode 
            ? 'bg-gradient-to-br from-white/90 to-gray-50/90' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="space-y-3">
            {Object.entries(ageDistribution)
              .sort(([a], [b]) => {
                const order = ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([ageGroup, count]) => {
                const percentage = friends.length > 0 ? (count / friends.length) * 100 : 0;
                const barColor = ageGroup === '18-24' ? 'bg-green-500' :
                               ageGroup === '25-29' ? 'bg-blue-500' :
                               ageGroup === '30-34' ? 'bg-purple-500' :
                               ageGroup === '35-39' ? 'bg-orange-500' :
                               ageGroup === '40-44' ? 'bg-red-500' : 'bg-gray-500';
                
                return (
                  <div key={ageGroup} className="flex items-center space-x-3">
                    <div className={`w-16 text-sm font-medium ${
                      isGayMode ? 'text-gray-800' : 'text-gray-700 dark:text-gray-300'
                    }`}>{ageGroup}</div>
                    <div className={`flex-1 rounded-full h-6 relative overflow-hidden ${
                      isGayMode ? 'bg-gray-100' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <div
                        className={`${barColor} h-6 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${Math.max(percentage, 0)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-medium drop-shadow-sm ${
                          percentage > 15 
                            ? 'text-white' 
                            : (isGayMode ? 'text-gray-800' : 'text-gray-800 dark:text-gray-200')
                        }`}>
                          {percentage > 5 ? `${percentage.toFixed(1)}%` : ''}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 text-sm font-medium ${
                      isGayMode ? 'text-gray-800' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Duration Distribution of Encounters */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
          isGayMode ? 'text-gray-800' : 'text-gray-900 dark:text-gray-100'
        }`}>
          ⏱️ Encounter Duration Distribution
        </h3>
        <div className={`rounded-lg p-4 ${
          isGayMode 
            ? 'bg-gradient-to-br from-white/90 to-gray-50/90' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="space-y-3">
            {Object.entries(durationDistribution)
              .sort(([a], [b]) => {
                const order = ['Quick (<30min)', 'Standard (30-60min)', 'Extended (1-2h)', 'Marathon (2-3h)', 'Epic (3h+)'];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([duration, count]) => {
                const percentage = encounters.length > 0 ? (count / encounters.length) * 100 : 0;
                const barColor = duration.includes('Quick') ? 'bg-red-500' :
                               duration.includes('Standard') ? 'bg-blue-500' :
                               duration.includes('Extended') ? 'bg-green-500' :
                               duration.includes('Marathon') ? 'bg-purple-500' : 'bg-orange-500';
                
                return (
                  <div key={duration} className="flex items-center space-x-3">
                    <div className={`w-24 text-sm font-medium ${
                      isGayMode ? 'text-gray-800' : 'text-gray-700 dark:text-gray-300'
                    }`}>{duration}</div>
                    <div className={`flex-1 rounded-full h-6 relative overflow-hidden ${
                      isGayMode ? 'bg-gray-100' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <div
                        className={`${barColor} h-6 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${Math.max(percentage, 0)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-medium drop-shadow-sm ${
                          percentage > 15 
                            ? 'text-white' 
                            : (isGayMode ? 'text-gray-800' : 'text-gray-800 dark:text-gray-200')
                        }`}>
                          {percentage > 5 ? `${percentage.toFixed(1)}%` : ''}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 text-sm font-medium ${
                      isGayMode ? 'text-gray-800' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Top 5 Countries */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
          isGayMode ? 'text-gray-800' : 'text-gray-900 dark:text-gray-100'
        }`}>
          🌍 Top 5 Countries
        </h3>
        <div className={`rounded-lg p-4 ${
          isGayMode 
            ? 'bg-gradient-to-br from-white/90 to-gray-50/90' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          {topCountries.length === 0 ? (
            <div className={`text-center py-4 ${
              isGayMode ? 'text-gray-600' : 'text-gray-500'
            }`}>
              No location data available
            </div>
          ) : (
            <div className="space-y-3">
              {topCountries.map(([country, count], index) => {
                const percentage = encounters.length > 0 ? (count / encounters.length) * 100 : 0;
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                
                return (
                  <div key={country} className="flex items-center space-x-3">
                    <div className="w-8 text-lg">{medals[index]}</div>
                    <div className={`w-24 text-sm font-medium truncate ${
                      isGayMode ? 'text-gray-800' : 'text-gray-700 dark:text-gray-300'
                    }`}>{country}</div>
                    <div className={`flex-1 rounded-full h-6 relative overflow-hidden ${
                      isGayMode ? 'bg-gray-100' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(percentage, 0)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-medium drop-shadow-sm ${
                          percentage > 15 
                            ? 'text-white' 
                            : (isGayMode ? 'text-gray-800' : 'text-gray-800 dark:text-gray-200')
                        }`}>
                          {percentage > 5 ? `${percentage.toFixed(1)}%` : ''}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 text-sm font-medium ${
                      isGayMode ? 'text-gray-800' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top 10 Activities */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          🔥 Top 10 Activities
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          {topActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No activity data available
            </div>
          ) : (
            <div className="space-y-4">
              {topActivities.map(([activity, stats], index) => {
                const activityType = interactionTypes.find(type => type.name === activity);
                const percentage = encounters.length > 0 ? (stats.total / encounters.length) * 100 : 0;
                
                return (
                  <div key={activity} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" 
                           style={{ backgroundColor: activityType?.color || '#6B7280', color: 'white' }}>
                        #{index + 1}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activityType?.color || '#6B7280' }}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Total: {stats.total} times
                        </div>
                      </div>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${Math.max(percentage, 2)}%`,
                            backgroundColor: activityType?.color || '#6B7280'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Breakdown: Main vs Secondary */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between bg-white dark:bg-gray-600 rounded px-2 py-1">
                        <span className="text-gray-600 dark:text-gray-300">As Main:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{stats.asMain}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white dark:bg-gray-600 rounded px-2 py-1">
                        <span className="text-gray-600 dark:text-gray-300">As Secondary:</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">{stats.asSecondary}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Your Performance Ratings
        </h3>
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
                  <div className="w-12 text-sm font-medium flex items-center gap-1">
                    <span>{rating}</span>
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
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
    </div>
  );
}