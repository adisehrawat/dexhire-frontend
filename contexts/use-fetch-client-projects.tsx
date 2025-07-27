// contexts/ClientProjectsContext.tsx
import React, { createContext, useContext } from 'react';
import { useFetchClientProjects } from '@/components/data/dexhire-data-access';
import { Project } from '@/types';

interface ClientProjectsCtx {
  projects: Project[];
  isLoading: boolean;
  refetch: () => void;
}

const ClientProjectsContext = createContext<ClientProjectsCtx>({
  projects: [],
  isLoading: false,
  refetch: () => {},
});

export const ClientProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data = [], isLoading, refetch } = useFetchClientProjects();

  return (
    <ClientProjectsContext.Provider value={{ projects: data, isLoading, refetch }}>
      {children}
    </ClientProjectsContext.Provider>
  );
};

export const useClientProjects = () => useContext(ClientProjectsContext);