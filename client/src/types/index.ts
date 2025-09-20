export interface User {
  id: number;
  username: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category_id: number;
  seller_id: number;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  seller_name?: string;
  seller_email?: string;
}

export interface Bid {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  username?: string;
  category_name?: string;
}

export interface CategoryPrivilege {
  id: number;
  category_id: number;
  user_id: number;
  bid_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired';
  username?: string;
  email?: string;
  category_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  read_status: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}