import { useAuth } from '@/components/auth/auth-provider';
import { WalletUiButtonDisconnect } from '@/components/solana/wallet-ui-button-disconnect';
import { Avatar } from '@/components/ui/Avatar';
import { useProfile } from '@/contexts/ProfileContext';
import { useRouter } from 'expo-router';
import { Briefcase, CreditCard, CreditCard as Edit3, Linkedin, Mail, MapPin, Settings, User } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';


export default function ProfileScreen() {
  const { isAuthenticated } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  // Remove showEditModal state

  const skills = ['React Native', 'TypeScript', 'Node.js', 'Python', 'UI/UX Design'];

  const menuItems = [
    { icon: User, title: 'Edit Profile', subtitle: 'Update your information' },
    { icon: Briefcase, title: 'Portfolio', subtitle: 'Showcase your work' },
    { icon: CreditCard, title: 'Account', subtitle: 'Manage account and transactions' },
    { icon: Settings, title: 'Settings', subtitle: 'App preferences' },
  ];

//   const handleLogout = async () => {
//   Alert.alert(
//     'Logout',
//     'Are you sure you want to logout?',
//     [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Logout',
//         style: 'destructive',
//         onPress: async () => {
//           await logout(); // <-- Optional: perform logout action
//           router.push('/si'); // <-- Navigate only after user confirms
//         },
//       },
//     ]
//   );
// };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/account')}>
            <Edit3 size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar 
              source={''} 
              name={profile?.name || (isAuthenticated ? 'Connected' : 'Disconnected')}
              size={80}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.name || (isAuthenticated ? 'Connected' : 'Disconnected')}
              </Text>
              <Text style={styles.profileType}>
                {profile?.userType || (isAuthenticated ? 'Wallet Connected' : 'Wallet Disconnected')}
              </Text>
              {isAuthenticated && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailItem}>
              <Mail size={16} color="#6B7280" />
              <Text style={styles.detailText}>{profile?.email || (isAuthenticated ? 'No email' : 'Wallet Disconnected')}</Text>
            </View>
            {isAuthenticated && (
              <View style={styles.detailItem}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.detailText}>{profile?.country || (isAuthenticated ? 'Wallet Connected' : 'Wallet Disconnected')}</Text>
              </View>
            )}
            {isAuthenticated && (
              <View style={styles.detailItem}>
                <Linkedin size={16} color="#6B7280" />
                <Text style={styles.detailText}>${profile?.linkedin || (isAuthenticated ? 'Wallet Connected' : 'Wallet Disconnected')}</Text>
              </View>
            )}
          </View>

          {isAuthenticated && (
            <View style={styles.bioSection}>
              <Text style={styles.bioTitle}>About</Text>
              <Text style={styles.bioText}>{profile?.bio || (isAuthenticated ? 'Wallet Connected' : 'Wallet Disconnected')}</Text>
            </View>
          )}

          {isAuthenticated && (
            <View style={styles.skillsSection}>
              <Text style={styles.skillsTitle}>Skills</Text>
              <View style={styles.skillsContainer}>
                {profile?.skills?.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.menuItemBorder
              ]}
              onPress={() => {
                if (item.title === 'Account') {
                  router.push('/profile/account');
                } else if (item.title === 'Edit Profile') {
                  router.push('/profile/edit');
                } else {
                  console.log(`Pressed ${item.title}`);
                }
              }}
            >
              <item.icon size={20} color="#374151" />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <View style={styles.logoutSection}>
        <View style={styles.disconnectButtonWrapper}>
          <WalletUiButtonDisconnect label="Disconnect" />
        </View>
        </View>
      </ScrollView>
      {/* Remove ProfileUpdateModal */}
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
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EBF8FF',
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  profileType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
  },
  profileDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  bioSection: {
    marginBottom: 16,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
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
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    borderColor: '#DC2626',
  },
  disconnectButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});