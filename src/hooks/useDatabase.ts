import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Friend, type Encounter, type InteractionType, type Settings } from '../db/schema';

// Friends hooks
export function useFriends() {
  return useLiveQuery(() => db.friends.orderBy('name').toArray()) || [];
}

export function useActiveFriends() {
  return useLiveQuery(() => 
    db.friends.filter(f => !f.isArchived).sortBy('name')
  ) || [];
}

export function useFriend(id?: number) {
  return useLiveQuery(() => id ? db.friends.get(id) : undefined, [id]);
}

// Encounters hooks
export function useEncounters(limit?: number) {
  return useLiveQuery(() => {
    let query = db.encounters.orderBy('date').reverse();
    if (limit) {
      query = query.limit(limit);
    }
    return query.toArray();
  }) || [];
}

export function useEncounter(id?: number) {
  return useLiveQuery(() => id ? db.encounters.get(id) : undefined, [id]);
}

export function useEncountersByFriend(friendId?: number) {
  return useLiveQuery(() => 
    friendId 
      ? db.encounters.where('participants').anyOf([friendId]).reverse().sortBy('date')
      : []
  , [friendId]) || [];
}

// Interaction types hooks
export function useInteractionTypes() {
  return useLiveQuery(() => db.interactionTypes.orderBy('name').toArray()) || [];
}

export function useInteractionType(id?: number) {
  return useLiveQuery(() => id ? db.interactionTypes.get(id) : undefined, [id]);
}

// Settings hooks
export function useSettings() {
  return useLiveQuery(() => db.settings.orderBy('id').first());
}

// CRUD operations
export const friendsApi = {
  async create(friend: Omit<Friend, 'id' | 'createdAt'>) {
    return db.friends.add({
      ...friend,
      createdAt: new Date(),
    });
  },

  async update(id: number, changes: Partial<Omit<Friend, 'id' | 'createdAt'>>) {
    return db.friends.update(id, {
      ...changes,
      updatedAt: new Date(),
    });
  },

  async delete(id: number) {
    return db.friends.delete(id);
  },

  async archive(id: number) {
    return db.friends.update(id, { 
      isArchived: true, 
      updatedAt: new Date() 
    });
  },

  async unarchive(id: number) {
    return db.friends.update(id, { 
      isArchived: false, 
      updatedAt: new Date() 
    });
  }
};

export const encountersApi = {
  async create(encounter: Omit<Encounter, 'id' | 'createdAt'>) {
    return db.encounters.add({
      ...encounter,
      createdAt: new Date(),
    });
  },

  async update(id: number, changes: Partial<Omit<Encounter, 'id' | 'createdAt'>>) {
    return db.encounters.update(id, {
      ...changes,
      updatedAt: new Date(),
    });
  },

  async delete(id: number) {
    return db.encounters.delete(id);
  }
};

export const interactionTypesApi = {
  async create(type: Omit<InteractionType, 'id'>) {
    return db.interactionTypes.add(type);
  },

  async update(id: number, changes: Partial<Omit<InteractionType, 'id'>>) {
    return db.interactionTypes.update(id, changes);
  },

  async delete(id: number) {
    return db.interactionTypes.delete(id);
  }
};

export const settingsApi = {
  async update(changes: Partial<Omit<Settings, 'id'>>) {
    const settings = await db.settings.orderBy('id').first();
    if (settings) {
      return db.settings.update(settings.id!, changes);
    } else {
      return db.settings.add(changes as Settings);
    }
  }
};