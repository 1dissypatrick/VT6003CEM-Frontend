import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Avatar, Descriptions, UploadFile } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { updateProfilePhoto, getCurrentUser } from '../services/auth.service';

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };
    fetchUser();
  }, []);

  if (!user) {
    return <p>Please login to view your profile.</p>;
  }

  // Normalize avatarurl to avatarUrl
  const normalizedUser = {
    ...user,
    avatarUrl: (user as any).avatarurl || user.avatarUrl || 'https://via.placeholder.com/150',
    email: user.email || 'N/A',
  };

  const handleUpload = async (file: File): Promise<string> => {
    // Mock upload to a storage service (replace with actual service like AWS S3 or Cloudinary)
    // For demo, convert file to base64
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
      await updateProfilePhoto(avatarUrl);
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
      message.success('Profile photo updated!');
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      message.error('Failed to update photo: ' + (error.response?.data?.text || error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file: UploadFile) => {
      setFileList([file]);
      return false; // Prevent auto-upload
    },
    fileList,
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
        <Descriptions.Item label="Email">{normalizedUser.email}</Descriptions.Item>
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
        <Form.Item label="Upload Profile Photo">
          <Upload {...uploadProps} accept="image/*">
            <Button icon={<UploadOutlined />}>Select Photo</Button>
          </Upload>
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