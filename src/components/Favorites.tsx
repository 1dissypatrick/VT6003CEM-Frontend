// src/components/Favorites.tsx
import React, { useState, useEffect } from 'react';
import { List, Button, message } from 'antd';
import { getFavorites, removeFavorite } from '../services/auth.service';
import { FavoriteT } from '../types/user.type.ts';
import { getCurrentUser } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteT[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (error: any) {
      message.error('Failed to load favorites: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
    }
  }, []);

  const handleRemove = async (hotelId: number) => {
    try {
      await removeFavorite(hotelId);
      message.success('Hotel removed from favorites!');
      fetchFavorites();
    } catch (error: any) {
      message.error('Failed to remove favorite: ' + (error.message || 'Please try again.'));
    }
  };

  if (!currentUser) {
    return <p>Please login to view your favorites.</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>My Favorites</h2>
      <List
        loading={loading}
        dataSource={favorites}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button onClick={() => navigate(`/hotel/${item.hotelId}`)}>View</Button>,
              <Button danger onClick={() => handleRemove(item.hotelId)}>
                Remove
              </Button>,
            ]}
          >
            {item.hotelName}
          </List.Item>
        )}
      />
    </div>
  );
};

export default Favorites;