'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
  parentId?: string;
  points?: number;
  avatar?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingJobs: 0,
    availableRewards: 0,
    totalMembers: 0,
  });
  const [children, setChildren] = useState<User[]>([]);

  useEffect(() => {
    // 檢查登入狀態
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'parent') {
      router.push('/my-jobs');
      return;
    }

    setUser(userData);
    loadStats();
  }, [router]);

  const loadStats = async () => {
    // 取得當前用戶
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const currentUser = JSON.parse(userStr);
    
    try {
      const [jobsRes, rewardsRes, usersRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/rewards'),
        fetch('/api/users'),
      ]);

      const [jobsData, rewardsData, usersData] = await Promise.all([
        jobsRes.json(),
        rewardsRes.json(),
        usersRes.json(),
      ]);

      setStats({
        pendingJobs: jobsData.success 
          ? jobsData.jobs.filter((j: any) => j.status === 'pending').length 
          : 0,
        availableRewards: rewardsData.success ? rewardsData.rewards.length : 0,
        totalMembers: usersData.success ? usersData.users.length : 0,
      });

      // 載入子女列表（只顯示自己的子女）
      if (usersData.success) {
        const childrenList = usersData.users.filter(
          (u: User) => u.role === 'child' && u.parentId === currentUser.id
        );
        setChildren(childrenList);
      }
    } catch (error) {
      console.error('載入統計失敗:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏦 HomeBank V2
              </h1>
              <p className="text-sm text-gray-600">父母控制台</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                歡迎，{user?.name}
              </span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 工作管理 */}
          <div 
            onClick={() => router.push('/work-management')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-4">💼</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              工作管理
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              建立、編輯和管理家庭工作任務
            </p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              前往管理 →
            </button>
          </div>

          {/* 獎勵管理 */}
          <div 
            onClick={() => router.push('/reward-management')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-4">🎁</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              獎勵管理
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              設定可兌換的獎勵項目
            </p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              前往管理 →
            </button>
          </div>

          {/* 帳戶管理 */}
          <div 
            onClick={() => router.push('/account-management')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              帳戶管理
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              管理家庭成員帳戶
            </p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              前往管理 →
            </button>
          </div>
        </div>

        {/* 快速統計 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            系統狀態
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.pendingJobs}</div>
              <div className="text-sm text-gray-600 mt-1">待完成工作</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.availableRewards}</div>
              <div className="text-sm text-gray-600 mt-1">可用獎勵</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{stats.totalMembers}</div>
              <div className="text-sm text-gray-600 mt-1">家庭成員</div>
            </div>
          </div>
        </div>

        {/* 子女列表 */}
        {children.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              子女帳戶
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <div 
                  key={child.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push('/account-management')}
                >
                  <div className="flex items-center gap-3">
                    {child.avatar ? (
                      <img
                        src={child.avatar}
                        alt={child.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold border-2 border-blue-200">
                        {child.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{child.name}</div>
                      <div className="text-sm text-gray-500">{child.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {child.points || 0}
                      </div>
                      <div className="text-xs text-gray-500">點數</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示訊息 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                系統已就緒
              </h3>
              <p className="text-sm text-blue-700">
                點擊上方卡片開始管理工作、獎勵和帳戶。系統會自動同步所有資料。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
