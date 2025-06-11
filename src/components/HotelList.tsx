// src/components/HotelList.tsx
import React, { useState, useEffect } from 'react';
import { Card, List, Input, Select, Button, Row, Col, message } from 'antd';
import { getHotels, addFavorite } from '../services/auth.service';
import { HotelT } from '../types/user.type.ts';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.service';

const { Search } = Input;
const { Option } = Select;

const HotelList: React.FC = () => {
  const [hotels, setHotels] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ location?: string; minPrice?: number; maxPrice?: number }>({});
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const data = await getHotels(search, filters);
      setHotels(data);
    } catch (error: any) {
      message.error('Failed to load hotels: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [search, filters]);

  const handleAddFavorite = async (hotelId: number) => {
    if (!currentUser) {
      message.warning('Please login to add favorites.');
      navigate('/login');
      return;
    }
    try {
      await addFavorite(hotelId);
      message.success('Hotel added to favorites!');
    } catch (error: any) {
      message.error('Failed to add favorite: ' + (error.message || 'Please try again.'));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Find Your Perfect Hotel</h2>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Search
            placeholder="Search by hotel name"
            onSearch={(value) => setSearch(value)}
            enterButton
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder="Location"
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
        </Col>
        <Col span={4}>
          <Input
            type="number"
            placeholder="Min Price"
            onChange={(e) => setFilters({ ...filters, minPrice: parseInt(e.target.value) })}
          />
        </Col>
        <Col span={4}>
          <Input
            type="number"
            placeholder="Max Price"
            onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
          />
        </Col>
      </Row>
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={hotels}
        loading={loading}
        renderItem={(hotel) => (
          <List.Item>
            <Card
              hoverable
              cover={hotel.imageUrl && <img alt={hotel.name} src={hotel.imageUrl} style={{ height: 200, objectFit: 'cover' }} />}
              actions={[
                <Button onClick={() => navigate(`/hotel/${hotel.id}`)}>View Details</Button>,
                <Button onClick={() => handleAddFavorite(hotel.id!)}>Add to Favorites</Button>,
              ]}
            >
              <Card.Meta
                title={hotel.name}
                description={`$${hotel.pricePerNight}/night - ${hotel.location}`}
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default HotelList;