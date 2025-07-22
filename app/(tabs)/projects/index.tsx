import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Plus,
  Filter,
  ChartBar as BarChart3,
  Calendar,
  CircleCheck as CheckCircle,
  Clock,
} from 'lucide-react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
  const { createProject } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: { min: 0, max: 0, type: 'fixed' as const },
    skills: [] as string[],
  });

  const tabs = [
    { id: 'active', label: 'Active', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'drafts', label: 'Drafts', icon: Calendar },
  ];

  const mockProjects = [
    {
      id: '1',
      title: 'E-commerce Website',
      status: 'In Progress',
      budget: '$5,000',
      progress: 75,
      freelancer: 'John Smith',
      deadline: '2024-02-15',
    },
    {
      id: '2',
      title: 'Mobile App Design',
      status: 'Review',
      budget: '$3,500',
      progress: 90,
      freelancer: 'Sarah Johnson',
      deadline: '2024-02-10',
    },
  ];

  const handleCreateProject = async () => {
    try {
      await createProject(projectForm);
      setShowCreateModal(false);
      setProjectForm({
        title: '',
        description: '',
        category: '',
        budget: { min: 0, max: 0, type: 'fixed' },
        skills: [],
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const renderProjectCard = (project: any) => (
    <Card key={project.id} style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
          <Text style={styles.statusText}>{project.status}</Text>
        </View>
      </View>

      <View style={styles.projectDetails}>
        <Text style={styles.projectMeta}>Freelancer: {project.freelancer}</Text>
        <Text style={styles.projectMeta}>Budget: {project.budget}</Text>
        <Text style={styles.projectMeta}>Deadline: {project.deadline}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Progress</Text>
          <Text style={styles.progressPercentage}>{project.progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
        </View>
      </View>

      <View style={styles.projectActions}>
        <Button title="View Details" variant="outline" size="small" onPress={() => {}} />
        <Button title="Message" variant="primary" size="small" onPress={() => {}} />
      </View>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return '#FEF3C7';
      case 'Review':
        return '#DBEAFE';
      case 'Completed':
        return '#D1FAE5';
      default:
        return '#F3F4F6';
    }
  };

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Project</Text>
          <TouchableOpacity onPress={handleCreateProject}>
            <Text style={styles.saveText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Project Title"
            value={projectForm.title}
            onChangeText={(text) => setProjectForm(prev => ({ ...prev, title: text }))}
            placeholder="Enter project title"
            required
          />

          <Input
            label="Description"
            value={projectForm.description}
            onChangeText={(text) => setProjectForm(prev => ({ ...prev, description: text }))}
            placeholder="Describe your project requirements"
            multiline
            numberOfLines={4}
            required
          />

          <Input
            label="Category"
            value={projectForm.category}
            onChangeText={(text) => setProjectForm(prev => ({ ...prev, category: text }))}
            placeholder="e.g., Web Development, Design, Writing"
            required
          />

          <View style={styles.budgetContainer}>
            <Input
              label="Budget Range"
              value={projectForm.budget.min.toString()}
              onChangeText={(text) => setProjectForm(prev => ({
                ...prev,
                budget: { ...prev.budget, min: parseInt(text) || 0 }
              }))}
              placeholder="Min budget"
              keyboardType="numeric"
              containerStyle={styles.budgetInput}
              required
            />
            <Input
              value={projectForm.budget.max.toString()}
              onChangeText={(text) => setProjectForm(prev => ({
                ...prev,
                budget: { ...prev.budget, max: parseInt(text) || 0 }
              }))}
              placeholder="Max budget"
              keyboardType="numeric"
              containerStyle={styles.budgetInput}
              required
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <BarChart3 size={24} color="#2563EB" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </Card>
        <Card style={styles.statCard}>
          <CheckCircle size={24} color="#059669" />
          <Text style={styles.statValue}>48</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Calendar size={24} color="#DC2626" />
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Due Soon</Text>
        </Card>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.tabActive
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <tab.icon size={16} color={selectedTab === tab.id ? '#2563EB' : '#6B7280'} />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockProjects.map(renderProjectCard)}
      </ScrollView>

      {renderCreateModal()}
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  projectCard: {
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  projectDetails: {
    marginBottom: 16,
  },
  projectMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
});