import { useApp } from '@/contexts/AppContext';
import { Project } from '@/types';
import {
    Calendar,
    Clock,
    DollarSign,
    Flag,
    Heart,
    MapPin,
    Share,
    Star,
    Users,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

interface ProjectDetailsModalProps {
  project: Project | null;
  visible: boolean;
  onClose: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  visible,
  onClose,
}) => {
  const { submitProposal } = useApp();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: '',
    proposedRate: '',
    estimatedDuration: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!project) return null;

  const formatBudget = (budget: Project['budget']) => {
    return `$${budget.toLocaleString()} (Fixed Price)`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleSubmitProposal = async () => {
    if (!proposalData.coverLetter.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitProposal({
        projectId: project.id,
        coverLetter: proposalData.coverLetter,
        proposedRate: parseFloat(proposalData.proposedRate),
        estimatedDuration: proposalData.estimatedDuration,
      });
      
      Alert.alert('Success', 'Your proposal has been submitted successfully!');
      setShowProposalForm(false);
      setProposalData({ coverLetter: '', proposedRate: '', estimatedDuration: '' });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProposalForm = () => (
    <Card style={styles.proposalForm}>
      <Text style={styles.proposalTitle}>Submit Your Proposal</Text>
      
      <Input
        label="Cover Letter"
        value={proposalData.coverLetter}
        onChangeText={(text) => setProposalData(prev => ({ ...prev, coverLetter: text }))}
        placeholder="Explain why you're the best fit for this project..."
        multiline
        numberOfLines={6}
        required
      />
      
      
      <View style={styles.proposalActions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => setShowProposalForm(false)}
          style={styles.proposalButton}
        />
        <Button
          title="Submit Proposal"
          onPress={handleSubmitProposal}
          loading={isSubmitting}
          style={styles.proposalButton}
        />
      </View>
    </Card>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction}>
              <Heart size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Share size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Flag size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              {project.isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.projectDescription}>{project.description}</Text>
            
            <View style={styles.projectMeta}>
              <View style={styles.metaItem}>
                <DollarSign size={16} color="#2563EB" />
                <Text style={styles.metaText}>{formatBudget(project.budget)}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Clock size={16} color="#2563EB" />
                <Text style={styles.metaText}>{formatTimeAgo(project.createdAt)}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Users size={16} color="#2563EB" />
                <Text style={styles.metaText}>{project.proposals} proposals</Text>
              </View>
              
              {project.deadline && (
                <View style={styles.metaItem}>
                  <Calendar size={16} color="#2563EB" />
                  <Text style={styles.metaText}>Due: {new Date(project.deadline).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          </Card>

          <Card style={styles.skillsCard}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {project.skills.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.clientCard}>
            <Text style={styles.sectionTitle}>About the Client</Text>
            <View style={styles.clientInfo}>
              <Avatar 
                source={project.client.avatar} 
                name={`${project.client.firstName} `} 
                size={48} 
              />
              <View style={styles.clientDetails}>
                <View style={styles.clientNameRow}>
                  <Text style={styles.clientName}>
                    {project.client.firstName}
                  </Text>
                  {project.client.isVerified && (
                    <Text style={styles.verifiedIcon}>✓</Text>
                  )}
                </View>
                {project.client.location && (
                  <View style={styles.clientLocation}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.locationText}>{project.client.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {project.attachments && project.attachments.length > 0 && (
            <Card style={styles.attachmentsCard}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              {project.attachments.map((attachment, index) => (
                <TouchableOpacity key={index} style={styles.attachmentItem}>
                  <Text style={styles.attachmentText}>{attachment}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {showProposalForm && renderProposalForm()}
        </ScrollView>

        {!showProposalForm && (
          <View style={styles.footer}>
            <Button
              title="Submit Proposal"
              onPress={() => setShowProposalForm(true)}
              style={styles.footerButton}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  projectMeta: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  skillsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  clientCard: {
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientDetails: {
    marginLeft: 12,
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedIcon: {
    color: '#059669',
    fontSize: 14,
    marginLeft: 4,
  },
  clientLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  clientRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  attachmentsCard: {
    marginBottom: 16,
  },
  attachmentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  attachmentText: {
    fontSize: 14,
    color: '#2563EB',
  },
  proposalForm: {
    marginBottom: 16,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  proposalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  proposalInput: {
    flex: 1,
  },
  proposalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  proposalButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});