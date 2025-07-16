import { AppContextType, Conversation, Message, Project, Proposal } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    // Mock data for demonstration
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'E-commerce Website Development',
        description: 'Looking for a skilled developer to build a modern e-commerce platform with React and Node.js. The project includes user authentication, payment integration, and inventory management.',
        clientId: '2',
        client: {
          id: '2',
          email: 'client@example.com',
          firstName: 'Sarah',
          userType: 'client',
          createdAt: '2024-01-15T10:00:00Z',
          isVerified: true,
          location: 'San Francisco, CA',
          avatar: 'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=150&h=150'
        },
        budget: 3000,
        skills: ['React', 'Node.js', 'MongoDB', 'Stripe API'],
        status: 'open',
        createdAt: '2024-01-15T10:00:00Z',
        deadline: '2024-02-15T23:59:59Z',
        proposals: 12,
        isUrgent: true
      },
      {
        id: '2',
        title: 'Mobile App UI/UX Design',
        description: 'Need a creative designer to create modern, user-friendly designs for a fitness tracking mobile app. Looking for someone with experience in health and wellness applications.',
        clientId: '3',
        client: {
          id: '3',
          email: 'startup@example.com',
          firstName: 'Mike',
          userType: 'client',
          createdAt: '2024-01-10T14:30:00Z',
          isVerified: true,
          location: 'Austin, TX',
          avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150'
        },
        budget: 50,
        skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
        status: 'open',
        createdAt: '2024-01-10T14:30:00Z',
        deadline: '2024-02-01T23:59:59Z',
        proposals: 8,
        isUrgent: false
      },
      {
        id: '3',
        title: 'Python Data Analysis Script',
        description: 'Quick project to analyze sales data and generate insights. Need someone proficient in pandas, matplotlib, and data visualization.',
        clientId: '4',
        client: {
          id: '4',
          email: 'analytics@company.com',
          firstName: 'Emily',
          userType: 'client',
          createdAt: '2024-01-12T09:15:00Z',
          isVerified: true,
          location: 'Chicago, IL',
          avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150'
        },
        budget: 500,
        skills: ['Python', 'Pandas', 'Matplotlib', 'Data Analysis'],
        status: 'open',
        createdAt: '2024-01-12T09:15:00Z',
        proposals: 5,
        isUrgent: false
      }
    ];

    setProjects(mockProjects);
  };

  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>) => {
    setIsLoading(true);
    try {
      // Mock project creation
      const newProject: Project = {
        id: Date.now().toString(),
        title: projectData.title!,
        description: projectData.description!,
        // NOTE: In a real app, set clientId and client to the current user. Here, we use generic values.
        clientId: '1',
        client: {
          id: '1',
          email: 'client@example.com',
          firstName: 'John',
          userType: 'client',
          createdAt: new Date().toISOString(),
          isVerified: true
        },
        budget: projectData.budget!,
        skills: projectData.skills!,
        status: 'open',
        createdAt: new Date().toISOString(),
        proposals: 0,
        isUrgent: false,
        ...projectData
      };
      setProjects(prev => [newProject, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitProposal = async (proposal: Partial<Proposal>) => {
    setIsLoading(true);
    try {
      // Mock proposal submission
      const newProposal: Proposal = {
        id: Date.now().toString(),
        projectId: proposal.projectId!,
        // NOTE: In a real app, set freelancerId and freelancer to the current user. Here, we use generic values.
        freelancerId: '1',
        freelancer: {
          id: '1',
          email: 'freelancer@example.com',
          firstName: 'John',
          userType: 'freelancer',
          createdAt: new Date().toISOString(),
          isVerified: true
        },
        coverLetter: proposal.coverLetter!,
        proposedRate: proposal.proposedRate!,
        estimatedDuration: proposal.estimatedDuration!,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setProposals(prev => [newProposal, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: Partial<Message>) => {
    // Mock message sending
    console.log('Sending message:', message);
  };

  return (
    <AppContext.Provider value={{
      projects,
      proposals,
      conversations,
      currentProject,
      isLoading,
      refreshProjects,
      createProject,
      submitProposal,
      sendMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};