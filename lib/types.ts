export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  points?: number;
  avatar?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  points: number;
  createdBy: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  imageUrl?: string;
  stock: number;
  createdBy: string;
  createdAt: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'transfer';
  description: string;
  relatedId?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}
