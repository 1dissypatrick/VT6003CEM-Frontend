import React, { useState, useEffect } from 'react';
import { Card, Button, Descriptions, List, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
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
        if (!hotel.createdBy) {
            message.error('Cannot send inquiry: Hotel operator not found.');
            return;
        }
        try {
            await sendMessage(hotel.createdBy, parseInt(id!), 'Interested in this hotel. Please provide more details.');
            message.success('Inquiry sent to operator!');
        } catch (error: any) {
            message.error('Failed to send inquiry: ' + (error.response?.data?.text || 'Please try again.'));
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
                cover={
                    hotel.imageUrl ? (
                        <img alt={hotel.name} src={hotel.imageUrl} style={{ height: 400, objectFit: 'cover' }} />
                    ) : (
                        <div style={{ height: 400, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            No Image Available
                        </div>
                    )
                }
                actions={[
                    <Button onClick={handleInquiry} disabled={!currentUser || !hotel.createdBy}>
                        {currentUser ? 'Send Inquiry' : 'Login to Send Inquiry'}
                    </Button>,
                    <Button onClick={() => navigate('/hotels')}>Back to Hotels</Button>,
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
        </div>
    );
};

export default HotelDetails;