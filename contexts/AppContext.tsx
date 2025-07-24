// contexts/AppContext.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFetchProjects } from '@/contexts/use-fetch-projects';
import { useCreateProject } from '@/components/data/dexhire-data-access';
import React, { createContext, useContext } from 'react';
import { Project } from '@/types';
import { BN } from '@coral-xyz/anchor';

interface AppContextType {
  projects: Project[];
  isLoading: boolean;
  refreshProjects: () => void;
  createProject: (data: any) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useFetchProjects();
  const createProjectMutation = useCreateProject();

  const refreshProjects = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const createProject = async (payload: {
    title: string;
    description: string;
    budget: number;
    deadline: string;
  }) => {
    await createProjectMutation.mutateAsync({
      name: payload.title,
      about: payload.description,
      price: new BN(payload.budget),
      deadline: new BN(Math.floor(new Date(payload.deadline).getTime() / 1000)),
    });
    refreshProjects();
    return 'ok';
  };

  return (
    <AppContext.Provider value={{ projects, isLoading, refreshProjects, createProject }}>
      {children}
    </AppContext.Provider>
  );
};