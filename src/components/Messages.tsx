import React, { useState, useEffect, useRef } from 'react';
import { Layout, List, Button, Input, message, Form, Typography, Avatar, Card } from 'antd';
import { getMessages, respondToMessage, deleteMessage, getAllUsers, getHotelById } from '../services/auth.service';
import { MessageT } from '../types/user.type';
import { getCurrentUser } from '../services/auth.service';
import { UserOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface Conversation {
  key: string;
  title: string;
  latestSender: string; // Track the latest sender's username
  latestMessage: string;
  latestSentAt: string;
  messages: MessageT[];
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<MessageT[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationKey, setSelectedConversationKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null); // New state for selected message
  const [userMap, setUserMap] = useState<Map<number, string>>(new Map()); // Map senderId to username
  const [hotelMap, setHotelMap] = useState<Map<number, string>>(new Map()); // Map hotelId to hotelName
  const currentUser = getCurrentUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchInitialData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch messages first to get hotelIds and user data
      const msgData = await getMessages();
      setMessages(msgData);

      // Populate maps concurrently for all roles
      await Promise.all([
        fetchUsernames(),
        fetchHotelNames(msgData)
      ]);

      groupMessages(msgData); // Group only after maps are updated
    } catch (error: any) {
      message.error(`Failed to load data: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
      groupMessages(data);
    } catch (error: any) {
      message.error(`Failed to load messages: ${error.message || 'Please try again.'}`);
    }
  };

  const fetchUsernames = async () => {
    try {
      const users = await getAllUsers();
      const newUserMap = new Map<number, string>();
      users.forEach(user => {
        if (user.id) newUserMap.set(user.id, user.username);
      });
      setUserMap(newUserMap);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchHotelNames = async (msgData: MessageT[]) => {
    try {
      const uniqueHotelIds = new Set(msgData.map(msg => msg.hotelId).filter(id => id !== undefined));
      if (uniqueHotelIds.size === 0) return; // No hotels to fetch
      const hotelPromises = Array.from(uniqueHotelIds).map(id => getHotelById(id!));
      const hotels = await Promise.all(hotelPromises);
      const newHotelMap = new Map<number, string>();
      hotels.forEach(hotel => {
        if (hotel.id) newHotelMap.set(hotel.id, hotel.name);
      });
      setHotelMap(newHotelMap);
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    }
  };

  const groupMessages = (data: MessageT[]) => {
    if (!currentUser) return;
    const isOperator = currentUser.role === 'operator';
    const grouped = data.reduce((acc, msg) => {
      const key = isOperator
        ? `user-${msg.senderId}`
        : `hotel-${msg.hotelId || 'no-hotel'}`;
      const title = isOperator
        ? userMap.get(msg.senderId) // No fallback to ID, rely on map
        : msg.hotelId ? hotelMap.get(msg.hotelId) : 'General Inquiry'; // No fallback to ID
      const senderName = userMap.get(msg.senderId) || `User ${msg.senderId}`; // Fallback for senderName only
      if (!acc[key]) {
        acc[key] = {
          key,
          title: title || (isOperator ? `User ${msg.senderId}` : `Hotel ${msg.hotelId || 'no-hotel'}`), // Fallback as last resort
          latestSender: senderName,
          latestMessage: msg.content || msg.response || '',
          latestSentAt: msg.sentAt || '',
          messages: [],
        };
      }
      acc[key].messages.push(msg);
      if (new Date(msg.sentAt) > new Date(acc[key].latestSentAt)) {
        acc[key].latestMessage = msg.content || msg.response || '';
        acc[key].latestSentAt = msg.sentAt || '';
        acc[key].latestSender = senderName;
      }
      return acc;
    }, {} as Record<string, Conversation>);

    const sortedConvs = Object.values(grouped).sort((a, b) =>
      new Date(b.latestSentAt).getTime() - new Date(a.latestSentAt).getTime()
    );
    setConversations(sortedConvs);
    if (sortedConvs.length > 0 && !selectedConversationKey) {
      setSelectedConversationKey(sortedConvs[0].key);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (messages.length > 0) {
      groupMessages(messages); // Re-group when messages update
    }
    scrollToBottom();
  }, [messages, userMap, hotelMap]); // Trigger re-group when maps update

  const handleReply = async (values: { response: string }) => {
    if (!selectedConversationKey) return;
    const selectedConv = conversations.find((conv) => conv.key === selectedConversationKey);
    if (!selectedConv) {
      message.error('No conversation selected.');
      return;
    }
    const messageIdToRespond = selectedMessageId || (selectedConv.messages[0]?.id || null);
    if (!messageIdToRespond) {
      message.error('No message selected to respond to.');
      return;
    }
    try {
      await respondToMessage(messageIdToRespond, values.response);
      message.success('Response sent!');
      await fetchMessages(); // Refresh messages after reply
      form.resetFields();
      setSelectedMessageId(null); // Reset selected message after sending
    } catch (error: any) {
      message.error(`Failed to send response: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      message.success('Message deleted!');
      await fetchMessages(); // Refresh messages after deletion
    } catch (error: any) {
      message.error(`Failed to delete message: ${error.message || 'Please try again.'}`);
    }
  };

  const handleMessageSelect = (messageId: number | undefined) => {
    if (messageId !== undefined) {
      setSelectedMessageId(messageId === selectedMessageId ? null : messageId); // Toggle selection
    }
  };

  if (!currentUser) {
    return <p style={{ fontSize: 18, padding: 24, textAlign: 'left' }}>Please login to view messages.</p>;
  }

  const selectedConversation = conversations.find(
    (conv) => conv.key === selectedConversationKey
  );

  return (
    <Layout style={{ height: 'calc(100vh - 104px)', padding: 0, width: '1200px', maxWidth: '1200px', textAlign: 'left' }}>
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ padding: 16 }}>Conversations</Title>
        <List
          dataSource={conversations}
          loading={loading}
          renderItem={(conv) => (
            <List.Item
              onClick={() => setSelectedConversationKey(conv.key)}
              style={{
                cursor: 'pointer',
                background: conv.key === selectedConversationKey ? '#e6f7ff' : '#fff',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={conv.title || (currentUser?.role === 'operator' ? `User ${conv.key.split('-')[1]}` : `Hotel ${conv.key.split('-')[1] || 'no-hotel'}`)}
                description={
                  <Text ellipsis style={{ color: '#999', fontSize: 14 }}>
                    {currentUser?.role === 'operator' ? `From ${conv.latestSender}` : `Latest: You`}
                    {conv.latestMessage.length > 30
                      ? ` - ${conv.latestMessage.slice(0, 30)}...`
                      : ` - ${conv.latestMessage}`}
                  </Text>
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(conv.latestSentAt).toLocaleTimeString()}
              </Text>
            </List.Item>
          )}
        />
      </Sider>
      <Content style={{ padding: 48, background: '#f5f5f5', overflowY: 'auto', width: 'calc(100vw - 300px)', maxWidth: 'calc(100vw - 300px)', textAlign: 'left' }}>
        {selectedConversation ? (
          <>
            <Title level={4} style={{ marginBottom: 16 }}>{selectedConversation.title}</Title>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: 24,
                padding: 48,
                background: '#fff',
                borderRadius: 8,
                minHeight: '60vh',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              {selectedConversation.messages.map((msg) => {
                const isSentByCurrentUser = msg.senderId === currentUser?.id;
                const senderName = userMap.get(msg.senderId) || `User ${msg.senderId}`;
                const hotelName = msg.hotelId ? hotelMap.get(msg.hotelId) || `Hotel ${msg.hotelId}` : 'N/A';
                return (
                  <Card
                    key={msg.id}
                    onClick={() => currentUser?.role === 'operator' && msg.id !== undefined && handleMessageSelect(msg.id)} // Safe click handler
                    style={{
                      marginBottom: 16,
                      maxWidth: '98%',
                      minWidth: '500px',
                      marginLeft: isSentByCurrentUser ? 'auto' : 0,
                      marginRight: isSentByCurrentUser ? 16 : 'auto',
                      background: selectedMessageId === msg.id ? '#f0f0f0' : (isSentByCurrentUser ? '#e6f7ff' : '#fff'), // Highlight selected message
                      borderColor: isSentByCurrentUser ? '#91d5ff' : '#d9d9d9',
                      borderRadius: 12,
                      cursor: currentUser?.role === 'operator' ? 'pointer' : 'default',
                    }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <Text style={{ fontSize: 18, lineHeight: 1.5 }}>
                      {currentUser?.role === 'operator'
                        ? `From ${senderName} to ${hotelName} : `
                        : isSentByCurrentUser
                          ? `You: `
                          : `Hotel ${hotelName} - `}
                      {msg.content}
                    </Text>
                    {msg.response && (
                      <Text
                        style={{ display: 'block', marginTop: 12, color: '#666', fontSize: 18, lineHeight: 1.5 }}
                      >
                        <strong>Agent Response:</strong> {msg.response}
                      </Text>
                    )}
                    <Text
                      type="secondary"
                      style={{ display: 'block', marginTop: 8, fontSize: 16 }}
                    >
                      {new Date(msg.sentAt || '').toLocaleString()}
                    </Text>
                    {currentUser.role === 'operator' && msg.id && (
                      <Button
                        danger
                        size="small"
                        onClick={() => msg.id && handleDelete(msg.id)} // Add type guard
                        style={{ marginTop: 12 }}
                      >
                        Delete
                      </Button>
                    )}
                  </Card>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            {currentUser.role === 'operator' && (
              <Form form={form} onFinish={handleReply} style={{ maxWidth: '98%', minWidth: '500px' }}>
                <Form.Item
                  name="response"
                  rules={[{ required: true, message: 'Please enter a response!' }]}
                >
                  <TextArea rows={3} placeholder="Type your response" style={{ fontSize: 18 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" disabled={!selectedMessageId}>
                    Send
                  </Button>
                </Form.Item>
              </Form>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 18, padding: 24, textAlign: 'left' }}>
            Select a conversation to view messages.
          </Text>
        )}
      </Content>
    </Layout>
  );
};

export default Messages;