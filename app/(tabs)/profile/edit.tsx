import { Input } from '@/components/ui/Input';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function ProfileEditPage() {
  const { profile, setProfile, clearProfile } = useProfile();
  const router = useRouter();
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [skills, setSkills] = useState((profile?.skills || []).join(', '));
  const [submitting, setSubmitting] = useState(false);

  const isFreelancer = profile?.userType === 'freelancer';

  const handleSave = () => {
    setSubmitting(true);
    setProfile({
      ...profile!,
      name: name.trim(),
      email: email.trim(),
      bio: bio.trim(),
      linkedin: linkedin.trim(),
      country: country.trim(),
      skills: isFreelancer ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
    setSubmitting(false);
    router.back();
  };

  const handleDelete = () => {
    clearProfile();
    router.push('/(tabs)/profile');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        required
        containerStyle={styles.input}
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        required
        containerStyle={styles.input}
      />
      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        containerStyle={styles.input}
      />
      <Input
        label="LinkedIn Profile"
        value={linkedin}
        onChangeText={setLinkedin}
        autoCapitalize="none"
        containerStyle={styles.input}
      />
      <Input
        label="Country"
        value={country}
        onChangeText={setCountry}
        containerStyle={styles.input}
      />
      {isFreelancer && (
        <Input
          label="Skills (comma separated)"
          value={skills}
          onChangeText={setSkills}
          containerStyle={styles.input}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    alignSelf: 'center',
  },
  input: {
    width: '100%',
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
  cancelButton: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 