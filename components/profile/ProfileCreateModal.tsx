import { useProfile } from '@/contexts/ProfileContext';
import { PublicKey } from '@solana/web3.js';
import { Briefcase, User, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
    useDexhireProgram,
    useDexhireProgramAccount,
} from "../profile-imports/profile-data-access";

interface ProfileCreateModalProps {
  visible: boolean;
  onClose: () => void;
}

const ProfileCreateModal: React.FC<ProfileCreateModalProps> = ({ visible, onClose }) => {
  const { setProfile } = useProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'freelancer' | 'client'>('freelancer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createFreelancer, createClient, accounts } = useDexhireProgram();
  // Always call the hook with a fallback key, but only use the result if accounts is available
  const fallbackKey = useMemo(() => new PublicKey('11111111111111111111111111111111'), []);
  const { freelancerQuery, clientQuery } = useDexhireProgramAccount({ account: accounts?.freelanceprofile ?? fallbackKey });
  const walletConnected = !!accounts && !!accounts.freelanceprofile && !!accounts.clientprofile;

  const handleSubmit = async () => {
    setError(null);
    if (!walletConnected) {
      setError('Wallet not connected. Please connect your wallet.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }
    setSubmitting(true);
    try {
      if (userType === 'freelancer') {
        await createFreelancer.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          bio: '',
          linkedin: '',
          country: '',
          skills: [],
          avatar: '',
          authority: accounts.freelanceprofile
        });
      } else {
        await createClient.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          bio: '',
          linkedin: '',
          country: '',
          avatar: '',
          authority: accounts.clientprofile
        });
      }
      setProfile({ name: name.trim(), email: email.trim(), userType });
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create profile.');
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Your Profile</Text>
          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeLabel}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'freelancer' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('freelancer')}
              >
                <User size={20} color={userType === 'freelancer' ? '#2563EB' : '#6B7280'} />
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'freelancer' && styles.userTypeButtonTextActive
                ]}>
                  Freelancer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'client' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('client')}
              >
                <Briefcase size={20} color={userType === 'client' ? '#2563EB' : '#6B7280'} />
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'client' && styles.userTypeButtonTextActive
                ]}>
                  Client
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
          {!walletConnected && <Text style={{ color: 'red', marginBottom: 8 }}>Wallet not connected.</Text>}
          <TouchableOpacity
            style={[styles.button, (!walletConnected || submitting) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!walletConnected || submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Save Profile'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#111827',
  },
  userTypeContainer: {
    marginBottom: 16,
    width: '100%',
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  userTypeButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF8FF',
  },
  userTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  userTypeButtonTextActive: {
    color: '#2563EB',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProfileCreateModal; 