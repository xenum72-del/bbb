import { useState, useEffect } from 'react';
import type { Encounter } from '../db/schema';
import ActivitiesSelect from './ActivitiesSelect';
import ParticipantsSelect from './ParticipantsSelect';
import LocationInput from './LocationInput';
import PaymentSection from './PaymentSection';
import TagsInput from './TagsInput';
import PhotoManager from './PhotoManager';
import { convertToUSD } from '../utils/currency';
import { encountersApi } from '../hooks/useDatabase';
import { showBackupPrompt, triggerAutoAzureBackup, shouldShowBackupPrompt } from '../utils/backup';

interface EncounterFormData {
  date: string;
  rating: number;
  participants: number[];
  isAnonymous: boolean;
  typeId: number;
  activitiesPerformed: number[];
  beneficiary: 'me' | 'friend' | 'both';
  durationMinutes: string;
  location: { lat: string; lon: string; place: string };
  tags: string;
  notes: string;
  photos: string[];
  // Payment fields
  isPaid: boolean;
  paymentType: 'given' | 'received';
  amountAsked: string;
  amountGiven: string;
  currency: string;
  paymentMethod: 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other';
  paymentNotes: string;
}

interface EncounterFormProps {
  mode: 'add' | 'edit';
  existingEncounter?: Encounter;
  onSubmit: (success: boolean) => void;
  onCancel: () => void;
  availableTags: string[];
}

export default function EncounterForm({
  mode,
  existingEncounter,
  onSubmit,
  onCancel,
  availableTags
}: EncounterFormProps) {
  const [searchQueries, setSearchQueries] = useState({
    activities: '',
    participants: '',
    location: ''
  });

  const [formData, setFormData] = useState<EncounterFormData>({
    date: new Date().toISOString().slice(0, 16),
    rating: 3,
    participants: [],
    isAnonymous: false,
    typeId: 1,
    activitiesPerformed: [],
    beneficiary: 'both',
    durationMinutes: '',
    location: { lat: '', lon: '', place: '' },
    tags: '',
    notes: '',
    photos: [],
    // Payment fields
    isPaid: false,
    paymentType: 'given',
    amountAsked: '',
    amountGiven: '',
    currency: 'USD',
    paymentMethod: 'cash',
    paymentNotes: ''
  });

  // Load existing encounter data when editing
  useEffect(() => {
    if (mode === 'edit' && existingEncounter) {
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
        photos: existingEncounter.photos || [],
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
  }, [mode, existingEncounter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.isAnonymous && formData.participants.length === 0) {
      alert('Please select at least one participant or mark as anonymous');
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

      const encounterData = {
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
        photos: formData.photos.length > 0 ? formData.photos : undefined,
        // Payment fields
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
      
      if (mode === 'add') {
        await encountersApi.create(encounterData);
      } else if (existingEncounter) {
        await encountersApi.update(existingEncounter.id!, encounterData);
      }
      
      // Trigger automatic Azure backup (async, non-blocking)
      triggerAutoAzureBackup().catch(err => 
        console.warn('Auto Azure backup failed:', err)
      );
      
      // Show manual backup prompt only if auto backup is not enabled
      if (shouldShowBackupPrompt()) {
        setTimeout(() => {
          showBackupPrompt();
        }, 100);
      }
      
      onSubmit(true);
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'creating' : 'updating'} encounter:`, error);
      alert(`Failed to ${mode === 'add' ? 'save' : 'update'} encounter. Please try again.`);
      onSubmit(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={onCancel}
          className="mr-3 text-primary"
        >
          ← Cancel
        </button>
        <h2 className="text-xl font-bold">
          {mode === 'add' ? 'Add Encounter' : 'Edit Encounter'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium mb-1">Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData(f => ({...f, date: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        {/* Activities */}
        <ActivitiesSelect
          selectedActivities={formData.activitiesPerformed}
          onActivitiesChange={(activities) => setFormData(f => ({...f, activitiesPerformed: activities}))}
          searchQuery={searchQueries.activities}
          onSearchChange={(query) => setSearchQueries(sq => ({...sq, activities: query}))}
          required
        />

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
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <ParticipantsSelect
          selectedParticipants={formData.participants}
          onParticipantsChange={(participants) => setFormData(f => ({...f, participants}))}
          isAnonymous={formData.isAnonymous}
          onAnonymousChange={(isAnonymous) => setFormData(f => ({...f, isAnonymous}))}
          searchQuery={searchQueries.participants}
          onSearchChange={(query) => setSearchQueries(sq => ({...sq, participants: query}))}
        />

        {/* Beneficiary */}
        <div>
          <label className="block text-sm font-medium mb-2">Who benefited from this encounter?</label>
          <div className="flex space-x-4">
            {[
              { value: 'me', label: 'Mostly me', icon: '😊' },
              { value: 'friend', label: 'Mostly them', icon: '🥰' },
              { value: 'both', label: 'Both equally', icon: '🤝' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="beneficiary"
                  value={option.value}
                  checked={formData.beneficiary === option.value}
                  onChange={(e) => setFormData(f => ({...f, beneficiary: e.target.value as any}))}
                  className="text-blue-600"
                />
                <span className="text-sm">{option.icon} {option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            min="1"
            value={formData.durationMinutes}
            onChange={(e) => setFormData(f => ({...f, durationMinutes: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
            placeholder="How long did it last?"
          />
        </div>

        {/* Location */}
        <LocationInput
          location={formData.location}
          onLocationChange={(location) => setFormData(f => ({...f, location}))}
        />

        {/* Tags */}
        <TagsInput
          tags={formData.tags}
          onTagsChange={(tags) => setFormData(f => ({...f, tags}))}
          availableTags={availableTags}
        />

        {/* Photos */}
        <PhotoManager
          photos={formData.photos}
          onPhotosChange={(photos) => setFormData(f => ({...f, photos}))}
        />

        {/* Payment */}
        <PaymentSection
          paymentData={{
            isPaid: formData.isPaid,
            paymentType: formData.paymentType,
            amountAsked: formData.amountAsked,
            amountGiven: formData.amountGiven,
            currency: formData.currency,
            paymentMethod: formData.paymentMethod,
            paymentNotes: formData.paymentNotes
          }}
          onPaymentChange={(data) => setFormData(f => ({...f, ...data}))}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(f => ({...f, notes: e.target.value}))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
            rows={3}
            placeholder="Any additional details, thoughts, or memories..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {mode === 'add' ? 'Save Encounter' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}