import { Input } from '@/components/ui/Input';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUpdateClientProfile, useUpdateFreelancerProfile, useDeleteClientProfile, useDeleteFreelancerProfile } from '@/components/data/dexhire-data-access';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthorization } from '@/components/solana/use-authorization';
import { ArrowLeft } from 'lucide-react-native';

export default function ProfileEditPage() {
    const { profile, setProfile, clearProfile, refetchProfile } = useProfile();
    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [country, setCountry] = useState(profile?.country || '');
    const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const { selectedAccount } = useAuthorization();

    const updateClient = useUpdateClientProfile();
    const updateFreelancer = useUpdateFreelancerProfile();
    const deleteClient = useDeleteClientProfile();
    const deleteFreelancer = useDeleteFreelancerProfile();

    const onDelete = async () => {
        console.log('onDelete');
        try {
            if (profile?.userType === 'client') {
                await deleteClient.mutateAsync({});
            } else {
                await deleteFreelancer.mutateAsync({});
            }
            clearProfile();          // clear local cache
            refetchProfile();        // re-check on-chain state
            router.replace('/(tabs)/home'); // stay on profile tab
        } catch (e) {
            console.error(e);
        }
    };
    const handleSave = async () => {
        setSubmitting(true);
        const authority = selectedAccount!.publicKey;
        const params = {
            name,
            email,
            bio,
            country,
            linkedin,
            authority,
        };

        if (profile!.userType === 'freelancer') {
            await updateFreelancer.mutateAsync(params);
            router.replace('/(tabs)/profile');
            await refetchProfile();
            setSubmitting(false);
        } else {
            await updateClient.mutateAsync(params);
            router.replace('/(tabs)/profile');
            await refetchProfile();
            setSubmitting(false);
        }

    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
            </View>
            <ScrollView style={styles.scrollView}>
                <Input label="Name" value={name} onChangeText={setName} />
                <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <Input label="Bio" value={bio} onChangeText={setBio} multiline />
                <Input label="Country" value={country} onChangeText={setCountry} />
                <Input label="LinkedIn" value={linkedin} onChangeText={setLinkedin} />
                <TouchableOpacity style={styles.btn} onPress={handleSave}>
                    <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={onDelete}>
                    <Text style={styles.btnText}>Delete Profile</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    btn: { backgroundColor: '#2563eb', marginTop: 16, padding: 14, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '600' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: '#F9FAFB',
      },
      backButton: {
        marginRight: 12,
        padding: 4,
        borderRadius: 8,
      },
      title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
      },
      container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
      },
      scrollView: {
        padding: 16,
      },
});

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: '#fff',
//     padding: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 24,
//     alignSelf: 'center',
//   },
//   input: {
//     width: '100%',
//   },
//   button: {
//     backgroundColor: '#2563EB',
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 32,
//     marginTop: 8,
//     width: '100%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   cancelButton: {
//     marginTop: 8,
//     width: '100%',
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#6B7280',
//     fontSize: 16,
//   },
//   deleteButton: {
//     marginTop: 16,
//     width: '100%',
//     alignItems: 'center',
//     backgroundColor: '#EF4444',
//     borderRadius: 8,
//     paddingVertical: 12,
//   },
//   deleteButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// }); 