'use client';

import { useState } from 'react';

export default function InitPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dbInfo, setDbInfo] = useState<any>(null);

  const checkStatus = async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/init', {
        method: 'GET',
      });
      const data = await response.json();
      setDbInfo(data);
      setStatus('idle');
    } catch (error) {
      setMessage('檢查狀態失敗');
      setStatus('error');
    }
  };

  const initializeDatabase = async () => {
    try {
      setStatus('loading');
      setMessage('正在初始化資料庫...');
      
      const response = await fetch('/api/init', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(`✅ 初始化成功！使用 ${data.storage} 儲存`);
        // 重新檢查狀態
        await checkStatus();
      } else {
        setStatus('error');
        setMessage('❌ 初始化失敗：' + data.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('❌ 初始化失敗：' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            資料庫初始化
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            首次部署時需要初始化資料庫
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* 資料庫狀態 */}
          {dbInfo && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">
                <p><strong>儲存類型：</strong>{dbInfo.storage}</p>
                <p><strong>已初始化：</strong>{dbInfo.initialized ? '是' : '否'}</p>
                <p><strong>用戶數量：</strong>{dbInfo.userCount}</p>
              </div>
            </div>
          )}

          {/* 訊息顯示 */}
          {message && (
            <div className={`rounded-md p-4 ${
              status === 'success' ? 'bg-green-50' : 
              status === 'error' ? 'bg-red-50' : 
              'bg-blue-50'
            }`}>
              <p className={`text-sm ${
                status === 'success' ? 'text-green-700' : 
                status === 'error' ? 'text-red-700' : 
                'text-blue-700'
              }`}>
                {message}
              </p>
            </div>
          )}

          {/* 按鈕 */}
          <div className="space-y-3">
            <button
              onClick={checkStatus}
              disabled={status === 'loading'}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === 'loading' ? '檢查中...' : '檢查資料庫狀態'}
            </button>

            <button
              onClick={initializeDatabase}
              disabled={status === 'loading'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === 'loading' ? '初始化中...' : '初始化資料庫'}
            </button>
          </div>

          {/* 預設帳號資訊 */}
          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">預設帳號</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>管理員：</strong>admin@homebank.com / Admin@123</p>
              <p><strong>父母：</strong>parent@test.com / password123</p>
              <p><strong>子女：</strong>child@test.com / password123</p>
            </div>
          </div>

          {/* 返回登入 */}
          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              返回登入頁面
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
