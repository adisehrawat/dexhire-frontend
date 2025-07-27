// ProjectsScreen/index.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,

    FlatList,
    RefreshControl,
} from 'react-native';
import {
    Plus,
    Filter,
    ChartBar as BarChart3,

    CircleCheck as CheckCircle,
} from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectCard } from '@/components/ProjectCard';
import { Project } from '@/types';
import { ProjectDetailsModal } from '@/components/ProjectDetailsModal';
import { useClientProjects } from '@/contexts/use-fetch-client-projects';

export default function ProjectsScreen() {
    const [showCreateProject, setShowCreateProject] = useState(false);
    const { projects, isLoading, refetch } = useClientProjects();
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showProjectDetails, setShowProjectDetails] = useState(false);

    const approvedProjects = projects.filter(project =>
        project.isPublic &&
        !project.freelancerId
    );
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
            <View style={styles.header}>
                <Text style={styles.title}>My Projects</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.filterButton}>
                        <Filter size={20} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowCreateProject(true)}
                    >
                        <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ProjectDetailsModal
                projectPDA={selectedProject?.id || null}
                visible={showProjectDetails}
                onClose={() => {
                    setShowProjectDetails(false);
                    setSelectedProject(null);
                }}
            />
            <View style={styles.content} >
                <FlatList
                    data={approvedProjects}
                    renderItem={renderProject}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No projects found</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                        </View>
                    }
                />
            </View>

            <CreateProjectModal
                visible={showCreateProject}
                onClose={() => setShowCreateProject(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
    emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 8 },
    listContainer: { padding: 16 },
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
    },
    title: { fontSize: 20, fontWeight: '600', color: '#111827' },
    headerActions: { flexDirection: 'row', gap: 12 },
    filterButton: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
    addButton: { padding: 8, borderRadius: 8, backgroundColor: '#2563EB' },
    statsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
    statValue: { fontSize: 24, fontWeight: '600', color: '#111827', marginTop: 8 },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    tabContainer: {
        flexDirection: 'row', backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, gap: 6
    },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563EB' },
    tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    tabTextActive: { color: '#2563EB' },
    content: { flex: 1, padding: 16 },
    projectCard: { marginBottom: 16 },
    projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    projectTitle: { fontSize: 18, fontWeight: '600', color: '#111827', flex: 1 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    projectDetails: { marginBottom: 16 },
    projectMeta: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
    progressContainer: { marginBottom: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressText: { fontSize: 14, fontWeight: '500', color: '#374151' },
    progressPercentage: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
    progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 4 },
    projectActions: { flexDirection: 'row', gap: 12 },
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    cancelText: { fontSize: 16, color: '#6B7280' },
    saveText: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
    modalContent: { flex: 1, padding: 16 },
    budgetContainer: { flexDirection: 'row', gap: 12 },
    budgetInput: { flex: 1 },
});