import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { useAuthorization } from '@/components/solana/use-authorization';
import { useConnection } from '@/components/solana/solana-provider';
import { fetchProfile } from '@/components/utils/fetch-profile';

export interface Profile {
  name: string;
  email: string;
  bio: string;
  country: string;
  linkedin: string;
  userType: 'freelancer' | 'client';
}

interface IProfileContext {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  clearProfile: () => void;
  isProfileLoaded: boolean;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<IProfileContext>({} as any);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoaded, setLoaded] = useState(false);
  const { selectedAccount } = useAuthorization();
  const connection = useConnection();

  const refetchProfile = async () => {
    setLoaded(false);
    if (!selectedAccount) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    console.log('[ProfileContext] fetching for', selectedAccount?.publicKey.toString());
    const provider = new AnchorProvider(connection, { publicKey: selectedAccount.publicKey } as any, {
      commitment: 'processed',
    });
    console.log('[ProfileContext] provider created');
    const acc = await fetchProfile(selectedAccount.publicKey, provider);
    console.log('[ProfileContext] profile fetched', acc);
    if (acc) {
      setProfile({
        name: acc.name,
        email: acc.email,
        bio: acc.bio,
        country: acc.country,
        linkedin: acc.linkedin,
        userType: acc.authority.equals(selectedAccount.publicKey) ? 'freelancer' : 'client',
      });
      console.log('[ProfileContext] profile fetched', acc);
    } else {
      setProfile(null);
      console.log('[ProfileContext] profile not found');
    }
    setLoaded(true);
  };

  useEffect(() => {
    refetchProfile();
  }, [selectedAccount]);

  const clearProfile = () => setProfile(null);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile, isProfileLoaded, refetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);