import { PDA, useApproveWorkAndPay, useCompleteProject, useFetchAllPublicProjects, useRespondToProposal, useSubmitProposal } from '@/components/data/dexhire-data-access';
import { useAuthorization } from '@/components/solana/use-authorization';
import { useProfile } from '@/contexts/ProfileContext';
import { useClientProposals } from '@/contexts/use-fetch-client-proposals';
import { useFetchProjects } from '@/contexts/use-fetch-projects';
import { Project, Proposal } from '@/types';
import { PublicKey } from '@solana/web3.js';
import { router } from 'expo-router';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Flag,
    Heart,
    Share,
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
    projectPDA: string | null;
    visible: boolean;
    onClose: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
    projectPDA,
    visible,
    onClose,
}) => {
    const { data: projects = [] } = useFetchProjects();
    const { data: allPublicProjects = [] } = useFetchAllPublicProjects();
    const { profile } = useProfile();
    const { selectedAccount } = useAuthorization();
    const submitProposal = useSubmitProposal();
    const respondToProposal = useRespondToProposal();
    const approveWorkAndPay = useApproveWorkAndPay();
    const completeProject = useCompleteProject();
    const { proposals: allProposals = [] } = useClientProposals();
    
    // Try to find project in user's projects first, then in all public projects
    let project = projects.find((p: Project) => p.id === projectPDA);
    if (!project) {
        project = allPublicProjects.find((p: Project) => p.id === projectPDA);
    }
    
    // Filter proposals for this specific project
    const proposals = allProposals.filter((proposal: Proposal) => proposal.projectId === projectPDA);

    // Debug logging
    console.log('[ProjectDetailsModal] projectPDA:', projectPDA);
    console.log('[ProjectDetailsModal] projects count:', projects.length);
    console.log('[ProjectDetailsModal] allPublicProjects count:', allPublicProjects.length);
    console.log('[ProjectDetailsModal] found project:', project);
    console.log('[ProjectDetailsModal] proposals:', proposals);
    console.log(`[ProjectDetailsModal] project.clientId: ${project?.clientId}`);
    console.log('[ProjectDetailsModal] profile:', profile);
    console.log('[ProjectDetailsModal] selectedAccount:', selectedAccount?.publicKey?.toString());

    const [showProposalForm, setShowProposalForm] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!project) {
        console.log('[ProjectDetailsModal] No project found for PDA:', projectPDA);
        return null;
    }

    const formatBudget = (budget: Project['budget']) => {
        return `${budget.toLocaleString()} SOL`;
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'created': return '#F59E0B';
            case 'approved': return '#10B981';
            case 'in_progress': return '#3B82F6';
            case 'work_submitted': return '#8B5CF6';
            case 'completed': return '#059669';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: Project['status']) => {
        switch (status) {
            case 'created': return 'Awaiting Approval';
            case 'approved': return 'Open for Proposals';
            case 'in_progress': return 'In Progress';
            case 'work_submitted': return 'Work Submitted';
            case 'completed': return 'Completed';
            default: return 'Unknown';
        }
    };

    const handleRespondToProposal = async (proposalId: string, freelancerId: string, accept: boolean, message: string) => {
        if (!project) return;

        try {
            const projectPDA = new PublicKey(project.id);
            const freelancerPDA = PDA.freelancerProfile(new PublicKey(freelancerId));
            const proposalPDA = new PublicKey(proposalId);

            await respondToProposal.mutateAsync({
                proposalPDA,
                projectPDA,
                freelancerPDA,
                accept,
                message,
            });

            Alert.alert('Success', `Proposal ${accept ? 'accepted' : 'rejected'} successfully!`);
        } catch (error) {
            console.error('Error responding to proposal:', error);
            Alert.alert('Error', 'Failed to respond to proposal. Please try again.');
        }
    };

    const handleApproveWork = async (message: string) => {
        if (!project || !project.freelancerId) return;

        try {
            const projectPDA = new PublicKey(project.id);
            const freelancerPDA = PDA.freelancerProfile(new PublicKey(project.freelancerId));
            const proposalPDA = PDA.proposal(message, projectPDA, new PublicKey(project.clientId));
            const vaultPDA = PDA.vault(projectPDA);

            await approveWorkAndPay.mutateAsync({
                projectPDA,
                proposalPDA,
                freelancerPDA,
                vaultPDA,
            });

            Alert.alert('Success', 'Work approved and payment sent to freelancer!');
        } catch (error) {
            console.error('Error approving work:', error);
            Alert.alert('Error', 'Failed to approve work and send payment. Please try again.');
        }
    };

    const handleCompleteProject = async () => {
        if (!project) return;

        Alert.alert(
            'Complete Project',
            'Are you sure you want to mark this project as completed? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const projectPDA = new PublicKey(project.id);
                            const creator = new PublicKey(project.clientId);

                            await completeProject.mutateAsync({
                                projectPDA,
                                projectName: project.title,
                                creator,
                            });

                            Alert.alert('Success', 'Project completed successfully!');
                            onClose();
                        } catch (error) {
                            console.error('Error completing project:', error);
                            Alert.alert('Error', 'Failed to complete project. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const isProjectOwner = profile && project && selectedAccount &&
        profile.userType === 'client' &&
        project.clientId === selectedAccount.publicKey.toString();
    const canSubmitProposal = profile && 
        profile.userType === 'freelancer' && 
        project?.status === 'approved' && 
        !isProjectOwner; // Ensure user is not the project owner
    const canManageProposals = isProjectOwner && project?.status === 'approved' && proposals.length > 0;
    const canApproveWork = isProjectOwner && project?.status === 'work_submitted' && project?.githubLink;
    const canCompleteProject = isProjectOwner && project?.status === 'completed' && !project?.isCompleted;

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
  if (!coverLetter.trim()) {
    Alert.alert('Error', 'Cover letter is required');
    return;
  }

  // Extra guards already handled by hook
  if (project.status !== 'approved') {
    Alert.alert('Error', 'Project is not open for proposals');
    return;
  }

  try {
    const projectPDA = new PublicKey(project.id);
    await submitProposal.mutateAsync({
      projectName: project.title,
      message: coverLetter,
      project: projectPDA,
    });

    Alert.alert('Success', 'Proposal submitted!');
    setShowProposalForm(false);
    setCoverLetter('');
    router.push('/(tabs)/messages');
  } catch (err: any) {
    console.error(err);
    Alert.alert('Error', err.message || 'Failed to submit proposal.');
  }
};

    const renderProposalForm = () => (
        <Card style={styles.proposalForm}>
            <Text style={styles.proposalTitle}>Submit Your Proposal</Text>

            <Input
                label="Cover Letter"
                value={coverLetter}
                onChangeText={setCoverLetter}
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


    const formatShortId = (id: string) => {
        if (!id || id.length <= 8) return id;
        return `${id.slice(0, 4)}...${id.slice(-4)}`;
      };

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

                <ScrollView style={styles.content}>
                    <Card style={styles.projectCard}>
                        <View style={styles.projectHeader}>
                            <Text style={styles.projectTitle}>{project.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                                <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
                            </View>
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


                    <Card style={styles.clientCard}>
                        <Text style={styles.sectionTitle}>About the Client</Text>
                        <View style={styles.clientInfo}>
                        <Avatar
                            source={''}
                            name={project.client.avatar || 'A'}
                            size={48}
                        />
                            <View style={styles.clientDetails}>
                                <View style={styles.clientNameRow}>
                                    <Text style={styles.clientName}>
                                        {project.client.name}
                                    </Text>
                                    <Text style={styles.verifiedIcon}>✓</Text>
                                </View>
                                <View style={styles.clientAddress}>
                                <Text style={styles.addressText}>{formatShortId(project.client.id)}</Text>
                                </View>
                            </View>
                        </View>
                    </Card>

                    {canManageProposals && (
                        <Card style={styles.proposalsCard}>
                            <Text style={styles.sectionTitle}>Proposals ({proposals.length})</Text>
                            {proposals.map((proposal: Proposal) => (
                                <View key={proposal.id} style={styles.proposalItem}>
                                    <View style={styles.proposalHeader}>
                                        <View style={styles.freelancerInfo}>
                                            <Avatar
                                                source={proposal.freelancer.avatar || ''}
                                                name={proposal.freelancer.name}
                                                size={32}
                                            />
                                            <View style={styles.freelancerDetails}>
                                                <Text style={styles.freelancerName}>{proposal.freelancer.name}</Text>
                                                <Text style={styles.proposalDate}>
                                                    {new Date(proposal.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.proposalStatusBadge, {
                                            backgroundColor: proposal.status === 'pending' ? '#F59E0B' :
                                                           proposal.status === 'accepted' ? '#10B981' : '#EF4444'
                                        }]}>
                                            <Text style={styles.proposalStatusText}>
                                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.proposalMessage}>{proposal.coverLetter}</Text>
                                    {proposal.status === 'pending' && (
                                        <View style={styles.proposalActions}>
                                            <Button
                                                title="Reject"
                                                variant="outline"
                                                onPress={() => handleRespondToProposal(proposal.id, proposal.freelancerId, false , proposal.coverLetter)}
                                                style={styles.proposalActionButton}
                                            />
                                            <Button
                                                title="Accept"
                                                onPress={() => handleRespondToProposal(proposal.id, proposal.freelancerId, true , proposal.coverLetter)}
                                                style={styles.proposalActionButton}
                                            />
                                        </View>
                                    )}
                                </View>
                            ))}
                        </Card>
                    )}

                    {project.githubLink && (
                        <Card style={styles.workSubmissionCard}>
                            <Text style={styles.sectionTitle}>Submitted Work</Text>
                            <View style={styles.workSubmissionContent}>
                                <Text style={styles.workSubmissionLabel}>GitHub Repository:</Text>
                                <TouchableOpacity
                                    style={styles.githubLink}
                                    onPress={() => console.log('Open GitHub link:', project.githubLink)}
                                >
                                    <Text style={styles.githubLinkText}>{project.githubLink}</Text>
                                </TouchableOpacity>
                                {project.workSubmittedAt && (
                                    <Text style={styles.workSubmissionDate}>
                                        Submitted on: {new Date(project.workSubmittedAt).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                        </Card>
                    )}

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
                        {canSubmitProposal && (
                            <Button
                                title="Submit Proposal"
                                onPress={() => setShowProposalForm(true)}
                                style={styles.footerButton}
                            />
                        )}
                        {canApproveWork && (
                            <Button
                                title="Approve Work & Pay"
                                onPress={() => handleApproveWork(coverLetter)}
                                style={styles.footerButton}
                            />
                        )}
                        {canCompleteProject && (
                            <Button
                                title="Complete Project"
                                onPress={handleCompleteProject}
                                style={styles.footerButton}
                                variant="outline"
                            />
                        )}
                        {!canSubmitProposal && !canApproveWork && !canCompleteProject && project?.status === 'created' && (
                            <View style={styles.infoMessage}>
                                <AlertCircle size={16} color="#F59E0B" />
                                <Text style={styles.infoText}>
                                    This project is awaiting approval from the client.
                                </Text>
                            </View>
                        )}
                        {project?.status === 'work_submitted' && !canApproveWork && (
                            <View style={styles.infoMessage}>
                                <CheckCircle size={16} color="#10B981" />
                                <Text style={styles.infoText}>
                                    Work has been submitted and is awaiting client approval.
                                </Text>
                            </View>
                        )}
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
    clientAddress: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    addressText: {
        fontSize: 13,
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
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    infoMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
    },
    proposalsCard: {
        marginBottom: 16,
    },
    proposalItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 16,
        marginBottom: 16,
    },
    proposalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    freelancerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    freelancerDetails: {
        marginLeft: 8,
        flex: 1,
    },
    freelancerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    proposalDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    proposalStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    proposalStatusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    proposalMessage: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    proposalActionButton: {
        flex: 1,
    },
    workSubmissionCard: {
        marginBottom: 16,
    },
    workSubmissionContent: {
        marginTop: 8,
    },
    workSubmissionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    githubLink: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    githubLinkText: {
        fontSize: 14,
        color: '#2563EB',
        textDecorationLine: 'underline',
    },
    workSubmissionDate: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
});