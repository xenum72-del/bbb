import { useEncounters, encountersApi } from '../hooks/useDatabase';
import React, { useState, useEffect } from 'react';
import { convertToUSD } from '../utils/currency';
import type { Encounter } from '../db/schema';

interface EditEncounterProps {
  onNavigate: (page: string) => void;
  encounterId: number;
}

export default function EditEncounter({ onNavigate, encounterId }: EditEncounterProps) {
  const allEncounters = useEncounters();
  
  // Find the encounter to edit
  const existingEncounter = allEncounters?.find(e => e.id === encounterId);
  
  // Initialize form with existing data or redirect if not found
  useEffect(() => {
    if (allEncounters && !existingEncounter) {
      alert('Encounter not found');
      onNavigate('timeline');
    }
  }, [allEncounters, existingEncounter, onNavigate]);

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

  if (!existingEncounter) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-gray-500">Loading encounter...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Edit Encounter</h2>
        <button
          onClick={() => onNavigate('timeline')}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ You are editing an existing encounter. Changes will be saved permanently.
          </p>
        </div>

        {/* Date and Rating */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData(f => ({...f, date: e.target.value}))}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData(f => ({...f, rating}))}
                  className={`text-2xl ${formData.rating >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rest of the form - simplified version */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => onNavigate('timeline')}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}