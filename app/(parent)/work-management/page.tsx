'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child';
  parentId?: string;
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

export default function WorkManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    assignedTo: '', // 新增：指派給特定子女
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
    loadData();
  }, [router]);

  const loadData = async () => {
    // 取得當前用戶
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const currentUser = JSON.parse(userStr);
    
    try {
      // 載入工作
      const jobsRes = await fetch('/api/jobs');
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setJobs(jobsData.jobs);
      }

      // 載入子女列表
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersData.success) {
        const childrenList = usersData.users.filter(
          (u: User) => u.role === 'child' && u.parentId === currentUser.id
        );
        setChildren(childrenList);
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const jobData: any = {
        title: formData.title,
        description: formData.description,
        points: formData.points,
        createdBy: user?.id,
      };

      // 如果有指派給特定子女，加入 assignedTo 和設定狀態為 in_progress
      if (formData.assignedTo) {
        jobData.assignedTo = formData.assignedTo;
        jobData.status = 'in_progress';
      }

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', points: '', assignedTo: '' });
        loadData();
      }
    } catch (error) {
      console.error('建立工作失敗:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個工作嗎？')) return;

    try {
      const res = await fetch(`/api/jobs?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('刪除工作失敗:', error);
    }
  };

  const handleApprove = async (jobId: string, jobTitle: string) => {
    if (!confirm(`確定要審核通過「${jobTitle}」嗎？將發放點數給子女。`)) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: user?.id }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ 審核通過！已發放 ${data.pointsAwarded} 點數給 ${data.childName}`);
        loadData();
      } else {
        alert(data.error || '審核失敗');
      }
    } catch (error) {
      console.error('審核失敗:', error);
      alert('審核失敗');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: '待接取',
      in_progress: '進行中',
      completed: '待審核',
      approved: '已完成',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getChildName = (childId?: string) => {
    if (!childId) return '-';
    const child = children.find(c => c.id === childId);
    return child ? child.name : '-';
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
              <h1 className="text-2xl font-bold text-gray-900">工作管理</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + 建立新工作
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">全部工作</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{jobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">待接取</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {jobs.filter(j => j.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">進行中</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {jobs.filter(j => j.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">待審核</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {jobs.filter(j => j.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">已完成</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {jobs.filter(j => j.status === 'approved').length}
            </div>
          </div>
        </div>

        {/* 工作列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  工作名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  指派給
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  指派時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  提交時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  點數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    還沒有建立任何工作
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {job.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getChildName(job.assignedTo)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {job.assignedAt 
                          ? new Date(job.assignedAt).toLocaleString('zh-TW', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {job.completedAt 
                          ? new Date(job.completedAt).toLocaleString('zh-TW', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {job.points} 點
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {job.status === 'completed' ? (
                        <button
                          onClick={() => handleApprove(job.id, job.title)}
                          className="text-green-600 hover:text-green-700 font-medium mr-3"
                        >
                          審核通過
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* 建立工作 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">建立新工作</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工作名稱
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
                  工作描述
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
                  獎勵點數
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
                  指派給（選填）
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">所有子女（待接取）</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  選擇特定子女會直接指派給他，否則所有子女都可以接取
                </p>
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
