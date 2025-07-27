
import { useCreateProject } from '@/components/data/dexhire-data-access';
import { useQueryClient } from '@tanstack/react-query';
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
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { BN } from '@coral-xyz/anchor';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();
  const createProject = useCreateProject();
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    budget: 0,
    deadline: '',
  });



  const handleCreateProject = async () => {
    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: projectData.title,
        about: projectData.description,
        price: new BN(projectData.budget),
        deadline: new BN(Math.floor(new Date(projectData.deadline).getTime() / 1000)),
      });

      // 👇 re-fetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      resetForm();
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Could not create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProjectData({
      title: '',
      description: '',
      budget: 0,
      deadline: '',
    });
    setCurrentStep(1);
  };


  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Project Basics</Text>
      
      <Input
        label="Project Title"
        value={projectData.title}
        onChangeText={(text) => setProjectData(prev => ({ ...prev, title: text }))}
        placeholder="Enter a clear, descriptive title"
        required
      />
      
      <Input
        label="Project Description"
        value={projectData.description}
        onChangeText={(text) => setProjectData(prev => ({ ...prev, description: text }))}
        placeholder="Describe your project requirements in detail..."
        multiline
        numberOfLines={6}
        required
      />
      
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Budget & Timeline</Text>
      
      <View style={styles.budgetRow}>
        <Input
          label={`Budget`}
          value={projectData.budget.toString()}
          onChangeText={(text) => setProjectData(prev => ({ ...prev, budget: parseInt(text) || 0 }))}
          placeholder="0"
          keyboardType="numeric"
          containerStyle={styles.budgetInput}
          required
        />
        
      </View>
      
      <Input
        label="Project Deadline"
        value={projectData.deadline}
        onChangeText={(text) => setProjectData(prev => ({ ...prev, deadline: text }))}
        placeholder="YYYY-MM-DD"
        required
      />
      
    </View>
  );


  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Project</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.saveText}>Step {currentStep}/2</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.formCard}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <Button
              title="Previous"
              variant="outline"
              onPress={() => setCurrentStep(prev => prev - 1)}
              style={styles.footerButton}
            />
          )}
          
          {currentStep < 2 ? (
            <Button
              title="Next"
              onPress={() => setCurrentStep(prev => prev + 1)}
              style={styles.footerButton}
            />
          ) : (
            <Button
              title="Post Project"
              onPress={handleCreateProject}
              loading={isSubmitting}
              style={styles.footerButton}
            />
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryItemActive: {
    backgroundColor: '#EBF8FF',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryTextActive: {
    color: '#2563EB',
  },
  budgetTypeContainer: {
    marginBottom: 16,
  },
  budgetTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  budgetTypeButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF8FF',
  },
  budgetTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  budgetTypeTextActive: {
    color: '#2563EB',
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  urgentText: {
    fontSize: 16,
    color: '#374151',
  },
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  skillInput: {
    flex: 1,
  },
  addSkillButton: {
    marginBottom: 16,
  },
  skillsContainer: {
    marginTop: 16,
  },
  skillsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  removeSkill: {
    padding: 2,
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