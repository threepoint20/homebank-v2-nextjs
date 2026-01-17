'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
  points?: number;
  avatar?: string;
}

interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'transfer';
  description: string;
  relatedId?: string;
  createdAt: string;
}

export default function MyPointsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'child') {
      router.push('/dashboard');
      return;
    }

    setUser(userData);
    loadDataWithUser(userData);

    // 當頁面重新獲得焦點時重新載入資料
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDataWithUser(userData);
      }
    };

    const handleFocus = () => {
      loadDataWithUser(userData);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const loadDataWithUser = async (currentUser: User) => {
    try {
      // 載入交易記錄
      const res = await fetch('/api/points');
      const data = await res.json();
      if (data.success) {
        const myTransactions = data.transactions.filter(
          (t: PointTransaction) => t.userId === currentUser.id
        );
        setTransactions(myTransactions);
      }

      // 更新用戶點數
      const userRes = await fetch('/api/users');
      const userData = await userRes.json();
      if (userData.success) {
        const updatedUser = userData.users.find((u: User) => u.id === currentUser.id);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const currentUser = JSON.parse(userStr);
    await loadDataWithUser(currentUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  const totalEarned = transactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter(t => t.type === 'spend')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold border-2 border-blue-200">
                  {user?.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏦 HomeBank V2
                </h1>
                <p className="text-sm text-gray-600">我的點數</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">我的點數</div>
                <div className="text-2xl font-bold text-blue-600">
                  {user?.points || 0}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button 
              onClick={() => router.push('/my-jobs')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              我的工作
            </button>
            <button className="py-4 px-1 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
              我的點數
            </button>
            <button 
              onClick={() => router.push('/reward-shop')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              獎勵商店
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">當前點數</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{user?.points || 0}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">累計賺取</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{totalEarned}</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">累計消費</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{totalSpent}</p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>
        </div>

        {/* 交易記錄 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">交易記錄</h2>
          </div>
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600 mb-2">還沒有交易記錄</p>
                <p className="text-sm text-gray-500">
                  完成工作或兌換獎勵後會顯示在這裡
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl ${
                        transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'earn' ? '💰' : '🎁'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString('zh-TW')}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xl font-bold ${
                      transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
