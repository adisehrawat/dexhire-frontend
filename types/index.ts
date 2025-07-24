// Core data types for the freelancer marketplace
export interface User {
  id: string;
  email: string;
  firstName: string;
  avatar?: string;
  userType: 'freelancer' | 'client';
  createdAt: string;
  isVerified: boolean;
  location?: string;
  bio?: string;
  skills?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  client: User;
  budget: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  deadline?: string;
  proposals: number;
  attachments?: string[];
}

export interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancer: User;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  updatedAt: string;
  projectId?: string;
}

export interface Review {
  id: string;
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Partial<User>, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export interface AppContextType {
  projects: Project[];
  proposals: Proposal[];
  conversations: Conversation[];
  currentProject: Project | null;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<void>;
  submitProposal: (proposal: Partial<Proposal>) => Promise<void>;
  sendMessage: (message: Partial<Message>) => Promise<void>;
}