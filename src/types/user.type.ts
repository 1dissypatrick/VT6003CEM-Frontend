export interface UserT {
  id?: number;
  username: string;
  password?: string;
  email: string;
  role: 'operator' | 'user';
  avatarUrl?: string; // Changed to camelCase
  signupCode?: string;
  token?: string;
}

export interface RegisterUserT {
  username: string;
  email: string;
  password: string;
  signupCode?: string; // Made optional
  role: 'operator' | 'user'; // Added
}

export interface HotelT {
  id?: number;
  name: string;
  location: string;
  price: number;
  availability: { date: string; roomsAvailable: number }[];
  amenities: string[];
  imageUrl?: string;
  description?: string;
  rating?: number;
  createdBy?: number;
}

export interface FavoriteT {
  id?: number; // Added for consistency
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