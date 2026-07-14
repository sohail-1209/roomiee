import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSearchParams } from 'expo-router';
import { chatAPI } from '../../services/endpoints';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/use-theme';

export default function ChatScreen() {
  const { id: chatId } = useSearchParams();
  const theme = useTheme();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load past message history
  useEffect(() => {
    if (!chatId) return;
    chatAPI.getMessages(chatId as string)
      .then(({ data }) => setMessages(data.data))
      .finally(() => setLoading(false));
  }, [chatId]);

  // Handle Socket Chat Rooms Join / Leave & Message events
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit('join_chat', chatId);
    socket.emit('mark_seen', { chatId });

    socket.on('new_message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.senderId !== user?.id) {
        socket.emit('mark_seen', { chatId });
      }
    });

    socket.on('messages_seen', () => {
      setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
    });

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('new_message');
      socket.off('messages_seen');
    };
  }, [socket, chatId, user]);

  const handleSendMessage = () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');
    socket?.emit('send_message', { chatId, content: text }, (res: any) => {
      setSending(false);
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View style={[styles.messageRow, isOwn ? styles.ownRow : styles.otherRow]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOwn ? '#4f46e5' : theme.backgroundElement,
              borderBottomRightRadius: isOwn ? 2 : 16,
              borderBottomLeftRadius: isOwn ? 16 : 2,
            },
          ]}
        >
          <Text style={[styles.messageText, { color: isOwn ? '#ffffff' : theme.text }]}>
            {item.content}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.timeText, { color: isOwn ? '#e0e7ff' : theme.textSecondary }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isOwn && (
              <Text style={styles.seenStatus}>
                {item.seen ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardView}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input panel */}
        <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={input}
            onChangeText={setInput}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!input.trim()}
            style={styles.sendButton}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownRow: {
    alignSelf: 'flex-end',
  },
  otherRow: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    alignSelf: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
  },
  seenStatus: {
    fontSize: 10,
    color: '#e0e7ff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
