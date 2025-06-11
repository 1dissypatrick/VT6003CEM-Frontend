// src/components/HotelDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, message, Descriptions, List, Spin } from 'antd';
import { getHotelById, sendMessage } from '../services/auth.service';
import { HotelT } from '../types/user.type';
import { getCurrentUser } from '../services/auth.service';

const HotelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<HotelT | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setHotel(data);
      } catch (error: any) {
        setError('Failed to load hotel: ' + (error.message || 'Please try again.'));
        message.error(error.message || 'Failed to load hotel.');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [id]);

  const handleInquiry = async () => {
    if (!currentUser) {
      message.warning('Please login to send an inquiry.');
      navigate('/login');
      return;
    }
    if (!hotel) {
      message.error('No hotel data available.');
      return;
    }
    try {
      await sendMessage(hotel.createdBy, parseInt(id!), 'Interested in this hotel. Please provide more details.');
      message.success('Inquiry sent to operator!');
    } catch (error: any) {
      message.error('Failed to send inquiry: ' + (error.message || 'Please try again.'));
    }
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
        loading={loading}
        cover={
          hotel.imageUrl && (
            <img alt={hotel.name} src={hotel.imageUrl} style={{ height: 400, objectFit: 'cover' }} />
          )
        }
        actions={[
          <Button onClick={handleInquiry} disabled={!currentUser}>
            {currentUser ? 'Send Inquiry' : 'Login to Send Inquiry'}
          </Button>,
        ]}
      >
        <Card.Meta title={hotel.name} description={`${hotel.location} - $${hotel.pricePerNight}/night`} />
        <Descriptions title="Hotel Details" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Amenities">{hotel.amenities.join(', ')}</Descriptions.Item>
          <Descriptions.Item label="Price Per Night">${hotel.pricePerNight}</Descriptions.Item>
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
    </div>
  );
};

export default HotelDetails;