import React, { useState, useEffect } from 'react';
import { Card, Button, Descriptions, List, Spin, message, Modal, Form, Input } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getHotelById, sendMessage } from '../services/auth.service';
import { HotelT } from '../types/user.type';
import { getCurrentUser } from '../services/auth.service';

const { TextArea } = Input;

const HotelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<HotelT | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
        const fetchHotel = async () => {
            if (!id || isNaN(parseInt(id))) {
                setError('Invalid hotel ID');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = await getHotelById(parseInt(id));
                // Normalize response fields
                const normalizedData: HotelT = {
                    ...data,
                    imageUrl: (data as any).imageurl || (data as any).image_url || data.imageUrl || '',
                    createdBy: (data as any).createdby || data.createdBy,
                    price: parseFloat(data.price as any) || 0,
                    rating: data.rating ? parseFloat(data.rating as any) : undefined,
                };
                setHotel(normalizedData);
            } catch (error: any) {
                setError('Failed to load hotel: ' + (error.response?.data?.text || error.message || 'Please try again.'));
                message.error(error.response?.data?.text || 'Failed to load hotel.');
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

  const showInquiryModal = () => {
    if (!currentUser) {
      message.warning('Please login to send an inquiry.');
      navigate('/login');
      return;
    }
    if (!hotel) {
      message.error('No hotel data available.');
      return;
    }
    if (!hotel.createdBy) {
      message.error('Cannot send inquiry: Hotel operator not found.');
      return;
    }
    setIsModalVisible(true);
  };

  const handleInquiry = async (values: { content: string }) => {
    if (!hotel || !id || !hotel.createdBy) {
      message.error('Unable to send inquiry: Missing hotel or operator information.');
      return;
    }
    try {
      await sendMessage(hotel.createdBy, parseInt(id), values.content);
      message.success('Inquiry sent to operator!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Please try again.';
      message.error(`Failed to send inquiry: ${errorMsg}`);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <h3>{error || 'Hotel not found'}</h3>
          <Button type="primary" onClick={() => navigate('/hotels')}>
            Back to Hotels
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        cover={
          hotel.imageUrl ? (
            <img alt={hotel.name} src={hotel.imageUrl} style={{ height: 400, objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                height: 400,
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              No Image Available
            </div>
          )
        }
        actions={[
          <Button
            key="inquiry"
            onClick={showInquiryModal}
            disabled={!currentUser || !hotel.createdBy}
          >
            {currentUser ? 'Send Inquiry' : 'Login to Send Inquiry'}
          </Button>,
          <Button key="back" onClick={() => navigate('/hotels')}>
            Back to Hotels
          </Button>,
        ]}
      >
        <Card.Meta title={hotel.name} description={`${hotel.location} - $${hotel.price}/night`} />
        <Descriptions title="Hotel Details" style={{ marginTop: 16 }} column={1}>
          <Descriptions.Item label="Amenities">{hotel.amenities.join(', ') || 'None'}</Descriptions.Item>
          <Descriptions.Item label="Price Per Night">${hotel.price}</Descriptions.Item>
          <Descriptions.Item label="Description">{hotel.description || 'No description available'}</Descriptions.Item>
          <Descriptions.Item label="Rating">{hotel.rating ? `${hotel.rating}/5` : 'Not rated'}</Descriptions.Item>
        </Descriptions>
        <List
          header={<div>Availability</div>}
          dataSource={hotel.availability}
          renderItem={(item) => (
            <List.Item>
              {item.date}: {item.roomsAvailable} rooms available
            </List.Item>
          )}
        />
      </Card>
      <Modal
        title="Send Inquiry"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleInquiry}
          initialValues={{ content: '' }}
        >
          <Form.Item
            name="content"
            rules={[{ required: true, message: 'Please enter your inquiry message!' }]}
          >
            <TextArea rows={4} placeholder="Enter your inquiry message" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Send Inquiry
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelDetails;