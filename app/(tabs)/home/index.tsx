// home/index.tsx
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { useAuth } from '@/components/auth/auth-provider';
import ProfileCreateModal from '@/components/profile/ProfileCreateModal';
import { useApp } from '@/contexts/AppContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Project } from '@/types';
import { useRouter } from 'expo-router';
import { Filter, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
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
    const router = useRouter();

    // 1️⃣  Decide what to render
    const canShowProjects = isAuthenticated && profile;
    const needsProfile = isAuthenticated && !profile && isProfileLoaded;

    const renderProject = ({ item }: { item: Project }) => (
        <ProjectCard
            project={item}
            onPress={() => {
                setSelectedProject(item);
                setShowProjectDetails(true);
            }}
        />
    );

    useEffect(() => {
        if (isAuthenticated && isProfileLoaded && !profile) {
          setShowProfileModal(true);
        } else {
          setShowProfileModal(false);
        }
      }, [isAuthenticated, isProfileLoaded, profile]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* 2️⃣  Banner when wallet connected but no profile */}
            {needsProfile && (
                <View style={styles.centerCard}>
                    <UserPlus size={48} color="#2563EB" />
                    <Text style={styles.centerTitle}>Create your profile first</Text>
                    <Text style={styles.centerText}>
                        You need a client or freelancer profile to see projects.
                    </Text>
                    <View style={styles.centerButtons}>
                        <TouchableOpacity
                            style={styles.centerBtn}
                            onPress={() => setShowProfileModal(true)}
                        >
                            <Text style={styles.centerBtnText}>Create Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.centerBtn, styles.centerBtnGhost]}
                            onPress={() => router.push('/(tabs)/profile')}
                        >
                            <Text style={[styles.centerBtnText, styles.centerBtnGhostText]}>
                                Go to Profile tab
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 3️⃣  Normal header + list */}


            {/* 5️⃣  Projects list */}
            {canShowProjects && (
                <>
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
                            {isAuthenticated && !profile && (
                                <TouchableOpacity
                                    style={styles.createProfileButton}
                                    onPress={() => setShowProfileModal(true)}
                                >
                                    <UserPlus size={20} color="#2563EB" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <FlatList
                        data={projects}
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
                </>
            )}

            {/* Modals */}
            <ProjectDetailsModal
                projectId={selectedProject?.id || null}
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

            {/* 6️⃣  FAB for clients */}
            {canShowProjects && profile.userType === 'client' && (
                <TouchableOpacity style={styles.fab} onPress={() => setShowCreateProject(true)}>
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            )}

            <ProfileCreateModal
                visible={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    banner: {
        backgroundColor: '#fef3c7',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bannerText: { fontSize: 14, color: '#92400e', flexShrink: 1 },
    bannerBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 8,
    },
    bannerBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

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
    greeting: { fontSize: 20, fontWeight: '600', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },

    headerActions: { flexDirection: 'row', gap: 12 },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    createProfileButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#E0E7FF',
    },

    listContainer: { padding: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
    emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 8 },

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
        elevation: 5,
    },
    fabIcon: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 2 },
    centerCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    centerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        textAlign: 'center',
    },
    centerText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 20,
    },
    centerButtons: {
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 240,
    },
    centerBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    centerBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    centerBtnGhost: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    centerBtnGhostText: {
        color: '#2563EB',
    },
});