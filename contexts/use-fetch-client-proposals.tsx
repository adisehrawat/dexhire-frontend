import { useFetchClientProposals } from '@/components/data/dexhire-data-access';
import { Proposal } from '@/types';
import React, { createContext, useContext } from 'react';

interface ClientProposalsContextType {
  proposals: Proposal[];
  isLoading: boolean;
  refetch: () => Promise<any>;
}

const ClientProposalsContext = createContext<ClientProposalsContextType | undefined>(undefined);

export const useClientProposals = () => {
  const ctx = useContext(ClientProposalsContext);
  if (!ctx) throw new Error('useClientProposals must be used within ClientProposalsProvider');
  return ctx;
};

export const ClientProposalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: proposals = [], isLoading, refetch } = useFetchClientProposals();

  console.log('[ClientProposalsProvider] proposals:', proposals);
  console.log('[ClientProposalsProvider] isLoading:', isLoading);

  return (
    <ClientProposalsContext.Provider value={{ proposals, isLoading, refetch }}>
      {children}
    </ClientProposalsContext.Provider>
  );
}; 