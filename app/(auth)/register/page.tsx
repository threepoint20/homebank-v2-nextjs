'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PasswordStrength {
  score: number;
  errors: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'child' as 'parent' | 'child',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, errors: [] });

  // 檢查密碼強度（前端預覽）
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
      errors.push('密碼至少需要 8 個字元');
    } else {
      score += 20;
    }

    if (password.length >= 12) score += 10;
    if (/[a-z]/.test(password)) score += 15;
    else errors.push('需要包含小寫字母');
    
    if (/[A-Z]/.test(password)) score += 15;
    else errors.push('需要包含大寫字母');
    
    if (/\d/.test(password)) score += 15;
    else errors.push('需要包含數字');
    
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    else errors.push('需要包含特殊字元');

    score = Math.max(0, Math.min(100, score));
    return { score, errors };
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, errors: [] });
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 30) return 'bg-red-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 30) return '弱';
    if (score < 60) return '中等';
    if (score < 80) return '強';
    return '非常強';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors([]);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ 註冊成功！即將前往登入頁面');
        router.push('/login');
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors);
        } else {
          setError(data.message || '註冊失敗');
        }
      }
    } catch (err) {
      console.error('註冊錯誤:', err);
      setError('註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏦 HomeBank V2
          </h1>
          <p className="text-gray-600">創建新帳戶</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="您的姓名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入安全密碼"
              required
            />
            
            {/* 密碼強度指示器 */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">密碼強度</span>
                  <span className={`font-medium ${
                    passwordStrength.score < 30 ? 'text-red-600' :
                    passwordStrength.score < 60 ? 'text-yellow-600' :
                    passwordStrength.score < 80 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {getPasswordStrengthText(passwordStrength.score)} ({passwordStrength.score}/100)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  ></div>
                </div>
                {passwordStrength.errors.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="font-medium mb-1">密碼需要包含：</p>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordStrength.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'parent' | 'child' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="child">子女</option>
              <option value="parent">父母</option>
            </select>
          </div>

          {/* 顯示錯誤訊息 */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">請修正以下問題：</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || passwordStrength.score < 60}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '註冊中...' : '註冊'}
          </button>

          {passwordStrength.score < 60 && formData.password && (
            <p className="text-xs text-gray-500 text-center">
              密碼強度需要達到 60 分以上才能註冊
            </p>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            已有帳戶？{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
