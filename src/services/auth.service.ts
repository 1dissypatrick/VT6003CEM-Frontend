// src/services/auth.service.ts
import axios from 'axios';
import { UserT, RegisterUserT, HotelT, FavoriteT, MessageT } from '../types/user.type.ts';

const API_URL = 'http://localhost:10888/api/v1';

export const register = async (
  username: string,
  email: string,
  password: string,
  signupCode: string,
  role: 'operator' | 'user'
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
  }
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('user');
};

export const getCurrentUser = (): UserT | undefined => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : undefined;
};

export const getAllUsers = async (limit: number = 20, page: number = 1): Promise<UserT[]> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.get(`${API_URL}/users?limit=${limit}&page=${page}`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const getHotels = async (
  search?: string,
  filters?: { location?: string; minPrice?: number; maxPrice?: number }
): Promise<HotelT[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (filters?.location) params.append('location', filters.location);
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  const response = await axios.get(`${API_URL}/hotels?${params.toString()}`);
  return response.data;
};

export const getHotelById = async (id: number): Promise<HotelT> => {
  const response = await axios.get(`${API_URL}/hotels/${id}`);
  return response.data;
};

export const addHotel = async (hotel: Omit<HotelT, 'id' | 'createdBy'>, postToSocial: boolean): Promise<HotelT> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.post(`${API_URL}/hotels`, { ...hotel, postToSocial }, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const updateHotel = async (id: number, hotel: Partial<HotelT>): Promise<HotelT> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.patch(`${API_URL}/hotels/${id}`, hotel, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const deleteHotel = async (id: number): Promise<void> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  await axios.delete(`${API_URL}/hotels/${id}`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
};

export const updateProfilePhoto = async (avatarurl: string): Promise<UserT> => {
  const user = getCurrentUser();
  if (!user || !user.token || !user.id) {
    throw new Error('Not authenticated');
  }
  const response = await axios.patch(`${API_URL}/users/${user.id}`, { avatarurl }, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  localStorage.setItem('user', JSON.stringify({ ...user, avatarurl }));
  return response.data;
};

export const addFavorite = async (hotelId: number): Promise<FavoriteT> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.post(`${API_URL}/favorites`, { hotelId }, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const getFavorites = async (): Promise<FavoriteT[]> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.get(`${API_URL}/favorites`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const removeFavorite = async (hotelId: number): Promise<void> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  await axios.delete(`${API_URL}/favorites/${hotelId}`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
};

export const sendMessage = async (recipientId: number, hotelId: number, content: string): Promise<MessageT> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.post(`${API_URL}/messages`, { recipientId, hotelId, content }, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const getMessages = async (): Promise<MessageT[]> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const response = await axios.get(`${API_URL}/messages`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.data;
};

export const respondToMessage = async (messageId: number, response: string): Promise<MessageT> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  const responseData = await axios.patch(`${API_URL}/messages/${messageId}`, { response }, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
  return responseData.data;
};

export const deleteMessage = async (messageId: number): Promise<void> => {
  const user = getCurrentUser();
  if (!user || !user.token) {
    throw new Error('Not authenticated');
  }
  await axios.delete(`${API_URL}/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });
};