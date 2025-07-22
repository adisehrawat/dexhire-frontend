import { useProfile } from '@/contexts/ProfileContext';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDexhireProgram } from '../profile-imports/freelancerProfile-data-access'; // ✅ Updated import
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useWalletUi } from '@/components/solana/use-wallet-ui';

interface ProfileCreateModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileCreateModal: React.FC<ProfileCreateModalProps> = ({ visible, onClose }) => {
  const { setProfile } = useProfile();
  const queryClient = useQueryClient();
  const { createFreelancer, accounts } = useDexhireProgram(); // ✅ Pull in account list and create mutation
  const { account } = useWalletUi();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'freelancer' | 'client'>('freelancer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileJustCreated, setProfileJustCreated] = useState(false);

  const existingProfile = accounts?.data;
  const isLoadingAccounts = accounts?.isLoading;

  // Reset form and loading state when modal is closed
  useEffect(() => {
    if (!visible) {
      setSubmitting(false);
      setProfileJustCreated(false);
      setName('');
      setEmail('');
      setError(null);
      setUserType('freelancer');
    }
  }, [visible]);

  useEffect(() => {
    if (profileJustCreated && existingProfile) {
      const newProfile = existingProfile.find((p: any) =>
        p.account.authority.toBase58() === account?.publicKey.toBase58()
      );
      if (newProfile) {
        setProfile({
          name: newProfile.account.name,
          email: newProfile.account.email,
          userType: 'freelancer',
          linkedin: newProfile.account.linkedin || '',
          country: newProfile.account.country || '',
        });
        setProfileJustCreated(false);
        setSubmitting(false);
        onClose();
      }
    }
  }, [existingProfile, setProfile, account?.publicKey, onClose, profileJustCreated]);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }

    const alreadyExists = existingProfile?.some(profile =>
      profile.account.authority.toBase58() === account?.publicKey.toBase58()
    );

    if (alreadyExists) {
      setError('You already have a profile tied to your wallet.');
      return;
    }

    setSubmitting(true);
    try {
      if (userType === 'freelancer') {
        await createFreelancer.mutateAsync({ name, email });
        setSubmitting(false);
      } else {
        // Future: Handle client profile logic here
      }

      await accounts.refetch();
      setProfileJustCreated(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to create profile.');
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create Your Profile</Text>
          {/* Remove checkingProfile and existingProfile logic from UI */}
          {/* {checkingProfile ? (
            <Text style={styles.loadingText}>Checking existing profile...</Text>
          ) : existingProfile ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                You already have a {existingProfile.map(profile => profile.publicKey.toBase58())} profile. You cannot create another profile.
              </Text>
              <Button
                title="Close"
                onPress={onClose}
                style={styles.button}
              />
            </View>
          ) : ( */}
            {/* Always show the form now */}
            <>
              <View style={styles.userTypeContainer}>
                <Text style={styles.userTypeLabel}>I am a:</Text>
                <View style={styles.userTypeButtons}>
                  <TouchableOpacity
                    style={[styles.userTypeButton, userType === 'freelancer' && styles.userTypeButtonActive]}
                    onPress={() => setUserType('freelancer')}
                  >
                    <Text style={[styles.userTypeButtonText, userType === 'freelancer' && styles.userTypeButtonTextActive]}>Freelancer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.userTypeButton, userType === 'client' && styles.userTypeButtonActive]}
                    onPress={() => setUserType('client')}
                  >
                    <Text style={[styles.userTypeButtonText, userType === 'client' && styles.userTypeButtonTextActive]}>Client</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                required
              />
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                required
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Button
                title={submitting ? 'Saving...' : 'Create Profile'}
                onPress={handleSubmit}
                disabled={submitting}
                loading={submitting}
                style={styles.button}
              />
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          {/* )} */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 24,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  userTypeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  userTypeButtonTextActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    width: '100%',
  },
  cancelButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 24,
  },
});

export default ProfileCreateModal;
