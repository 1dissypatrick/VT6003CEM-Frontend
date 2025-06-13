import React, { useState, useEffect } from 'react';
import { List, Button, message } from 'antd';
import { getFavorites, removeFavorite } from '../services/auth.service';
import { FavoriteT } from '../types/user.type';
import { getCurrentUser } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteT[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    
    try {
      const data = await getFavorites();
      console.log('fetchFavorites: Received favorites:', data);
      setFavorites(data);
    } catch (error: any) {
      console.error('fetchFavorites: Error:', error);
      message.error('Failed to load favorites: ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
    }
  }, [currentUser]);

  const handleView = (hotelId: number | undefined) => {
    if (!hotelId || isNaN(hotelId)) {
      console.error('handleView: Invalid hotelId:', hotelId);
      message.error('Cannot view hotel: Invalid hotel ID');
      return;
    }
    console.log('handleView: Navigating to /hotel/', hotelId);
    navigate(`/hotel/${hotelId}`);
  };

  const handleRemove = async (hotelId: number | undefined) => {
    if (!hotelId || isNaN(hotelId)) {
      console.error('handleRemove: Invalid hotelId:', hotelId);
      message.error('Cannot remove favorite: Invalid hotel ID');
      return;
    }
    try {
      console.log('handleRemove: Removing favorite with hotelId:', hotelId);
      await removeFavorite(hotelId);
      message.success('Hotel removed from favorites!');
      await fetchFavorites();
    } catch (error: any) {
      console.error('handleRemove: Error:', error);
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
              <Button onClick={() => handleView(item.hotelId)}>View</Button>,
              <Button danger onClick={() => handleRemove(item.hotelId)}>
                Remove
              </Button>,
            ]}
          >
            {item.hotelName || 'Unnamed Hotel'}
          </List.Item>
        )}
      />
    </div>
  );
};

export default Favorites;