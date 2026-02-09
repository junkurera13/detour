import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface EventsContextType {
  joinedIds: string[];
  savedIds: string[];
  isJoined: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  toggleJoin: (id: string) => void;
  toggleSave: (id: string) => void;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const isJoined = useCallback((id: string) => joinedIds.includes(id), [joinedIds]);
  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleJoin = useCallback((id: string) => {
    setJoinedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  return (
    <EventsContext.Provider value={{ joinedIds, savedIds, isJoined, isSaved, toggleJoin, toggleSave }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
