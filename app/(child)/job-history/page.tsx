'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
  parentId?: string;
  points?: number;
  avatar?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  points: number;
  createdBy: string;
  assignedTo?: string;
  assignedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
}

export default function JobHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
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
    loadHistory(userData);

    // 當頁面重新獲得焦點時重新載入資料
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadHistory(userData);
      }
    };

    const handleFocus = () => {
      loadHistory(userData);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const loadHistory = async (currentUser: User) => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      
      if (data.success) {
        // 只顯示自己的已完成和已審核的工作
        const myJobs = data.jobs.filter((job: Job) => 
          job.assignedTo === currentUser.id && 
          (job.status === 'completed' || job.status === 'approved')
        );

        setCompletedJobs(myJobs.filter((j: Job) => j.status === 'completed'));
        setApprovedJobs(myJobs.filter((j: Job) => j.status === 'approved'));
      }
    } catch (error) {
      console.error('載入歷史失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
    };
    const labels = {
      completed: '待審核',
      approved: '已完成',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  const totalPoints = approvedJobs.reduce((sum, job) => sum + job.points, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📜 完成歷史</h1>
              <p className="text-sm text-gray-600 mt-1">
                查看你的工作完成記錄
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">我的點數</div>
                <div className="text-2xl font-bold text-blue-600">{user?.points || 0}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
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
            <Link
              href="/my-jobs"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              我的工作
            </Link>
            <Link
              href="/my-points"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              我的點數
            </Link>
            <Link
              href="/reward-shop"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              獎勵商店
            </Link>
            <Link
              href="/job-history"
              className="px-3 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              完成歷史
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">待審核工作</div>
            <div className="text-3xl font-bold text-yellow-600">{completedJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">已完成工作</div>
            <div className="text-3xl font-bold text-green-600">{approvedJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">累計獲得點數</div>
            <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
          </div>
        </div>

        {/* 待審核工作 */}
        {completedJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">⏳ 待審核工作</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      工作名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      點數
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      接取時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      提交時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      狀態
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">{job.points} 點</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {job.assignedAt 
                            ? new Date(job.assignedAt).toLocaleString('zh-TW')
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {job.completedAt 
                            ? new Date(job.completedAt).toLocaleString('zh-TW')
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 已完成工作 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">✅ 已完成工作</h2>
          </div>
          {approvedJobs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              還沒有完成任何工作
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      工作名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      點數
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      接取時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      提交時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      審核時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      狀態
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">+{job.points} 點</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {job.assignedAt 
                            ? new Date(job.assignedAt).toLocaleString('zh-TW')
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {job.completedAt 
                            ? new Date(job.completedAt).toLocaleString('zh-TW')
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {job.approvedAt 
                            ? new Date(job.approvedAt).toLocaleString('zh-TW')
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
