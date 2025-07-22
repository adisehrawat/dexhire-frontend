import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { useAuth } from '@/components/auth/auth-provider';
import ProfileCreateModal from '@/components/profile/ProfileCreateModal';
import { useApp } from '@/contexts/AppContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Project } from '@/types';
import { Filter, UserPlus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
    useDexhireProgram,
    useDexhireProgramAccount,
} from "@/components/profile-imports/freelancerProfile-data-access";
import { useWalletUi } from '@/components/solana/use-wallet-ui';

export default function HomeScreen() {
    const { projects, isLoading, refreshProjects } = useApp();
    const { isAuthenticated } = useAuth();
    const { profile, isProfileLoaded } = useProfile();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showProjectDetails, setShowProjectDetails] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showNoProfileModal, setShowNoProfileModal] = useState(false);
    const prevProfileRef = React.useRef(profile);
    const { accounts } = useDexhireProgram();
    const { account } = useWalletUi();
    const mappedFreelancer = useMemo(() => {
        if (!Array.isArray(accounts?.data)) return [];
        return accounts.data
            .filter((acc: any) => acc.account.owner.toBase58() === account?.publicKey?.toBase58())
            .map((acc: any) => ({
                name: acc.account.name,
                email: acc.account.email,
            }));
    }, [accounts?.data, account?.publicKey]);
    // console.log(`account names: ${mappedFreelancer.map(f => f.name).join(', ')}`);
    // Show profile creation modal if wallet is connected, profile is loaded, but profile does not exist

    // const shouldShowProfileModal = isAuthenticated && isProfileLoaded && !profile;

    // React.useEffect(() => {
    //     if (shouldShowProfileModal) setShowProfileModal(false);
    //     else setShowProfileModal(false);
    // }, [shouldShowProfileModal]);

    // Show success message when profile is created
    React.useEffect(() => {
        if (!prevProfileRef.current && profile) {
            Alert.alert('Success', 'Profile created successfully!');
        }
        prevProfileRef.current = profile;
    }, [profile]);

    React.useEffect(() => {
        if (isAuthenticated && isProfileLoaded && !profile) {
            setShowNoProfileModal(true);
        } else {
            setShowNoProfileModal(false);
        }
    }, [isAuthenticated, isProfileLoaded, profile]);

    const filteredProjects = projects;

    const renderProject = ({ item }: { item: Project }) => (
        <ProjectCard
            project={item}
            onPress={() => {
                setSelectedProject(item);
                setShowProjectDetails(true);
            }}
        />
    );

    const router = useRouter();
    const shouldBlockContent = isAuthenticated && isProfileLoaded && !profile;
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* If no profile, show only the modal and nothing else */}
            {shouldBlockContent ? (
                <Modal
                    visible={true}
                    animationType="slide"
                    transparent
                    onRequestClose={() => {}}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '80%' }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' }}>
                                No profile detected
                            </Text>
                            <Text style={{ fontSize: 15, color: '#374151', marginBottom: 20, textAlign: 'center' }}>
                                Please create a new profile in the Profile tab.
                            </Text>
                            <TouchableOpacity
                                style={{ backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}
                                onPress={() => {
                                    // Always route to profile tab
                                    router.push('/(tabs)/profile');
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Go to Profile Tab</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            ) : (
                <>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>
                                {profile?.name
                                    ? `Welcome, ${profile.name}!`
                                    : mappedFreelancer.length > 0
                                        ? `Welcome, ${mappedFreelancer[0].name}!`
                                        : 'Welcome!'}
                            </Text>
                            <Text style={styles.subtitle}>
                                Browse available projects and opportunities
                            </Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.filterButton}>
                                <Filter size={20} color="#374151" />
                            </TouchableOpacity>
                            {/* Show create profile icon if wallet is connected and no profile exists */}
                            {isAuthenticated && !profile && (
                                <TouchableOpacity style={styles.createProfileButton} onPress={() => setShowProfileModal(true)}>
                                    <UserPlus size={20} color="#2563EB" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <FlatList
                        data={filteredProjects}
                        renderItem={renderProject}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isLoading} onRefresh={refreshProjects} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No projects found</Text>
                                <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                            </View>
                        }
                    />

                    <ProjectDetailsModal
                        project={selectedProject}
                        visible={showProjectDetails}
                        onClose={() => {
                            setShowProjectDetails(false);
                            setSelectedProject(null);
                        }}
                    />

                    <CreateProjectModal
                        visible={showCreateProject}
                        onClose={() => setShowCreateProject(false)}
                    />

                    {/* Floating Action Button - only show if wallet and profile exist and userType is client */}
                    {isAuthenticated && profile && profile.userType === 'client' && (
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => setShowCreateProject(true)}
                        >
                            <Text style={styles.fabIcon}>+</Text>
                        </TouchableOpacity>
                    )}

                    {/* Profile creation modal */}
                    <ProfileCreateModal
                        visible={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    greeting: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    addButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#2563EB',
    },
    listContainer: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        backgroundColor: '#2563EB',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    fabIcon: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    createProfileButton: {
        marginLeft: 8,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
});