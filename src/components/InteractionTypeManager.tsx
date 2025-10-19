import { useState, useEffect } from 'react';
import { db, type InteractionType } from '../db/schema';
import { useInteractionTypes } from '../hooks/useDatabase';
import { updateSampleDataForTypeChanges, validateSampleDataIntegrity } from '../db/sampleData';

interface InteractionTypeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TypeUsageInfo {
  typeId: number;
  encounterCount: number;
  activityCount: number;
  totalUsage: number;
  typeName: string;
}

interface DeleteConfirmation {
  typeToDelete: InteractionType;
  usageInfo: TypeUsageInfo;
  replacementOptions: InteractionType[];
}

export default function InteractionTypeManager({ isOpen, onClose }: InteractionTypeManagerProps) {
  const interactionTypes = useInteractionTypes();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({});
  
  // Filter types based on search query
  const filteredTypes = interactionTypes.filter(type => 
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.icon.includes(searchQuery)
  );
  
  // New type form
  const [newType, setNewType] = useState({
    name: '',
    color: '#4CAF50',
    icon: '🎯'
  });

  // Load usage counts for all types
  const loadUsageCounts = async () => {
    const counts: Record<number, number> = {};
    for (const type of interactionTypes) {
      if (type.id) {
        const usage = await getTypeUsage(type.id);
        counts[type.id] = usage.totalUsage;
      }
    }
    setUsageCounts(counts);
  };

  // Reset form and load usage counts when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewType({ name: '', color: '#4CAF50', icon: '🎯' });
      setShowAddForm(false);
      setDeleteConfirmation(null);
      loadUsageCounts();
      
      // Validate sample data integrity (non-blocking)
      validateSampleDataIntegrity().catch(error => 
        console.warn('Sample data validation failed (non-critical):', error)
      );
    }
  }, [isOpen, interactionTypes]);

  const getTypeUsage = async (typeId: number): Promise<TypeUsageInfo> => {
    // Count encounters where this is the main type
    const encounterCount = await db.encounters
      .where('typeId')
      .equals(typeId)
      .count();

    // Count encounters where this appears in activitiesPerformed
    const allEncounters = await db.encounters.toArray();
    const activityCount = allEncounters.filter(e => 
      e.activitiesPerformed?.includes(typeId)
    ).length;

    const type = interactionTypes.find(t => t.id === typeId);
    
    return {
      typeId,
      encounterCount,
      activityCount,
      totalUsage: encounterCount + activityCount,
      typeName: type?.name || 'Unknown'
    };
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      alert('Please enter a type name');
      return;
    }

    // Check for duplicate names
    const existingType = interactionTypes.find(t => 
      t.name.toLowerCase() === newType.name.trim().toLowerCase()
    );
    
    if (existingType) {
      alert('A type with this name already exists');
      return;
    }

    try {
      setIsProcessing(true);
      
      await db.interactionTypes.add({
        name: newType.name.trim(),
        color: newType.color,
        icon: newType.icon,
        isDefault: false // Keep for backwards compatibility with existing data
      });

      setNewType({ name: '', color: '#4CAF50', icon: '🎯' });
      setShowAddForm(false);
      alert('Interaction type added successfully!');
    } catch (error) {
      console.error('Error adding type:', error);
      alert('Failed to add interaction type');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteType = async (typeToDelete: InteractionType) => {
    if (!typeToDelete.id) return;

    try {
      setIsProcessing(true);
      
      // Get usage information
      const usageInfo = await getTypeUsage(typeToDelete.id);
      
      if (usageInfo.totalUsage === 0) {
        // Safe to delete - no usage
        await db.interactionTypes.delete(typeToDelete.id);
        alert('Interaction type deleted successfully!');
      } else {
        // Need user confirmation and replacement selection
        const replacementOptions = interactionTypes.filter(t => 
          t.id !== typeToDelete.id // Exclude the type being deleted
        );
        
        setDeleteConfirmation({
          typeToDelete,
          usageInfo,
          replacementOptions
        });
      }
    } catch (error) {
      console.error('Error checking type usage:', error);
      alert('Failed to check type usage');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteWithReplacement = async (replacementTypeId: number) => {
    if (!deleteConfirmation?.typeToDelete.id) return;

    try {
      setIsProcessing(true);
      
      const typeIdToDelete = deleteConfirmation.typeToDelete.id;
      
      await db.transaction('rw', [db.encounters, db.interactionTypes], async () => {
        // Update encounters where this is the main typeId
        await db.encounters
          .where('typeId')
          .equals(typeIdToDelete)
          .modify({ typeId: replacementTypeId });

        // Update encounters where this appears in activitiesPerformed
        const encountersWithActivity = await db.encounters
          .filter(e => Boolean(e.activitiesPerformed?.includes(typeIdToDelete)))
          .toArray();

        for (const encounter of encountersWithActivity) {
          if (encounter.activitiesPerformed && encounter.id) {
            const updatedActivities = encounter.activitiesPerformed.map(id => 
              id === typeIdToDelete ? replacementTypeId : id
            );
            
            await db.encounters.update(encounter.id, {
              activitiesPerformed: updatedActivities
            });
          }
        }

        // Finally, delete the type
        await db.interactionTypes.delete(typeIdToDelete);
      });

      // Update any sample data that might reference the deleted type
      try {
        await updateSampleDataForTypeChanges(typeIdToDelete, replacementTypeId);
      } catch (sampleError) {
        console.warn('Sample data update failed (non-critical):', sampleError);
      }

      const replacementType = deleteConfirmation.replacementOptions.find(t => t.id === replacementTypeId);
      alert(`Type deleted successfully! All ${deleteConfirmation.usageInfo.totalUsage} references have been moved to "${replacementType?.name}"`);
      
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting type with replacement:', error);
      alert('Failed to delete type. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        
        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                ⚠️ Confirm Deletion
              </h3>
              
              <div className="space-y-4">
                <p>
                  You're about to delete "<strong>{deleteConfirmation.typeToDelete.name}</strong>".
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Usage Impact:
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• {deleteConfirmation.usageInfo.encounterCount} encounters use this as main type</li>
                    <li>• {deleteConfirmation.usageInfo.activityCount} encounters include this in activities</li>
                    <li>• <strong>Total: {deleteConfirmation.usageInfo.totalUsage} references</strong></li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Choose replacement type for all existing data:
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      if (selectedId) {
                        confirmDeleteWithReplacement(selectedId);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select replacement type...</option>
                    {deleteConfirmation.replacementOptions.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Manage Interaction Types</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Add new types or safely remove unused ones
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Add New Type Section */}
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-600 dark:text-green-400 text-sm">Add New Type</h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
              >
                {showAddForm ? 'Cancel' : '+ Add Type'}
              </button>
            </div>

            {showAddForm && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={newType.name}
                      onChange={(e) => setNewType({...newType, name: e.target.value})}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                      placeholder="e.g., Netflix & Chill"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Color</label>
                    <input
                      type="color"
                      value={newType.color}
                      onChange={(e) => setNewType({...newType, color: e.target.value})}
                      className="w-full h-9 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      value={newType.icon}
                      onChange={(e) => setNewType({...newType, icon: e.target.value})}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                      placeholder="🎯"
                      maxLength={2}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddType}
                  disabled={isProcessing || !newType.name.trim()}
                  className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                >
                  {isProcessing ? 'Adding...' : 'Add Type'}
                </button>
              </div>
            )}
          </div>

          {/* Existing Types List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Current Types ({filteredTypes.length}{searchQuery && ` of ${interactionTypes.length}`})</h4>
            </div>
            
            {/* Search Input */}
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Search types by name or icon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pr-8 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            
            {filteredTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? (
                  <div>
                    <p>No types found matching "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <p>No interaction types found</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredTypes.map(type => (
                <div
                  key={type.id}
                  className="p-3 border rounded bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span style={{ color: type.color }} className="text-base flex-shrink-0">
                        {type.icon}
                      </span>
                      <span className="font-medium text-sm truncate">{type.name}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteType(type)}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 flex-shrink-0 ml-2"
                      title="Delete this type"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Used {usageCounts[type.id!] || 0} times
                  </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Warning */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">ℹ️</span>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Safe Type Management:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• When deleting a type that's in use, you'll choose a replacement</li>
                  <li>• All existing encounters will be automatically updated</li>
                  <li>• Adding new types never affects existing data</li>
                  <li>• No data is ever lost - everything gets safely migrated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}