import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/auth.service';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Changed to named import

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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      const idToken = credentialResponse.credential;
      const decodedToken: { email: string; name: string } = jwtDecode(idToken); // Use jwtDecode
      const username = decodedToken.name.replace(/\s+/g, '_').toLowerCase();
      const response = await axios.post('http://localhost:10888/api/v1/users/oauth/google', {
        idToken,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      message.success(`Welcome back, ${response.data.username}!`);
      window.location.reload();
      navigate('/');
    } catch (error: any) {
      message.error(`Google login failed: ${error.response?.data?.error || 'Please try again.'}`);
    }
  };

  const handleGoogleError = () => {
    message.error('Google login failed.');
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
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;