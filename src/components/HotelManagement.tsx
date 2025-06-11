// src/components/HotelManagement.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, message, Modal, Form, Input, InputNumber, Checkbox } from 'antd';
import { getHotels, addHotel, updateHotel, deleteHotel } from '../services/auth.service';
import { HotelT } from '../types/user.type.ts';
import { getCurrentUser } from '../services/auth.service';

const HotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelT | null>(null);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const data = await getHotels();
      setHotels(data);
    } catch (error: any) {
      message.error('Failed to load hotels: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'operator') {
      fetchHotels();
    }
  }, []);

  const handleAdd = () => {
    setEditingHotel(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (hotel: HotelT) => {
    setEditingHotel(hotel);
    form.setFieldsValue(hotel);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHotel(id);
      message.success('Hotel deleted successfully!');
      fetchHotels();
    } catch (error: any) {
      message.error('Failed to delete hotel: ' + (error.message || 'Please try again.'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingHotel) {
        await updateHotel(editingHotel.id!, values);
        message.success('Hotel updated successfully!');
      } else {
        await addHotel(
          {
            name: values.name,
            location: values.location,
            pricePerNight: values.pricePerNight,
            availability: values.availability || [],
            amenities: values.amenities ? values.amenities.split(',') : [],
            imageUrl: values.imageUrl,
          },
          values.postToSocial
        );
        message.success('Hotel added successfully!');
      }
      setIsModalVisible(false);
      fetchHotels();
    } catch (error: any) {
      message.error('Failed to save hotel: ' + (error.message || 'Please try again.'));
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Price/Night', dataIndex: 'pricePerNight', key: 'pricePerNight', render: (price: number) => `$${price}` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: HotelT) => (
        <>
          <Button onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
          <Button danger onClick={() => handleDelete(record.id!)}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  if (currentUser?.role !== 'operator') {
    return <p>Access restricted to operators only.</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Hotels</h2>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add Hotel
      </Button>
      <Table dataSource={hotels} columns={columns} rowKey="id" loading={loading} />
      <Modal
        title={editingHotel ? 'Edit Hotel' : 'Add Hotel'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter hotel name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Please enter location!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="pricePerNight" label="Price Per Night" rules={[{ required: true, message: 'Please enter price!' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amenities" label="Amenities (comma-separated)">
            <Input placeholder="e.g., WiFi,Pool,Gym" />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL">
            <Input />
          </Form.Item>
          {!editingHotel && (
            <Form.Item name="postToSocial" valuePropName="checked">
              <Checkbox>Post to social media</Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default HotelManagement;