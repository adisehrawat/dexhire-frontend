import { MoveHorizontal as MoreHorizontal, Phone, Search, Send, Video } from 'lucide-react-native';
import { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/ui/Avatar';

import { useClientProposals } from '@/contexts/use-fetch-client-proposals';
import { Proposal } from '@/types';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  isMe: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  unreadCount: number;
  project: string;
}

export default function MessagesScreen() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Use proposals from context
  const { proposals = [], isLoading, refetch } = useClientProposals();

  // Map proposals to conversations
  const conversations = proposals.map((proposal: Proposal) => ({
    id: proposal.id,
    name: proposal.freelancer?.name || 'Freelancer',
    avatar: proposal.freelancer?.avatar || '',
    lastMessage: proposal.coverLetter || '',
    timestamp: proposal.createdAt || '',
    isOnline: false, // No online status available
    unreadCount: 0, // No unread logic yet
    project: proposal.projectId || '',
  }));

  const messages: Message[] = [
    {
      id: '1',
      text: 'Hi! I have a question about the project requirements.',
      timestamp: '10:30 AM',
      senderId: '1',
      isMe: false,
    },
    {
      id: '2',
      text: 'Sure! What would you like to know?',
      timestamp: '10:32 AM',
      senderId: '2',
      isMe: true,
    },
    {
      id: '3',
      text: 'Could you clarify the design specifications for the mobile responsive version?',
      timestamp: '10:33 AM',
      senderId: '1',
      isMe: false,
    },
    {
      id: '4',
      text: 'Of course! The mobile version should support screens from 320px to 768px width. I can send you the detailed specs document.',
      timestamp: '10:35 AM',
      senderId: '2',
      isMe: true,
    },
    {
      id: '5',
      text: 'Perfect! That would be very helpful.',
      timestamp: '10:36 AM',
      senderId: '1',
      isMe: false,
    },
  ];

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        selectedConversation === item.id && styles.conversationItemActive
      ]}
      onPress={() => setSelectedConversation(item.id)}
    >
      <View style={styles.conversationAvatar}>
        <Avatar source={item.avatar} name={item.name} size={48} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.timestamp}</Text>
        </View>
        
        <Text style={styles.conversationProject}>{item.project}</Text>
        
        <View style={styles.conversationFooter}>
          <Text style={styles.conversationMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isMe && styles.messageContainerMe]}>
      <View style={[styles.messageBubble, item.isMe && styles.messageBubbleMe]}>
        <Text style={[styles.messageText, item.isMe && styles.messageTextMe]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, item.isMe && styles.messageTimeMe]}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  const renderConversationList = () => (
    <View style={styles.conversationList}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
      {isLoading ? (
        <Text style={{ textAlign: 'center', marginTop: 32 }}>Loading proposals...</Text>
      ) : conversations.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 32 }}>No proposals found for your projects yet.</Text>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderChatView = () => {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Avatar source={conversation.avatar} name={conversation.name} size={32} />
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderName}>{conversation.name}</Text>
              <Text style={styles.chatHeaderProject}>{conversation.project}</Text>
            </View>
          </View>
          
          <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.headerAction}>
              <Phone size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Video size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <MoreHorizontal size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={() => {
              if (messageText.trim()) {
                // Send message logic
                setMessageText('');
              }
            }}
          >
            <Send size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {selectedConversation ? renderChatView() : renderConversationList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
  conversationList: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  conversationItemActive: {
    backgroundColor: '#EBF8FF',
  },
  conversationAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  conversationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  conversationProject: {
    fontSize: 12,
    color: '#2563EB',
    marginBottom: 4,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#2563EB',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderText: {
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatHeaderProject: {
    fontSize: 12,
    color: '#6B7280',
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleMe: {
    backgroundColor: '#2563EB',
  },
  messageText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  messageTimeMe: {
    color: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    marginLeft: 12,
    padding: 10,
  },
});