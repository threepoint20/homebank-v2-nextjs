import { User, Job, Reward } from '../types';
import { db } from './index';
import { PasswordService } from '../auth/password';

export async function getDefaultData() {
  // 雜湊預設密碼
  const hashedPassword = await PasswordService.hash('password123');
  const hashedAdminPassword = await PasswordService.hash('Admin@123');

  // 創建測試用戶
  const users: User[] = [
    {
      id: '0',
      email: 'admin@homebank.com',
      password: hashedAdminPassword,
      name: '系統管理員',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: '1',
      email: 'parent@test.com',
      password: hashedPassword,
      name: '父母帳號',
      role: 'parent',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'child@test.com',
      password: hashedPassword,
      name: '子女帳號',
      role: 'child',
      parentId: '1', // 屬於 parent@test.com
      points: 100,
      createdAt: new Date().toISOString(),
    },
  ];

  // 創建測試工作
  const jobs: Job[] = [
    {
      id: '1',
      title: '整理房間',
      description: '整理自己的房間，包括床鋪和書桌',
      points: 10,
      createdBy: '1',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: '洗碗',
      description: '晚餐後洗碗並整理廚房',
      points: 15,
      createdBy: '1',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  // 創建測試獎勵
  const rewards: Reward[] = [
    {
      id: '1',
      title: '看電影',
      description: '可以選一部電影全家一起看',
      points: 50,
      stock: 10,
      createdBy: '1',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: '零用錢 100 元',
      description: '獲得 100 元零用錢',
      points: 100,
      stock: 5,
      createdBy: '1',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users,
    jobs,
    rewards,
    transactions: [],
  };
}

export async function seedDatabase() {
  const data = await getDefaultData();
  
  // 強制覆寫，確保有管理員帳號
  await db.write('users.json', data.users);
  await db.write('jobs.json', data.jobs);
  await db.write('rewards.json', data.rewards);
  await db.write('transactions.json', data.transactions);

  console.log('✅ 資料庫初始化完成！');
  console.log('📧 管理員帳號: admin@homebank.com');
  console.log('🔑 管理員密碼: Admin@123');
}
