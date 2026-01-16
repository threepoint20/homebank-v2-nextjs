import { User, UserRole } from '../types';
import { db } from '../db';

export class AuthService {
  async login(email: string, password: string): Promise<User | null> {
    const user = await db.findOne<User>(
      'users.json',
      (u) => u.email === email && u.password === password
    );
    
    if (user) {
      // 不返回密碼
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    
    return null;
  }

  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<User | null> {
    // 檢查用戶是否已存在
    const existing = await db.findOne<User>(
      'users.json',
      (u) => u.email === email
    );
    
    if (existing) {
      return null;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role,
      points: role === 'child' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.create('users.json', newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await db.findOne<User>('users.json', (u) => u.id === id);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  checkPermission(user: User, action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      parent: [
        'create_job',
        'edit_job',
        'delete_job',
        'approve_job',
        'create_reward',
        'edit_reward',
        'delete_reward',
        'view_all_users',
        'manage_points',
      ],
      child: [
        'view_jobs',
        'complete_job',
        'view_rewards',
        'redeem_reward',
        'view_own_points',
      ],
    };

    return permissions[user.role]?.includes(action) || false;
  }
}

export const authService = new AuthService();
