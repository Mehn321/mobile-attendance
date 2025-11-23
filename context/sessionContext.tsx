import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllSections, Section } from '@/lib/database';

interface SessionContextType {
  selectedSection: Section | null;
  setSelectedSection: (section: Section | null) => void;
  sections: Section[];
  loading: boolean;
  refreshSections: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshSections();
  }, []);

  const refreshSections = async () => {
    setLoading(true);
    try {
      const sectionsList = await getAllSections();
      setSections(sectionsList);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        selectedSection,
        setSelectedSection,
        sections,
        loading,
        refreshSections,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
