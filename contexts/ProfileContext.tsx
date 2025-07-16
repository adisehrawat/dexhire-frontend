import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  userType: 'freelancer' | 'client';
  bio?: string;
  linkedin?: string;
  country?: string;
  skills?: string[]; // Only for freelancer
}

interface ProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  isProfileLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  useEffect(() => {
    setIsProfileLoaded(true);
  }, []);

  const setProfile = (profile: UserProfile) => {
    setProfileState(profile);
  };

  const clearProfile = () => {
    setProfileState(null);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile, isProfileLoaded }}>
      {children}
    </ProfileContext.Provider>
  );
}; 