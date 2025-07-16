import { Project } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const formatBudget = (budget: any) => {
    if (typeof budget === 'number') {
      return `$${budget.toLocaleString()}`;
    } else if (budget && typeof budget === 'object') {
      if (budget.type === 'fixed') {
        return `$${budget.min.toLocaleString()} - $${budget.max.toLocaleString()} (Fixed)`;
      } else if (budget.type === 'hourly') {
        return `$${budget.min}/hr - $${budget.max}/hr (Hourly)`;
      }
    }
    return 'N/A';
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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {project.title}
            </Text>
            {project.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeAgo}>{formatTimeAgo(project.createdAt)}</Text>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {project.description}
        </Text>

        <View style={styles.skillsContainer}>
          {project.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {project.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{project.skills.length - 3} more</Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.clientInfo}>
            <Avatar 
              source={project.client.avatar || ''} 
              name={`${project.client.firstName || ''}`} 
              size={24} 
            />
            <Text style={styles.clientName}>
              {project.client.firstName || 'Client'}
            </Text>
            {project.client.isVerified && (
              <Text style={styles.verifiedIcon}>✓</Text>
            )}
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
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  urgentText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  skillText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  moreSkills: {
    color: '#6B7280',
    fontSize: 12,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  verifiedIcon: {
    color: '#059669',
    fontSize: 12,
    marginLeft: 4,
  },
  projectMeta: {
    alignItems: 'flex-end',
  },
  budget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  proposals: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});