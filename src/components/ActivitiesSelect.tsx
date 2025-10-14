import { useInteractionTypes } from '../hooks/useDatabase';

interface ActivitiesSelectProps {
  selectedActivities: number[];
  onActivitiesChange: (activities: number[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  required?: boolean;
  className?: string;
}

export default function ActivitiesSelect({
  selectedActivities,
  onActivitiesChange,
  searchQuery,
  onSearchChange,
  required = false,
  className = ''
}: ActivitiesSelectProps) {
  const interactionTypes = useInteractionTypes();

  const handleActivityToggle = (activityId: number) => {
    const isSelected = selectedActivities.includes(activityId);
    if (isSelected) {
      onActivitiesChange(selectedActivities.filter(id => id !== activityId));
    } else {
      onActivitiesChange([...selectedActivities, activityId]);
    }
  };

  const filteredActivities = interactionTypes.filter(activity =>
    searchQuery === '' ||
    activity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium mb-1">
        Activities Performed {required && '*'}
        {selectedActivities.length > 0 && (
          <span className="text-xs text-gray-500 ml-2">
            ({selectedActivities.length} selected)
          </span>
        )}
      </label>

      {/* Search Input */}
      <input
        type="text"
        placeholder="🔍 Search activities..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full p-2 mb-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
      />

      {/* Activities Grid */}
      <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
        {filteredActivities.map((activity) => {
          const isSelected = selectedActivities.includes(activity.id!);
          
          return (
            <label
              key={activity.id}
              className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
              } border`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleActivityToggle(activity.id!)}
                className="rounded text-blue-600"
              />
              <span className="text-lg">{activity.icon}</span>
              <span className="font-medium flex-1">{activity.name}</span>
            </label>
          );
        })}
      </div>

      {/* Validation Message */}
      {required && selectedActivities.length === 0 && (
        <div className="text-xs text-red-500 mt-1">
          Please select at least one activity
        </div>
      )}
    </div>
  );
}