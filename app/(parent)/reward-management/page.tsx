'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  role: 'parent' | 'child';
}

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  stock: number;
  createdAt: string;
}

export default function RewardManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    stock: '',
  });

  useEffect(() => {
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
    loadRewards();

    // 當頁面重新獲得焦點時重新載入資料
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadRewards();
      }
    };

    const handleFocus = () => {
      loadRewards();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const loadRewards = async () => {
    try {
      const res = await fetch('/api/rewards');
      const data = await res.json();
      if (data.success) {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('載入獎勵失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', points: '', stock: '' });
        loadRewards();
      }
    } catch (error) {
      console.error('建立獎勵失敗:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個獎勵嗎？')) return;

    try {
      const res = await fetch(`/api/rewards?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        loadRewards();
      }
    } catch (error) {
      console.error('刪除獎勵失敗:', error);
    }
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
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2"
              >
                ← 返回控制台
              </button>
              <h1 className="text-2xl font-bold text-gray-900">獎勵管理</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + 建立新獎勵
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">全部獎勵</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{rewards.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">總庫存</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {rewards.reduce((sum, r) => sum + r.stock, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">平均點數</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {rewards.length > 0 
                ? Math.round(rewards.reduce((sum, r) => sum + r.points, 0) / rewards.length)
                : 0}
            </div>
          </div>
        </div>

        {/* 獎勵網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-gray-600">還沒有建立任何獎勵</p>
            </div>
          ) : (
            rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl">🎁</div>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      刪除
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {reward.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {reward.description}
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {reward.points}
                      </div>
                      <div className="text-xs text-gray-500">點數</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {reward.stock}
                      </div>
                      <div className="text-xs text-gray-500">庫存</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 建立獎勵 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">建立新獎勵</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  獎勵名稱
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  獎勵描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所需點數
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  庫存數量
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
