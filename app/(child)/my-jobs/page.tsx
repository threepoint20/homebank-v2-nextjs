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

interface Job {
  id: string;
  title: string;
  description: string;
  points: number;
  createdBy: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  actualPoints?: number;
  discount?: number;
}

export default function MyJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    // 直接傳入 userData 來載入工作
    loadJobsWithUser(userData);

    // 當頁面重新獲得焦點時重新載入資料
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadJobsWithUser(userData);
      }
    };

    const handleFocus = () => {
      loadJobsWithUser(userData);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const loadJobsWithUser = async (currentUser: User) => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        console.log('🔍 子女資訊:', { userId: currentUser.id, parentId: currentUser.parentId, name: currentUser.name });
        console.log('📋 所有工作:', data.jobs);
        
        // 只顯示自己父母建立的工作，且符合以下條件之一：
        // 1. 沒有指派（所有子女都可以接）
        // 2. 指派給自己的工作
        const filteredJobs = data.jobs.filter((job: Job) => {
          const isMyParentsJob = job.createdBy === currentUser.parentId;
          const isUnassigned = !job.assignedTo;
          const isAssignedToMe = job.assignedTo === currentUser.id;
          
          console.log(`工作 "${job.title}":`, {
            createdBy: job.createdBy,
            assignedTo: job.assignedTo,
            isMyParentsJob,
            isUnassigned,
            isAssignedToMe,
            shouldShow: isMyParentsJob && (isUnassigned || isAssignedToMe)
          });
          
          return isMyParentsJob && (isUnassigned || isAssignedToMe);
        });
        
        console.log('✅ 過濾後的工作:', filteredJobs);
        setJobs(filteredJobs);
      }
      
      // 同時更新用戶點數
      const userRes = await fetch('/api/users');
      const userData = await userRes.json();
      if (userData.success) {
        const updatedUser = userData.users.find((u: User) => u.id === currentUser.id);
        if (updatedUser) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('載入工作失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!user) return;
    await loadJobsWithUser(user);
  };

  // 計算截止日期狀態
  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      // 已逾期
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '⚠️',
        text: '已逾期',
      };
    } else if (diffHours < 2) {
      // 即將到期（2小時內）
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '⏰',
        text: '即將到期',
      };
    } else {
      // 充裕時間
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '✓',
        text: '充裕時間',
      };
    }
  };

  // 格式化截止日期
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (data.success) {
        // 🟢 優化：立即更新本地狀態，讓 UI 瞬間反應
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId ? data.job : job
        ));
        loadJobs();
      } else {
        alert(data.error || '接取工作失敗');
      }
    } catch (error) {
      console.error('接取工作失敗:', error);
      alert('接取工作失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!user) return;
    
    if (!confirm('確定要提交這個工作嗎？提交後需要等待父母審核。')) return;
    
    setActionLoading(jobId);
    try {
      console.log('🚀 提交工作:', { jobId, userId: user.id });
      
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      console.log('📥 API 回應:', data);
      
      if (data.success) {
        alert('✅ 已提交完成，等待父母審核！');
        // 🟢 優化：立即更新本地狀態，將工作移至「已完成」列表
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId ? data.job : job
        ));
        loadJobs();
      } else {
        console.error('❌ 提交失敗:', data);
        alert(`提交失敗: ${data.error}${data.details ? '\n詳情: ' + data.details : ''}`);
      }
    } catch (error) {
      console.error('❌ 提交失敗 (網路錯誤):', error);
      alert('提交失敗：網路錯誤');
    } finally {
      setActionLoading(null);
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

  const availableJobs = jobs.filter(j => j.status === 'pending');
  const myJobs = jobs.filter(j => j.assignedTo === user?.id && j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.assignedTo === user?.id && (j.status === 'completed' || j.status === 'approved'));

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
                <p className="text-sm text-gray-600">我的工作</p>
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
            <button className="py-4 px-1 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
              我的工作
            </button>
            <button 
              onClick={() => router.push('/my-points')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              我的點數
            </button>
            <button 
              onClick={() => router.push('/reward-shop')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              獎勵商店
            </button>
            <button 
              onClick={() => router.push('/job-history')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              完成歷史
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
                <p className="text-sm text-gray-600">可接取工作</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{availableJobs.length}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">進行中</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{myJobs.length}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已完成/審核中</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{completedJobs.length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* 進行中的工作 */}
        {myJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">進行中的工作</h2>
            </div>
            <div className="p-6 space-y-4">
              {myJobs.map((job) => {
                const dueDateStatus = getDueDateStatus(job.dueDate);
                return (
                  <div key={job.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                        {job.dueDate && (
                          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${dueDateStatus?.bgColor} ${dueDateStatus?.color} ${dueDateStatus?.borderColor} border`}>
                            <span>{dueDateStatus?.icon}</span>
                            <span>截止：{formatDueDate(job.dueDate)}</span>
                            <span className="ml-1">({dueDateStatus?.text})</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600">{job.points}</div>
                        <div className="text-xs text-gray-500">點數</div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleCompleteJob(job.id)}
                        disabled={actionLoading === job.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {actionLoading === job.id ? '處理中...' : '✓ 提交完成'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 可接取的工作 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">可接取的工作</h2>
          </div>
          <div className="p-6">
            {availableJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 mb-2">目前沒有可接取的工作</p>
                <p className="text-sm text-gray-500">
                  請等待父母發布新的工作任務
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map((job) => {
                  const dueDateStatus = getDueDateStatus(job.dueDate);
                  return (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                          {job.dueDate && (
                            <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${dueDateStatus?.bgColor} ${dueDateStatus?.color} ${dueDateStatus?.borderColor} border`}>
                              <span>{dueDateStatus?.icon}</span>
                              <span>截止：{formatDueDate(job.dueDate)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-blue-600">{job.points}</div>
                          <div className="text-xs text-gray-500">點數</div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={actionLoading === job.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {actionLoading === job.id ? '處理中...' : '接取工作'}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
