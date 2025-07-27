import { Project } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
interface ProjectCardProps {
    project: Project;
    onPress: () => void;
    borderColor?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, borderColor }) => {
    const formatBudget = (budget: number) => {
        return `$${budget.toLocaleString()}`;
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };
    console.log(project.client.avatar);
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={{ borderRadius: 18 }}>
            <Card style={([styles.card, borderColor ? { borderColor, borderWidth: 3 } : undefined, styles.cardShadow].filter(Boolean) as any)}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={2}>
                            {project.title}
                        </Text>
                    </View>
                    <Text style={styles.timeAgo}>{formatTimeAgo(project.createdAt)}</Text>
                </View>

                <Text style={styles.description} numberOfLines={3}>
                    {project.description}
                </Text>

                <View style={styles.footer}>
                    <View style={styles.clientInfo}>
                        <Avatar
                            source={''}
                            name={project.client.avatar || 'A'}
                            size={28}
                        />
                        <Text style={styles.clientName}>
                            {project.client.name || 'Client'}
                        </Text>
                        <Text style={styles.verifiedIcon}> ✓</Text>

                    </View>
                    <View style={styles.projectMeta}>
                        <Text style={styles.budget}>{formatBudget(project.budget)}</Text>
                        <Text style={styles.proposals}>{project.proposals} proposals</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 18,
        padding: 20,
        backgroundColor: '#fff',
        borderColor: '#E0E7EF',
        borderWidth: 1,
    },
    cardShadow: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    titleContainer: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 26,
    },
    featuredBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    featuredText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    timeAgo: {
        fontSize: 13,
        color: '#6B7280',
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clientName: {
        fontSize: 13,
        color: '#2563EB',
        marginLeft: 8,
        fontWeight: '600',
    },
    verifiedIcon: {
        color: '#059669',
        fontSize: 14,
        marginLeft: 4,
    },
    projectMeta: {
        alignItems: 'flex-end',
    },
    budget: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
    },
    proposals: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
});