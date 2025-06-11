// src/components/Home.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, message } from 'antd';
import { getAllUsers, getCurrentUser } from '../services/auth.service';
import { UserT } from '../types/user.type.ts';

const Home: React.FC = () => {
  const [users, setUsers] = useState<UserT[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers(20, 1);
      setUsers(data);
      if (data.length === 0) {
        message.info('No users found in the database.');
      } else if (data.length === 1) {
        message.warning('Only one user found. Add more users to test pagination.');
      }
    } catch (error: any) {
      message.error('Failed to fetch users: ' + (error.message || 'Please ensure you are logged in as an operator.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'operator') {
      fetchUsers();
    }
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Avatar',
      dataIndex: 'avatarurl',
      key: 'avatarurl',
      render: (url: string | null) => (url ? <img src={url} alt="avatar" style={{ width: 40 }} /> : 'None'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#135200' }}>
        <strong>Hotels Agent</strong>
      </h2>
      {currentUser?.role === 'operator' ? (
        <>
          <Button onClick={fetchUsers} loading={loading} style={{ marginBottom: 16 }}>
            Refresh Users
          </Button>
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </>
      ) : (
        <p>Please log in as an operator to view all users.</p>
      )}
    </div>
  );
};

export default Home;