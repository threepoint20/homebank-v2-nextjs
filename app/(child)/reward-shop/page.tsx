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

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  stock: number;
  createdAt: string;
}

export default function RewardShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState<string | null>(null);

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
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // 載入獎勵
      const rewardsRes = await fetch('/api/rewards');
      const rewardsData = await rewardsRes.json();
      if (rewardsData.success) {
        setRewards(rewardsData.rewards.filter((r: Reward) => r.stock > 0));
      }

      // 更新用戶點數
      const userRes = await fetch('/api/users');
      const userData = await userRes.json();
      if (userData.success) {
        const currentUser = userData.users.find((u: User) => u.id === user?.id);
        if (currentUser) {
          setUser(prev => prev ? { ...prev, points: currentUser.points } : null);
        }
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user) return;

    // 檢查點數是否足夠
    if ((user.points || 0) < reward.points) {
      alert('點數不足！');
      return;
    }

    if (!confirm(`確定要兌換「${reward.title}」嗎？將消耗 ${reward.points} 點數。`)) {
      return;
    }

    setRedeemLoading(reward.id);
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          rewardId: reward.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`🎉 兌換成功！已消耗 ${reward.points} 點數`);
        loadData();
      } else {
        alert(data.error || '兌換失敗');
      }
    } catch (error) {
      console.error('兌換失敗:', error);
      alert('兌換失敗');
    } finally {
      setRedeemLoading(null);
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

  const canAfford = (points: number) => (user?.points || 0) >= points;

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
                <p className="text-sm text-gray-600">獎勵商店</p>
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
            <button 
              onClick={() => router.push('/my-points')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              我的點數
            </button>
            <button className="py-4 px-1 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
              獎勵商店
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="text-2xl mr-3">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                如何獲得更多點數？
              </h3>
              <p className="text-sm text-blue-700">
                完成父母發布的工作任務即可獲得點數，累積點數後就能兌換喜歡的獎勵！
              </p>
            </div>
          </div>
        </div>

        {/* 獎勵網格 */}
        {rewards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-600 mb-2">目前沒有可兌換的獎勵</p>
            <p className="text-sm text-gray-500">
              請等待父母新增獎勵項目
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const affordable = canAfford(reward.points);
              return (
                <div 
                  key={reward.id} 
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition ${
                    !affordable ? 'opacity-60' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="text-5xl mb-4 text-center">🎁</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {reward.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {reward.description}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t mb-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {reward.points}
                        </div>
                        <div className="text-xs text-gray-500">所需點數</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {reward.stock}
                        </div>
                        <div className="text-xs text-gray-500">剩餘</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!affordable || redeemLoading === reward.id}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        affordable
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      } disabled:opacity-50`}
                    >
                      {redeemLoading === reward.id 
                        ? '處理中...' 
                        : affordable 
                          ? '立即兌換' 
                          : '點數不足'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
