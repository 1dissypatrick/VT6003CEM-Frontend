// src/components/Profile.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Avatar } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { updateProfilePhoto, getCurrentUser } from '../services/auth.service';

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <p>Please login to view your profile.</p>;
  }

  const handleSubmit = async (values: { avatarurl: string }) => {
    setLoading(true);
    try {
      await updateProfilePhoto(values.avatarurl);
      message.success('Profile photo updated!');
    } catch (error: any) {
      message.error('Failed to update photo: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <h3>Profile</h3>
      <Avatar
        size={100}
        src={currentUser.avatarurl}
        style={{ backgroundColor: '#87d068', marginBottom: 16 }}
      >
        {currentUser.username.charAt(0).toUpperCase()}
      </Avatar>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="avatarurl" label="Profile Photo URL" rules={[{ required: true, message: 'Please enter a photo URL!' }]}>
          <Input placeholder="https://example.com/photo.jpg" />
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