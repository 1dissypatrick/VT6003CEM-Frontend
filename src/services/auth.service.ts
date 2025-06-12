import axios from 'axios';
import { UserT, RegisterUserT, HotelT, FavoriteT, MessageT } from '../types/user.type';

const API_URL = 'http://localhost:10888/api/v1';

export const register = async (
  username: string,
  email: string,
  password: string,
  signupCode: string,
  role?: 'operator' | 'user'
): Promise<UserT> => {
  const response = await axios.post(`${API_URL}/users`, {
    username,
    email,
    password,
    signupCode,
    role,
  });
  return response.data;
};

export const login = async (username: string, password: string): Promise<UserT> => {
  const response = await axios.post(`${API_URL}/users/login`, {
    username,
    password,
  });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const getCurrentUser = (): UserT | undefined => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.id, username: payload.username, role: payload.role, email: payload.email };
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const getAllUsers = async (limit: number = 20, page: number = 1): Promise<UserT[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.get(`${API_URL}/users?limit=${limit}&page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getHotels = async (
  search: string = '',
  filters: { location?: string; minPrice?: number; maxPrice?: number } = {}
): Promise<HotelT[]> => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (filters.location) queryParams.append('location', filters.location);
  if (filters.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
  const response = await axios.get(`${API_URL}/hotels?${queryParams.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  console.log('getHotels: Response data:', response.data);
  return Array.isArray(response.data) ? response.data : [];
};

export const getHotelById = async (id: number): Promise<HotelT> => {
  const response = await axios.get(`${API_URL}/hotels/${id}`);
  return response.data;
};

export const addHotel = async (hotel: Omit<HotelT, 'id'>, postToSocial: boolean): Promise<HotelT> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.post(`${API_URL}/hotels`, { ...hotel, postToSocial }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateHotel = async (id: number, hotel: Partial<HotelT>): Promise<HotelT> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.put(`${API_URL}/hotels/${id}`, hotel, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteHotel = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  console.log(`deleteHotel: Sending DELETE to /hotels/${id}`);
  const response = await axios.delete(`${API_URL}/hotels/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateProfilePhoto = async (avatarUrl: string): Promise<UserT> => {
  const user = getCurrentUser();
  if (!user || !user.id || !localStorage.getItem('token')) {
    throw new Error('Not authenticated');
  }
  const response = await axios.patch(`${API_URL}/users/${user.id}`, { avatarUrl }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  localStorage.setItem('user', JSON.stringify({ ...user, avatarUrl }));
  return response.data;
};

export const addFavorite = async (hotelId: number): Promise<FavoriteT> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.post(`${API_URL}/favorites`, { hotelId }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getFavorites = async (): Promise<FavoriteT[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.get(`${API_URL}/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const removeFavorite = async (hotelId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  await axios.delete(`${API_URL}/favorites/${hotelId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const sendMessage = async (recipientId: number, hotelId: number, content: string): Promise<MessageT> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.post(`${API_URL}/messages`, { recipientId, hotelId, content }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getMessages = async (): Promise<MessageT[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.get(`${API_URL}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const respondToMessage = async (messageId: number, response: string): Promise<MessageT> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const responseData = await axios.patch(`${API_URL}/messages/${messageId}`, { response }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return responseData.data;
};

export const deleteMessage = async (messageId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  await axios.delete(`${API_URL}/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};