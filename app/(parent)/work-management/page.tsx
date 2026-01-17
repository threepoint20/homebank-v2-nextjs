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
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  actualPoints?: number;
  discount?: number;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[];
  recurringEndDate?: string;
  parentJobId?: string;
}

export default function WorkManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // 篩選和搜尋狀態
  const [filters, setFilters] = useState({
    status: 'all',
    isRecurring: 'all',
    assignedTo: 'all',
    startDate: '',
    endDate: '',
    searchText: '',
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    assignedTo: '', // 新增：指派給特定子女
    dueDate: '', // 截止日期 (YYYY-MM-DDTHH:mm 格式)
    sendCalendarInvite: false, // 是否發送行事曆邀請
    isRecurring: false, // 是否為週期性工作
    recurringPattern: 'daily' as 'daily' | 'weekly' | 'monthly', // 週期類型
    recurringDays: [] as number[], // 每週的哪幾天
    recurringEndDate: '', // 週期結束日期
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

    // 當頁面重新獲得焦點時重新載入資料
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    const handleFocus = () => {
      loadData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const loadData = async () => {
    // 取得當前用戶
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const currentUser = JSON.parse(userStr);
    
    try {
      // 先處理過期工作
      await fetch('/api/jobs/expired', { method: 'POST' });
      
      // 再檢查並生成週期性工作
      await fetch('/api/jobs/recurring', { method: 'POST' });
      
      // 載入工作
      const jobsRes = await fetch('/api/jobs');
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        // 只顯示當前父母創建的工作
        const myJobs = jobsData.jobs.filter((job: Job) => job.createdBy === currentUser.id);
        setJobs(myJobs);
        setFilteredJobs(myJobs); // 初始化篩選結果
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

  // 應用篩選
  useEffect(() => {
    let result = [...jobs];

    // 狀態篩選
    if (filters.status !== 'all') {
      result = result.filter(job => job.status === filters.status);
    }

    // 週期性篩選
    if (filters.isRecurring === 'yes') {
      result = result.filter(job => job.isRecurring === true && !job.parentJobId);
    } else if (filters.isRecurring === 'no') {
      result = result.filter(job => !job.isRecurring || job.parentJobId);
    }

    // 指派對象篩選
    if (filters.assignedTo !== 'all') {
      result = result.filter(job => job.assignedTo === filters.assignedTo);
    }

    // 時間區間篩選
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(job => {
        if (!job.dueDate) return false;
        return new Date(job.dueDate) >= startDate;
      });
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(job => {
        if (!job.dueDate) return false;
        return new Date(job.dueDate) <= endDate;
      });
    }

    // 文字搜尋
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredJobs(result);
  }, [jobs, filters]);

  // 匯出 Excel
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    
    // 準備資料
    const exportData = filteredJobs.map(job => ({
      '工作名稱': job.title,
      '描述': job.description,
      '指派給': getChildName(job.assignedTo),
      '截止日期': job.dueDate 
        ? new Date(job.dueDate).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '-',
      '指派時間': job.assignedAt 
        ? new Date(job.assignedAt).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '-',
      '提交時間': job.completedAt 
        ? new Date(job.completedAt).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '-',
      '點數': job.points,
      '狀態': job.status === 'pending' ? '待接取' :
              job.status === 'in_progress' ? '進行中' :
              job.status === 'completed' ? '待審核' : '已完成',
      '週期性': job.isRecurring && !job.parentJobId ? 
        (job.recurringPattern === 'daily' ? '每天' :
         job.recurringPattern === 'weekly' ? '每週' : '每月') : '-',
    }));

    // 創建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '工作列表');

    // 下載檔案
    const fileName = `工作列表_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const jobData: any = {
        title: formData.title,
        description: formData.description,
        points: formData.points,
        createdBy: user?.id,
        sendCalendarInvite: formData.sendCalendarInvite,
        isRecurring: formData.isRecurring,
      };

      // 如果有設定截止日期，轉換為 ISO 8601 格式
      if (formData.dueDate) {
        jobData.dueDate = new Date(formData.dueDate).toISOString();
      }

      // 如果是週期性工作，加入週期設定
      if (formData.isRecurring) {
        jobData.recurringPattern = formData.recurringPattern;
        if (formData.recurringPattern === 'weekly' && formData.recurringDays.length > 0) {
          jobData.recurringDays = formData.recurringDays;
        }
        if (formData.recurringEndDate) {
          jobData.recurringEndDate = new Date(formData.recurringEndDate).toISOString();
        }
      }

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
        // 如果勾選了加入行事曆，自動下載 .ics 檔案
        if (formData.sendCalendarInvite && formData.assignedTo && formData.dueDate) {
          await downloadCalendarFile(data.job);
        }
        
        setShowModal(false);
        setFormData({ 
          title: '', 
          description: '', 
          points: '', 
          assignedTo: '', 
          dueDate: '', 
          sendCalendarInvite: false,
          isRecurring: false,
          recurringPattern: 'daily',
          recurringDays: [],
          recurringEndDate: '',
        });
        loadData();
        
        // 顯示成功訊息
        let message = '✅ 工作已建立！';
        if (formData.isRecurring) {
          message += '\n📅 週期性工作已設定';
        }
        if (formData.sendCalendarInvite && formData.assignedTo) {
          message += '\n行事曆檔案已下載，請點擊檔案加入到 iCloud 行事曆';
        }
        alert(message);
      }
    } catch (error) {
      console.error('建立工作失敗:', error);
      alert('建立工作失敗');
    }
  };

  // 下載行事曆檔案
  const downloadCalendarFile = async (job: any) => {
    try {
      // 獲取子女和父母資訊
      const childId = job.assignedTo;
      const child = children.find(c => c.id === childId);
      
      if (!child) {
        console.error('找不到子女資訊');
        return;
      }

      // 呼叫 API 生成 .ics 檔案
      const response = await fetch('/api/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          childName: child.name,
          parentName: user?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('生成行事曆檔案失敗');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HomeBank-${job.title}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ 行事曆檔案已下載');
    } catch (error) {
      console.error('下載行事曆檔案失敗:', error);
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
        // 立即更新本地狀態
        setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
        
        // 然後重新載入完整資料（確保資料一致性）
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
        // 立即更新本地狀態
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, status: 'approved' as const, approvedAt: new Date().toISOString() }
              : job
          )
        );
        
        // 顯示審核結果訊息
        let message = `✅ 審核通過！\n`;
        message += `子女：${data.childName}\n`;
        message += `原始點數：${data.originalPoints} 點\n`;
        
        if (data.discount !== 100) {
          message += `折扣：${data.discount}%\n`;
          message += `實際獲得：${data.pointsAwarded} 點\n`;
          message += `${data.discountMessage}`;
        } else {
          message += `獲得點數：${data.pointsAwarded} 點`;
        }
        
        alert(message);
        
        // 最後重新載入完整資料（確保資料一致性）
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
        {/* 篩選和搜尋區域 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">篩選和搜尋</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 狀態篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="pending">待接取</option>
                <option value="in_progress">進行中</option>
                <option value="completed">待審核</option>
                <option value="approved">已完成</option>
              </select>
            </div>

            {/* 週期性篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                週期性
              </label>
              <select
                value={filters.isRecurring}
                onChange={(e) => setFilters({ ...filters, isRecurring: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="yes">週期性工作</option>
                <option value="no">單次工作</option>
              </select>
            </div>

            {/* 指派對象篩選 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                指派給
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 開始日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日期
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 結束日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束日期
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 文字搜尋 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜尋工作
              </label>
              <input
                type="text"
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                placeholder="搜尋工作名稱或描述..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setFilters({
                status: 'all',
                isRecurring: 'all',
                assignedTo: 'all',
                startDate: '',
                endDate: '',
                searchText: '',
              })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              清除篩選
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <span>📊</span>
              匯出 Excel ({filteredJobs.length} 筆)
            </button>
          </div>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">全部工作</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{filteredJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">待接取</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {filteredJobs.filter(j => j.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">進行中</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {filteredJobs.filter(j => j.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">待審核</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {filteredJobs.filter(j => j.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">已完成</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {filteredJobs.filter(j => j.status === 'approved').length}
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
                  週期性
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  截止日期
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
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    {jobs.length === 0 ? '還沒有建立任何工作' : '沒有符合條件的工作'}
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      {job.isRecurring && (
                        <div className="text-xs text-indigo-600 mt-1">
                          🔄 週期性 ({
                            job.recurringPattern === 'daily' ? '每天' :
                            job.recurringPattern === 'weekly' ? '每週' :
                            '每月'
                          })
                        </div>
                      )}
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
                      {job.isRecurring && !job.parentJobId ? (
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            🔄 {
                              job.recurringPattern === 'daily' ? '每天' :
                              job.recurringPattern === 'weekly' ? '每週' :
                              '每月'
                            }
                          </span>
                        </div>
                      ) : job.parentJobId ? (
                        <span className="text-xs text-gray-500">週期生成</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {job.dueDate 
                          ? new Date(job.dueDate).toLocaleString('zh-TW', {
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期（選填）
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⏰ 逾期規則：+1小時 7折、+1.5小時 5折、+2小時 3折、超過2小時 0點、超過當天扣點
                </p>
              </div>
              
              {/* 週期性工作選項 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-indigo-900">
                      🔄 週期性工作
                    </div>
                    <div className="text-xs text-indigo-700 mt-1">
                      自動重複建立工作，不需每天手動設定
                    </div>
                  </div>
                </label>
                
                {/* 週期設定 */}
                {formData.isRecurring && (
                  <div className="mt-4 space-y-3 pl-7">
                    <div>
                      <label className="block text-xs font-medium text-indigo-900 mb-1">
                        重複頻率
                      </label>
                      <select
                        value={formData.recurringPattern}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          recurringPattern: e.target.value as 'daily' | 'weekly' | 'monthly',
                          recurringDays: [] // 切換時清空選擇的日期
                        })}
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="daily">每天</option>
                        <option value="weekly">每週</option>
                        <option value="monthly">每月</option>
                      </select>
                    </div>
                    
                    {/* 每週選擇星期幾 */}
                    {formData.recurringPattern === 'weekly' && (
                      <div>
                        <label className="block text-xs font-medium text-indigo-900 mb-2">
                          選擇星期幾
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                            <label key={index} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.recurringDays.includes(index)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      recurringDays: [...formData.recurringDays, index].sort()
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      recurringDays: formData.recurringDays.filter(d => d !== index)
                                    });
                                  }
                                }}
                                className="mr-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-indigo-900">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-medium text-indigo-900 mb-1">
                        結束日期（選填）
                      </label>
                      <input
                        type="date"
                        value={formData.recurringEndDate}
                        onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      <p className="text-xs text-indigo-600 mt-1">
                        不設定則持續重複
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 加入行事曆選項 */}
              {formData.assignedTo && formData.dueDate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendCalendarInvite}
                      onChange={(e) => setFormData({ ...formData, sendCalendarInvite: e.target.checked })}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-purple-900">
                        📅 下載行事曆檔案（.ics）
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        建立工作後自動下載 .ics 檔案，點擊檔案即可加入到 iCloud 行事曆，所有 Apple 裝置（Mac/iPad/iPhone）都會同步顯示
                      </div>
                    </div>
                  </label>
                </div>
              )}
              
              {/* 提示訊息 */}
              {formData.assignedTo && !formData.dueDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    💡 提示：設定截止日期後，可以選擇下載行事曆檔案加入到 iCloud 行事曆
                  </p>
                </div>
              )}
              
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
