import { Input } from '@/components/ui/Input';
import { useProfile } from '@/contexts/ProfileContext';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDeleteClientProfile, useDeleteFreelancerProfile } from '@/components/data/dexhire-data-access';
import { useRouter } from 'expo-router';

interface ProfileUpdateModalProps {
    visible: boolean;
    onClose: () => void;
}

const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({ visible, onClose }) => {
    const { profile, setProfile, clearProfile, refetchProfile } = useProfile();
    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
    const [country, setCountry] = useState(profile?.country || '');
    const [skills, setSkills] = useState((profile?.skills || []).join(', '));
    const [submitting, setSubmitting] = useState(false);
    const deleteClient = useDeleteClientProfile();
    const deleteFreelancer = useDeleteFreelancerProfile();
    const router = useRouter();


    const isFreelancer = profile?.userType === 'freelancer';

    const onDelete = async () => {
        console.log('onDelete');
        try {
            if (profile?.userType === 'client') {
                await deleteClient.mutateAsync({});
            } else {
                await deleteFreelancer.mutateAsync({});
            }
            clearProfile();          // clear local cache
            onClose();               // close modal
            refetchProfile();        // re-check on-chain state
            router.replace('/(tabs)/profile'); // stay on profile tab
        } catch (e) {
            console.error(e);
        }
    };

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
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
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
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.deleteButtonText}>Delete Profile</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        maxHeight: '90%',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        color: '#111827',
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

export default ProfileUpdateModal; 