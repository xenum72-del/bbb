import { useActiveFriends, useInteractionTypes, useEncounter, useEncounters, encountersApi } from '../hooks/useDatabase';
import React, { useState, useEffect } from 'react';
import { convertToUSD } from '../utils/currency';
import type { Encounter } from '../db/schema';

interface EditEncounterProps {
  onNavigate: (page: string) => void;
  encounterId: number;
}

export default function EditEncounter({ onNavigate, encounterId }: EditEncounterProps) {
  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();
  const allEncounters = useEncounters();
  
  // Use the specific hook to get a single encounter
  const existingEncounter = useEncounter(encounterId);

  // Search queries for filtering
  const [searchQueries, setSearchQueries] = useState({
    activities: '',
    participants: '',
    location: ''
  });
  
  // Initialize form with existing data or redirect if not found
  useEffect(() => {
    // Only check for "not found" if the hook has finished loading (not undefined)
    if (existingEncounter === null) {
      console.error(`Encounter with ID ${encounterId} not found`);
      alert(`Encounter not found (ID: ${encounterId})`);
      onNavigate('timeline');
    }
  }, [existingEncounter, onNavigate, encounterId]);

  const [formData, setFormData] = useState({
    date: '',
    rating: 3,
    participants: [] as number[],
    isAnonymous: false,
    typeId: 1,
    activitiesPerformed: [] as number[],
    beneficiary: 'both' as 'me' | 'friend' | 'both',
    durationMinutes: '',
    location: { lat: '', lon: '', place: '' },
    tags: '',
    notes: '',
    // Payment fields
    isPaid: false,
    paymentType: 'given' as 'given' | 'received',
    amountAsked: '',
    amountGiven: '',
    currency: 'USD',
    paymentMethod: 'cash' as 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other',
    paymentNotes: ''
  });

  // Load existing encounter data into form when it's available
  useEffect(() => {
    if (existingEncounter) {
      setFormData({
        date: new Date(existingEncounter.date).toISOString().slice(0, 16),
        rating: existingEncounter.rating,
        participants: existingEncounter.participants || [],
        isAnonymous: existingEncounter.isAnonymous || false,
        typeId: existingEncounter.typeId,
        activitiesPerformed: existingEncounter.activitiesPerformed || [existingEncounter.typeId],
        beneficiary: existingEncounter.beneficiary || 'both',
        durationMinutes: existingEncounter.durationMinutes?.toString() || '',
        location: {
          lat: existingEncounter.location?.lat?.toString() || '',
          lon: existingEncounter.location?.lon?.toString() || '',
          place: existingEncounter.location?.place || ''
        },
        tags: existingEncounter.tags?.join(', ') || '',
        notes: existingEncounter.notes || '',
        // Payment fields
        isPaid: existingEncounter.isPaid || false,
        paymentType: existingEncounter.paymentType || 'given',
        amountAsked: existingEncounter.amountAsked?.toString() || '',
        amountGiven: existingEncounter.amountGiven?.toString() || '',
        currency: existingEncounter.currency || 'USD',
        paymentMethod: existingEncounter.paymentMethod || 'cash',
        paymentNotes: existingEncounter.paymentNotes || ''
      });
    }
  }, [existingEncounter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.isAnonymous && formData.participants.length === 0) {
      alert('Please select at least one friend or mark as anonymous');
      return;
    }
    
    if (formData.activitiesPerformed.length === 0) {
      alert('Please select at least one activity');
      return;
    }

    try {
      // Convert currency to USD if payment is involved
      let amountAskedUSD, amountGivenUSD, exchangeRate;
      
      if (formData.isPaid && formData.currency !== 'USD') {
        if (formData.amountAsked) {
          const askedConversion = await convertToUSD(parseFloat(formData.amountAsked), formData.currency);
          amountAskedUSD = askedConversion.amountUSD;
          exchangeRate = askedConversion.exchangeRate;
        }
        
        if (formData.amountGiven) {
          const givenConversion = await convertToUSD(parseFloat(formData.amountGiven), formData.currency);
          amountGivenUSD = givenConversion.amountUSD;
          exchangeRate = givenConversion.exchangeRate;
        }
      } else if (formData.isPaid && formData.currency === 'USD') {
        amountAskedUSD = formData.amountAsked ? parseFloat(formData.amountAsked) : undefined;
        amountGivenUSD = formData.amountGiven ? parseFloat(formData.amountGiven) : undefined;
        exchangeRate = 1;
      }

      const updatedEncounter: Encounter = {
        ...existingEncounter,
        id: encounterId,
        createdAt: existingEncounter!.createdAt,
        date: new Date(formData.date),
        rating: formData.rating,
        participants: formData.isAnonymous ? [] : formData.participants,
        isAnonymous: formData.isAnonymous,
        typeId: formData.activitiesPerformed[0] || formData.typeId,
        activitiesPerformed: formData.activitiesPerformed.length > 0 ? formData.activitiesPerformed : undefined,
        beneficiary: formData.beneficiary,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        notes: formData.notes.trim() || undefined,
        location: (formData.location.lat && formData.location.lon) ? {
          lat: parseFloat(formData.location.lat),
          lon: parseFloat(formData.location.lon),
          place: formData.location.place || undefined,
        } : undefined,
        // Payment fields with USD conversion
        isPaid: formData.isPaid,
        paymentType: formData.isPaid ? formData.paymentType : undefined,
        amountAsked: formData.isPaid && formData.amountAsked ? parseFloat(formData.amountAsked) : undefined,
        amountGiven: formData.isPaid && formData.amountGiven ? parseFloat(formData.amountGiven) : undefined,
        currency: formData.isPaid ? formData.currency : undefined,
        amountAskedUSD,
        amountGivenUSD,
        exchangeRate,
        paymentMethod: formData.isPaid ? formData.paymentMethod : undefined,
        paymentNotes: formData.isPaid && formData.paymentNotes.trim() ? formData.paymentNotes.trim() : undefined
      };
      
      await encountersApi.update(encounterId, updatedEncounter);
      onNavigate('timeline');
    } catch (error) {
      console.error('Error updating encounter:', error);
      alert('Failed to update encounter. Please try again.');
    }
  };

  // Show loading state while the encounter is being fetched
  if (existingEncounter === undefined) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-gray-500">Loading encounter...</div>
      </div>
    );
  }

  // If explicitly null, encounter was not found (handled by useEffect above)
  if (existingEncounter === null) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-gray-500">Encounter not found...</div>
      </div>
    );
  }

  // Get all existing tags from encounters for suggestions
  const existingTags = React.useMemo(() => {
    if (!allEncounters) return [];
    const tagSet = new Set<string>();
    allEncounters.forEach(encounter => {
      if (encounter.tags) {
        encounter.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [allEncounters]);

  const suggestedTags = [
    'first-time', 'repeat-client', 'regular', 'vip', 'quick-session', 'extended',
    'outcall', 'incall', 'hotel', 'car', 'outdoor', 'party', 'threesome', 'group',
    'vanilla', 'kinky', 'fetish', 'bdsm', 'roleplay', 'costume', 'fantasy',
    'romantic', 'passionate', 'rough', 'gentle', 'experimental', 'requested',
    'premium', 'budget', 'generous-tip', 'exact-amount', 'negotiated', 'discount',
    'excellent-hygiene', 'attractive', 'experienced', 'newbie', 'nervous', 'confident',
    'talkative', 'quiet', 'funny', 'serious', 'respectful', 'demanding',
    'morning', 'afternoon', 'evening', 'late-night', 'weekend', 'weekday',
    'business-trip', 'vacation', 'celebration', 'stress-relief', 'loneliness', 'curiosity',
    'highly-recommended', 'will-repeat', 'maybe-again', 'one-time-only', 'blocked'
  ];

  const availableTags = existingTags.length > 0 ? existingTags : suggestedTags;

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => onNavigate('timeline')}
          className="mr-3 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold">Edit Encounter</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Banner */}
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ You are editing an existing encounter. Changes will be saved permanently.
          </p>
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium mb-1">Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData(f => ({...f, date: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            required
          />
        </div>

        {/* Activities Performed */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Activities Performed * 
            <span className="text-xs text-gray-500 font-normal">
              ({formData.activitiesPerformed.length} selected)
            </span>
          </label>
          
          {/* Activities Search */}
          <input
            type="text"
            placeholder="🔍 Search activities..."
            value={searchQueries.activities}
            onChange={(e) => setSearchQueries(sq => ({...sq, activities: e.target.value}))}
            className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
          />
          
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
            {interactionTypes
              .filter(type => 
                searchQueries.activities === '' ||
                type.name.toLowerCase().includes(searchQueries.activities.toLowerCase())
              )
              .map(type => {
                const isSelected = formData.activitiesPerformed.includes(type.id!);
                return (
                  <label
                    key={type.id}
                    className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const typeId = type.id!;
                        setFormData(f => ({
                          ...f,
                          activitiesPerformed: e.target.checked
                            ? [...f.activitiesPerformed, typeId]
                            : f.activitiesPerformed.filter(id => id !== typeId),
                          typeId: e.target.checked && f.activitiesPerformed.length === 0 ? typeId : f.typeId
                        }));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-medium flex-1">{type.name}</span>
                  </label>
                );
              })}
          </div>
          {formData.activitiesPerformed.length === 0 && (
            <div className="text-xs text-red-500 mt-1">
              Please select at least one activity
            </div>
          )}
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rating: {formData.rating} stars
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData(f => ({...f, rating}))}
                className={`text-2xl ${
                  rating <= formData.rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium mb-1">Participants</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(f => ({...f, isAnonymous: e.target.checked, participants: e.target.checked ? [] : f.participants}))}
                className="rounded"
              />
              <span>Anonymous Encounter (no specific friends)</span>
            </label>
            
            {!formData.isAnonymous && (
              <>
                <input
                  type="text"
                  placeholder="🔍 Search friends..."
                  value={searchQueries.participants}
                  onChange={(e) => setSearchQueries(sq => ({...sq, participants: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
                  {friends
                    .filter(friend => 
                      searchQueries.participants === '' ||
                      friend.name.toLowerCase().includes(searchQueries.participants.toLowerCase())
                    )
                    .map(friend => (
                      <label key={friend.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.participants.includes(friend.id!)}
                          onChange={(e) => {
                            const friendId = friend.id!;
                            setFormData(f => ({
                              ...f,
                              participants: e.target.checked
                                ? [...f.participants, friendId]
                                : f.participants.filter(id => id !== friendId)
                            }));
                          }}
                          className="rounded"
                        />
                        <span>{friend.name}</span>
                      </label>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Beneficiary */}
        <div>
          <label className="block text-sm font-medium mb-1">Who Benefited</label>
          <div className="flex space-x-4">
            {[
              { value: 'me', label: '😊 Just Me', desc: 'I had all the fun' },
              { value: 'friend', label: '😍 Just Them', desc: 'They had all the fun' },
              { value: 'both', label: '🔥 Both of Us', desc: 'Mutual satisfaction' }
            ].map(option => (
              <label key={option.value} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="beneficiary"
                  value={option.value}
                  checked={formData.beneficiary === option.value}
                  onChange={(e) => setFormData(f => ({...f, beneficiary: e.target.value as 'me' | 'friend' | 'both'}))}
                  className="sr-only"
                />
                <div className={`p-3 border rounded-lg text-center transition-colors ${
                  formData.beneficiary === option.value 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}>
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => setFormData(f => ({...f, durationMinutes: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Optional"
            min="1"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(f => ({...f, tags: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            placeholder="Separate with commas: kinky, outcall, repeat-client"
          />
          
          <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {availableTags.slice(0, 20).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                  if (!currentTags.includes(tag)) {
                    setFormData(f => ({
                      ...f,
                      tags: currentTags.length > 0 ? `${f.tags}, ${tag}` : tag
                    }));
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(f => ({...f, notes: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            rows={3}
            placeholder="How did it go? What happened?"
          />
        </div>

        {/* Payment Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData(f => ({...f, isPaid: e.target.checked}))}
                className="rounded"
              />
              <span className="font-medium">💰 Money Involved</span>
            </label>
          </div>

          {formData.isPaid && (
            <div className="space-y-3">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Direction</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 p-2 rounded border flex-1">
                    <input
                      type="radio"
                      value="given"
                      checked={formData.paymentType === 'given'}
                      onChange={(e) => setFormData(f => ({...f, paymentType: e.target.value as 'given' | 'received'}))}
                    />
                    <span>💸 I Paid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 p-2 rounded border flex-1">
                    <input
                      type="radio"
                      value="received"
                      checked={formData.paymentType === 'received'}
                      onChange={(e) => setFormData(f => ({...f, paymentType: e.target.value as 'given' | 'received'}))}
                    />
                    <span>💵 I Got Paid</span>
                  </label>
                </div>
              </div>

              {/* Amount Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.paymentType === 'given' ? 'Amount Asked' : 'Amount I Asked For'}
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(f => ({...f, currency: e.target.value}))}
                      className="w-24 p-2 border rounded-l bg-white dark:bg-gray-700 border-r-0 text-sm"
                    >
                      <option value="USD">🇺🇸 USD</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="GBP">🇬🇧 GBP</option>
                      <option value="JPY">🇯🇵 JPY</option>
                      <option value="AUD">🇦🇺 AUD</option>
                      <option value="CAD">🇨🇦 CAD</option>
                      <option value="CHF">🇨🇭 CHF</option>
                      <option value="CNY">🇨🇳 CNY</option>
                      <option value="SEK">🇸🇪 SEK</option>
                      <option value="NZD">🇳🇿 NZD</option>
                      <option value="MXN">🇲🇽 MXN</option>
                      <option value="SGD">🇸🇬 SGD</option>
                      <option value="HKD">🇭🇰 HKD</option>
                      <option value="NOK">🇳🇴 NOK</option>
                      <option value="KRW">🇰🇷 KRW</option>
                      <option value="TRY">🇹🇷 TRY</option>
                      <option value="RUB">🇷🇺 RUB</option>
                      <option value="INR">🇮🇳 INR</option>
                      <option value="BRL">🇧🇷 BRL</option>
                      <option value="ZAR">🇿🇦 ZAR</option>
                    </select>
                    <input
                      type="number"
                      value={formData.amountAsked}
                      onChange={(e) => setFormData(f => ({...f, amountAsked: e.target.value}))}
                      className="flex-1 p-2 border rounded-r bg-white dark:bg-gray-700"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.paymentType === 'given' ? 'Amount Actually Paid' : 'Amount Actually Received'}
                  </label>
                  <div className="flex">
                    <div className="w-24 p-2 border rounded-l bg-gray-100 dark:bg-gray-600 border-r-0 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm">
                      {formData.currency === 'USD' ? '🇺🇸 $' : 
                       formData.currency === 'EUR' ? '🇪🇺 €' :
                       formData.currency === 'GBP' ? '🇬🇧 £' :
                       formData.currency === 'JPY' ? '🇯🇵 ¥' :
                       formData.currency === 'AUD' ? '🇦🇺 $' :
                       formData.currency === 'CAD' ? '🇨🇦 $' :
                       formData.currency === 'CHF' ? '🇨🇭 ₣' :
                       formData.currency === 'CNY' ? '🇨🇳 ¥' :
                       formData.currency === 'SEK' ? '🇸🇪 kr' :
                       formData.currency === 'NZD' ? '🇳🇿 $' :
                       formData.currency === 'MXN' ? '🇲🇽 $' :
                       formData.currency === 'SGD' ? '🇸🇬 $' :
                       formData.currency === 'HKD' ? '🇭🇰 $' :
                       formData.currency === 'NOK' ? '🇳🇴 kr' :
                       formData.currency === 'KRW' ? '🇰🇷 ₩' :
                       formData.currency === 'TRY' ? '🇹🇷 ₺' :
                       formData.currency === 'RUB' ? '🇷🇺 ₽' :
                       formData.currency === 'INR' ? '🇮🇳 ₹' :
                       formData.currency === 'BRL' ? '🇧🇷 R$' :
                       formData.currency === 'ZAR' ? '🇿🇦 R' : '🇺🇸 $'}
                    </div>
                    <input
                      type="number"
                      value={formData.amountGiven}
                      onChange={(e) => setFormData(f => ({...f, amountGiven: e.target.value}))}
                      className="flex-1 p-2 border rounded-r bg-white dark:bg-gray-700"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(f => ({...f, paymentMethod: e.target.value as 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other'}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="venmo">📱 Venmo</option>
                  <option value="cashapp">💚 Cash App</option>
                  <option value="paypal">🅿️ PayPal</option>
                  <option value="zelle">⚡ Zelle</option>
                  <option value="crypto">₿ Crypto</option>
                  <option value="gift">🎁 Gift/Items</option>
                  <option value="other">🔄 Other</option>
                </select>
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Details</label>
                <textarea
                  value={formData.paymentNotes}
                  onChange={(e) => setFormData(f => ({...f, paymentNotes: e.target.value}))}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700"
                  rows={2}
                  placeholder="Additional payment details, negotiations, etc..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => onNavigate('timeline')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}