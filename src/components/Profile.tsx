import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Avatar, Descriptions, UploadFile } from 'antd';

import { UserT } from '../types/user.type';
import { updateProfilePhoto, getCurrentUser } from '../services/auth.service';

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [user, setUser] = useState<UserT | null>(null); // Explicitly type as UserT or null

  useEffect(() => {
    const currentUser = getCurrentUser();
    console.log('Profile useEffect currentUser:', currentUser); // Debug log with context
    if (currentUser) {
      setUser(currentUser);
    } else {
      console.warn('No current user found in Profile useEffect');
    }
  }, []);

  if (!user) {
    return <p>Please login to view your profile.</p>;
  }

  // Normalize avatarUrl and email
  const normalizedUser = {
    ...user,
    avatarUrl: user.avatarUrl || 'https://via.placeholder.com/150', // Use avatarUrl directly
    email: user.email || 'N/A',
  };

  const handleUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (values: { avatarUrl?: string }) => {
    setLoading(true);
    try {
      let avatarUrl = values.avatarUrl;
      if (fileList.length > 0) {
        avatarUrl = await handleUpload(fileList[0].originFileObj as File);
      }
      if (!avatarUrl) {
        message.error('Please provide a photo URL or upload a file.');
        return;
      }
      const updatedUser = await updateProfilePhoto(avatarUrl);
      setUser(updatedUser); // Update state with the new user data
      message.success('Profile photo updated!');
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      message.error('Failed to update photo: ' + (error.response?.data?.text || error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h3>Profile</h3>
      <Avatar
        size={100}
        src={normalizedUser.avatarUrl}
        style={{ backgroundColor: '#87d068', marginBottom: 16 }}
      >
        {normalizedUser.username.charAt(0).toUpperCase()}
      </Avatar>
      <Descriptions title="User Information" column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Username">{normalizedUser.username}</Descriptions.Item>
        
      </Descriptions>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="avatarUrl"
          label="Profile Photo URL (Optional)"
          rules={[
            {
              validator: async (_, value: string) => {
                if (!value && fileList.length === 0) {
                  return Promise.reject(new Error('Please provide a photo URL or upload a file.'));
                }
                if (value && !fileList.length) {
                  try {
                    new URL(value);
                  } catch {
                    return Promise.reject(new Error('Please enter a valid URL!'));
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="https://example.com/photo.jpg" disabled={fileList.length > 0} />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Update Photo
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Profile;