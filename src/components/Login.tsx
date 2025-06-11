// src/components/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/auth.service';

interface LoginValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async (values: LoginValues) => {
    const { username, password } = values;
    try {
      await login(username, password);
      message.success(`Welcome back, ${username}!`);
      window.location.reload();
      navigate('/');
    } catch (error: any) {
      message.error(`Login failed: ${error?.response?.data?.error || 'Please try again.'}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center' }}>
        <strong>Login</strong>
      </h3>
      <Form layout="vertical" name="login" onFinish={handleLogin}>
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;