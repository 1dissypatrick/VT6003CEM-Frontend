// src/components/Packages.tsx
import React, { useState, useEffect } from 'react';
import { List, Card, message } from 'antd';
import { getHotels } from '../services/auth.service';
import { HotelT } from '../types/user.type';

// Mock flight data (replace with real API later)
const mockFlights = [
  { id: 1, destination: 'Paris', price: 300 }, // Fixed string literal
  { id: 2, destination: 'London', price: 250 },
];

const Packages: React.FC = () => {
  const [hotels, setHotels] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const data = await getHotels();
      setHotels(data);
    } catch (error: any) {
      message.error('Failed to load packages: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Hotel + Flight Packages</h2>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={hotels}
        loading={loading}
        renderItem={(hotel) => (
          <List.Item>
            <Card
              title={`${hotel.name} + Flight to ${mockFlights[0].destination}`}
              extra={<span>${hotel.price + mockFlights[0].price}</span>}
            >
              <p>Hotel: {hotel.location}</p>
              <p>Flight: {mockFlights[0].destination}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default Packages;