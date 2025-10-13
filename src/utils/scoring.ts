import { db, type Friend } from '../db/schema';
import dayjs from 'dayjs';

export interface FriendScore {
  friend: Friend;
  score: number;
  frequency: number;
  recency: number;
  quality: number;
  mutuality: number;
  encounterCount: number;
  lastSeen?: Date;
  averageRating: number;
}

export async function calculateFriendScore(
  friendId: number,
  weights = { frequency: 0.35, recency: 0.25, quality: 0.30, mutuality: 0.10 }
): Promise<FriendScore | null> {
  const friend = await db.friends.get(friendId);
  if (!friend) return null;

  const encounters = await db.encounters
    .where('participants')
    .anyOf([friendId])
    .toArray();

  if (encounters.length === 0) {
    return {
      friend,
      score: 0,
      frequency: 0,
      recency: 0,
      quality: 0,
      mutuality: 0,
      encounterCount: 0,
      averageRating: 0
    };
  }

  const now = dayjs();
  const ninetyDaysAgo = now.subtract(90, 'day');

  // Frequency: encounters in last 90 days
  const recentEncounters = encounters.filter(e => 
    dayjs(e.date).isAfter(ninetyDaysAgo)
  );
  const frequency = Math.min(recentEncounters.length / 10, 1); // Cap at 10 encounters

  // Recency: exponential decay based on last seen
  const lastEncounter = encounters.reduce((latest, current) => 
    dayjs(current.date).isAfter(dayjs(latest.date)) ? current : latest
  );
  const daysSinceLastSeen = now.diff(dayjs(lastEncounter.date), 'day');
  const recency = Math.exp(-daysSinceLastSeen / 30); // 30-day half-life

  // Quality: average rating normalized 0-1
  const totalRating = encounters.reduce((sum, e) => sum + e.rating, 0);
  const averageRating = totalRating / encounters.length;
  const quality = (averageRating - 1) / 4; // Convert 1-5 scale to 0-1

  // Mutuality: percentage of encounters marked as "both" benefited
  const mutualEncounters = encounters.filter(e => e.beneficiary === 'both').length;
  const mutuality = mutualEncounters / encounters.length;

  // Calculate weighted score
  const score = (
    weights.frequency * frequency +
    weights.recency * recency +
    weights.quality * quality +
    weights.mutuality * mutuality
  );

  return {
    friend,
    score,
    frequency,
    recency,
    quality,
    mutuality,
    encounterCount: encounters.length,
    lastSeen: lastEncounter.date,
    averageRating
  };
}

export async function calculateAllFriendScores(
  weights?: { frequency: number; recency: number; quality: number; mutuality: number }
): Promise<FriendScore[]> {
  const friends = await db.friends.filter(f => !f.isArchived).toArray();
  const scores: FriendScore[] = [];

  for (const friend of friends) {
    const score = await calculateFriendScore(friend.id!, weights);
    if (score) {
      scores.push(score);
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return '#22c55e'; // green-500
  if (score >= 0.6) return '#eab308'; // yellow-500
  if (score >= 0.4) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

export function getScoreLabel(score: number): string {
  if (score >= 0.8) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  return 'Needs Attention';
}