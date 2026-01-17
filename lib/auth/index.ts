import { User, UserRole } from '../types';
import { db } from '../db';
import { PasswordService } from './password';

export class AuthService {
  async login(email: string, password: string): Promise<User | null> {
    const user = await db.findOne<User>(
      'users.json',
      (u) => u.email === email
    );
    
    if (!user) {
      return null;
    }

    // 驗證密碼
    const isPasswordValid = await PasswordService.verify(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // 不返回密碼
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ user: User | null; errors?: string[] }> {
    // 檢查用戶是否已存在
    const existing = await db.findOne<User>(
      'users.json',
      (u) => u.email === email
    );
    
    if (existing) {
      return { user: null, errors: ['此 email 已被註冊'] };
    }

    // 驗證密碼強度
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return { user: null, errors: passwordValidation.errors };
    }

    // 雜湊密碼
    const hashedPassword = await PasswordService.hash(password);

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      role,
      points: role === 'child' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.create('users.json', newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword as User };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    // 取得用戶
    const user = await db.findOne<User>('users.json', (u) => u.id === userId);
    if (!user) {
      return { success: false, errors: ['用戶不存在'] };
    }

    // 驗證當前密碼
    const isCurrentPasswordValid = await PasswordService.verify(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return { success: false, errors: ['當前密碼錯誤'] };
    }

    // 驗證新密碼強度
    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return { success: false, errors: passwordValidation.errors };
    }

    // 雜湊新密碼
    const hashedNewPassword = await PasswordService.hash(newPassword);

    // 更新密碼
    await db.update('users.json', userId, { password: hashedNewPassword });

    return { success: true };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await db.findOne<User>('users.json', (u) => u.id === id);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  checkPermission(user: User, action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      admin: [
        // 管理員擁有所有權限
        'create_job',
        'edit_job',
        'delete_job',
        'approve_job',
        'create_reward',
        'edit_reward',
        'delete_reward',
        'view_all_users',
        'manage_points',
        'change_password',
        'manage_all_users',
        'delete_any_user',
        'reset_user_password',
        'view_system_stats',
      ],
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
        'change_password',
      ],
      child: [
        'view_jobs',
        'complete_job',
        'view_rewards',
        'redeem_reward',
        'view_own_points',
        'change_password',
      ],
    };

    return permissions[user.role]?.includes(action) || false;
  }
}

export const authService = new AuthService();
