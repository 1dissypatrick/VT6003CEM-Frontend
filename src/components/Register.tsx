import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { register } from '../services/auth.service';
import { RegisterUserT } from '../types/user.type';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'user' | 'operator'>('user');

  const handleRegister = async (values: RegisterUserT) => {
    const { username, email, password, signupCode } = values;
    try {
      await register(username, email, password, signupCode || '', role);
      message.success(`Welcome ${username}! Please login to access your account.`);
      navigate('/login');
    } catch (error: any) {
      message.error(
        `Registration failed for ${username}! ${error.response?.data?.error || 'Please try again.'}`
      );
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      const idToken = credentialResponse.credential;
      const decodedToken: { email: string; name: string } = jwtDecode(idToken);
      const username = decodedToken.name.replace(/\s+/g, '_').toLowerCase();
      const response = await axios.post('http://localhost:10888/api/v1/users/oauth/google', {
        idToken,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      message.success(`Welcome ${response.data.username}!`);
      window.location.href = '/';
    } catch (error: any) {
      message.error(`Google registration failed: ${error.response?.data?.error || 'Please try again.'}`);
    }
  };

  const handleGoogleError = () => {
    message.error('Google registration failed.');
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-center mb-6">Register</h3>
      <Form
        layout="vertical"
        name="register"
        initialValues={{ username: '', email: '', password: '', signupCode: '', role: 'user' }}
        onFinish={handleRegister}
        onValuesChange={(changedValues) => {
          if (changedValues.role) {
            setRole(changedValues.role);
          }
        }}
      >
        <Form.Item label="Account Type" name="role">
          <Radio.Group>
            <Radio value="user">User</Radio>
            <Radio value="operator">Operator</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: 'Please input your username!' },
            { min: 3, message: 'Username must be at least 3 characters!' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Username"
            className="rounded-md"
          />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            className="rounded-md"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            className="rounded-md"
          />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm Password"
            className="rounded-md"
          />
        </Form.Item>
        {role === 'operator' && (
          <Form.Item
            name="signupCode"
            label="Signup Code"
            rules={[
              { required: true, message: 'Please enter the signup code!' },
              {
                validator: (_, value) =>
                  value === 'WANDERLUST2025'
                    ? Promise.resolve()
                    : Promise.reject(new Error('Invalid signup code!')),
              },
            ]}
          >
            <Input placeholder="Enter signup code" className="rounded-md" />
          </Form.Item>
        )}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            className="bg-blue-500 hover:bg-blue-600"
          >
            Register
          </Button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            {role === 'user' && (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
              />
            )}
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Register;