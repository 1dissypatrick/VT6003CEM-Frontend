import React, { useState, useEffect } from 'react';
import { List, Button, Input, message, Form } from 'antd';
import { getMessages, respondToMessage, deleteMessage } from '../services/auth.service';
import { MessageT } from '../types/user.type';
import { getCurrentUser } from '../services/auth.service';

const { TextArea } = Input;

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<MessageT[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error: any) {
      message.error(`Failed to load messages: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
    }
  }, [currentUser]);

  const handleReply = async (messageId: number, values: { response: string }) => {
    try {
      await respondToMessage(messageId, values.response);
      message.success('Response sent!');
      fetchMessages();
      form.resetFields();
    } catch (error: any) {
      message.error(`Failed to send response: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      message.success('Message deleted!');
      fetchMessages();
    } catch (error: any) {
      message.error(`Failed to delete message: ${error.message || 'Please try again.'}`);
    }
  };

  if (!currentUser) {
    return <p>Please login to view messages.</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Messages</h2>
      <List
        dataSource={messages}
        loading={loading}
        renderItem={(item) => (
          <List.Item
            actions={
              currentUser.role === 'operator' && item.id
                ? [
                    <Form
                      form={form}
                      key={`form-${item.id}`}
                      onFinish={(values) => handleReply(item.id!, values)}
                    >
                      <Form.Item
                        name="response"
                        rules={[{ required: true, message: 'Please enter a response!' }]}
                      >
                        <TextArea rows={2} placeholder="Type your response" />
                      </Form.Item>
                      <Button type="primary" htmlType="submit">
                        Reply
                      </Button>
                    </Form>,
                    <Button danger onClick={() => handleDelete(item.id!)} key={`delete-${item.id}`}>
                      Delete
                    </Button>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              title={`From User ID ${item.senderId} about Hotel ${item.hotelId || 'N/A'}`}
              description={
                <>
                  <p>{item.content}</p>
                  {item.response && (
                    <p>
                      <strong>Response:</strong> {item.response}
                    </p>
                  )}
                  <p>
                    <strong>Sent:</strong> {item.sentAt || 'Unknown'}
                  </p>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default Messages;