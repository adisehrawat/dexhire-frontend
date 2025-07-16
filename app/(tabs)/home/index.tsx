import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { useAuth } from '@/components/auth/auth-provider';
import ProfileCreateModal from '@/components/profile/ProfileCreateModal';
import { useApp } from '@/contexts/AppContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Project } from '@/types';
import { Filter, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const { projects, isLoading, refreshProjects } = useApp();
    const { isAuthenticated } = useAuth();
    const { profile, isProfileLoaded } = useProfile();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showProjectDetails, setShowProjectDetails] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const prevProfileRef = React.useRef(profile);

    // Show profile creation modal if wallet is connected, profile is loaded, but profile does not exist
    const shouldShowProfileModal = isAuthenticated && isProfileLoaded && !profile;

    React.useEffect(() => {
        if (shouldShowProfileModal) setShowProfileModal(true);
        else setShowProfileModal(false);
    }, [shouldShowProfileModal]);

    // Show success message when profile is created
    React.useEffect(() => {
        if (!prevProfileRef.current && profile) {
            Alert.alert('Success', 'Profile created successfully!');
        }
        prevProfileRef.current = profile;
    }, [profile]);

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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>
                        {profile ? `Welcome, ${profile.name}!` : 'Welcome!'}
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

            {/* Only show projects if wallet is connected and profile exists */}
            {isAuthenticated && profile ? (
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
            ) : null}

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