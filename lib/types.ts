export type UserRole = 'admin' | 'parent' | 'child';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  parentId?: string;
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
  assignedAt?: string;
  dueDate?: string; // 截止日期 (ISO 8601 格式)
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  actualPoints?: number; // 實際獲得的點數（考慮折扣後）
  discount?: number; // 折扣百分比 (0-100)
  sendCalendarInvite?: boolean; // 是否發送行事曆邀請
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
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

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: number;
  createdAt: string;
  used?: boolean;
}
