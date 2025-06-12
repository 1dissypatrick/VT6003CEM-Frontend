import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { Table, Button, message, Modal, Form, Input, InputNumber, Checkbox, DatePicker, List, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getHotels, addHotel, updateHotel, deleteHotel, getCurrentUser } from '../services/auth.service';
import { HotelT } from '../types/user.type';

class HotelManagementErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HotelManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <p className="text-red-500 text-center mt-4">Something went wrong. Please try again later.</p>;
    }
    return this.props.children;
  }
}

const HotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelT | null>(null);
  const [form] = Form.useForm();
  const [availability, setAvailability] = useState<{ date: string; roomsAvailable: number }[]>([]);
  const currentUser = getCurrentUser();

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const data = await getHotels();
      console.log('fetchHotels: Received data:', data);
      if (!Array.isArray(data)) {
        console.error('fetchHotels: Expected array, got:', data);
        message.error('Invalid hotel data received');
        setHotels([]);
        return;
      }
      setHotels(data);
    } catch (error: any) {
      console.error('fetchHotels: Error:', error);
      message.error(`Failed to load hotels: ${error.response?.data?.error || error.message || 'Please try again.'}`);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'operator') {
      fetchHotels();
    }
  }, []);

  const handleEdit = (hotel: HotelT) => {
    setEditingHotel(hotel);
    setAvailability(hotel.availability || []);
    form.setFieldsValue({
      ...hotel,
      amenities: hotel.amenities?.join(', ') || '',
      availability: undefined,
    });
    setIsModalVisible(true);
  };

  const handleAdd = async () => {
    setEditingHotel(null);
    setAvailability([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      console.log(`handleDelete: Deleting hotel id=${id}`);
      await deleteHotel(id);
      message.success('Hotel deleted successfully!');
      fetchHotels();
    } catch (error: any) {
      console.error('handleDelete: Error:', error);
      message.error(`Failed to delete hotel: ${error.response?.data?.error || 'Please try again.'}`);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const amenitiesArray = typeof values.amenities === 'string'
        ? values.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
        : Array.isArray(values.amenities)
        ? values.amenities.filter(Boolean)
        : [];
      const hotelData: Partial<HotelT> = {
        name: values.name,
        location: values.location,
        price: values.price,
        availability: availability,
        amenities: amenitiesArray,
        imageUrl: values.imageUrl || undefined,
        description: values.description || '',
        rating: values.rating || undefined,
      };
      console.log('handleSubmit: Hotel data:', hotelData);
      if (editingHotel) {
        await updateHotel(editingHotel.id!, hotelData);
        message.success('Hotel updated successfully!');
      } else {
        await addHotel(hotelData as Omit<HotelT, 'id'>, values.postToSocial || false);
        message.success('Hotel added successfully!');
      }
      setIsModalVisible(false);
      fetchHotels();
    } catch (error: any) {
      console.error('handleSubmit: Error:', error);
      message.error(`Failed to save hotel: ${error.response?.data?.error || 'Please try again.'}`);
    }
  };

  const addAvailability = () => {
    form.validateFields(['availDate', 'availRooms']).then((values) => {
      if (values.availDate && values.availRooms >= 0) {
        setAvailability([
          ...availability,
          { date: values.availDate.format('YYYY-MM-DD'), roomsAvailable: values.availRooms },
        ]);
        form.setFieldsValue({ availDate: null, availRooms: null });
      }
    });
  };

  const removeAvailability = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Price/Night', dataIndex: 'price', key: 'price', render: (price: number) => `$${price}` },
    {
      title: 'Availability',
      dataIndex: 'availability',
      key: 'availability',
      render: (avail: { date: string; roomsAvailable: number }[]) =>
        avail?.length ? `${avail.length} dates` : 'None',
    },
    {
      title: 'Amenities',
      dataIndex: 'amenities',
      key: 'amenities',
      render: (amenities: string[]) => amenities?.join(', ') || 'None',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: HotelT) => (
        <div className="flex space-x-2">
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this hotel?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (currentUser?.role !== 'operator') {
    return <p className="text-red-500 text-center mt-4">Access restricted to operators only.</p>;
  }

  return (
    <HotelManagementErrorBoundary>
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Manage Hotels</h2>
        <Button type="primary" onClick={handleAdd} className="mb-4 bg-blue-500 hover:bg-blue-600">
          Add Hotel
        </Button>
        <Table
          dataSource={hotels}
          columns={columns}
          rowKey="id"
          loading={loading}
          className="bg-white rounded-lg shadow"
        />
        <Modal
          title={editingHotel ? 'Edit Hotel' : 'Add Hotel'}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => form.submit()}
          okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-600' }}
          className="rounded-lg"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter hotel name!' }]}
            >
              <Input className="rounded-md" />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please enter location!' }]}
            >
              <Input className="rounded-md" />
            </Form.Item>
            <Form.Item
              name="price"
              label="Price Per Night"
              rules={[{ required: true, message: 'Please enter price!' }]}
            >
              <InputNumber min={0} className="w-full rounded-md" />
            </Form.Item>
            <Form.Item label="Availability">
              <div className="flex space-x-2 mb-2">
                <Form.Item name="availDate" noStyle>
                  <DatePicker
                    format="YYYY-MM-DD"
                    className="rounded-md"
                    placeholder="Select date"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
                <Form.Item name="availRooms" noStyle>
                  <InputNumber min={0} placeholder="Rooms" className="rounded-md" />
                </Form.Item>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addAvailability}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Add
                </Button>
              </div>
              <List
                bordered
                dataSource={availability}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={() => removeAvailability(index)}
                        className="text-red-500"
                      />,
                    ]}
                  >
                    {item.date}: {item.roomsAvailable} rooms
                  </List.Item>
                )}
                className="rounded-md"
              />
            </Form.Item>
            <Form.Item
              name="amenities"
              label="Amenities (comma-separated)"
              rules={[{ required: true, message: 'Please enter amenities!' }]}
            >
              <Input placeholder="e.g., WiFi, Pool, Gym" className="rounded-md" />
            </Form.Item>
            <Form.Item name="imageUrl" label="Image URL">
              <Input className="rounded-md" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea className="rounded-md" />
            </Form.Item>
            <Form.Item
              name="rating"
              label="Rating (0-5)"
              rules={[{ type: 'number', min: 0, max: 5, message: 'Rating must be between 0 and 5!' }]}
            >
              <InputNumber min={0} max={5} step={0.1} className="w-full rounded-md" />
            </Form.Item>
            {!editingHotel && (
              <Form.Item name="postToSocial" valuePropName="checked">
                <Checkbox>Post to social media</Checkbox>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </HotelManagementErrorBoundary>
  );
};

export default HotelManagement;