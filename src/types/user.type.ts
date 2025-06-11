// src/types/user.type.ts
export interface UserT {
  id?: number;
  username: string;
  password?: string;
  email: string;
  role: 'operator' | 'user';
  avatarurl?: string;
  signupCode?: string;
  token?: string;
}

export interface RegisterUserT {
  username: string;
  email: string;
  password: string;
  signupCode: string;
}

export interface HotelT {
  id?: number;
  name: string;
  location: string;
  pricePerNight: number;
  availability: { date: string; roomsAvailable: number }[];
  amenities: string[];
  imageUrl?: string;
  createdBy: number; // Operator ID
}

export interface FavoriteT {
  userId: number;
  hotelId: number;
  hotelName: string;
}

export interface MessageT {
  id?: number;
  senderId: number;
  recipientId: number;
  hotelId?: number;
  content: string;
  response?: string;
  sentAt: string;
}