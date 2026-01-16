import Link from 'next/link';
import { Coins, Users, Gift, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🏦 HomeBank V2
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            讓孩子學習理財的家庭銀行系統
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              登入
            </Link>
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              註冊
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={<Coins className="w-12 h-12 text-blue-600" />}
            title="點數系統"
            description="完成工作賺取點數，培養責任感"
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-green-600" />}
            title="多角色管理"
            description="父母和子女不同權限，安全可靠"
          />
          <FeatureCard
            icon={<Gift className="w-12 h-12 text-purple-600" />}
            title="獎勵商店"
            description="用點數兌換獎勵，學習儲蓄"
          />
          <FeatureCard
            icon={<TrendingUp className="w-12 h-12 text-orange-600" />}
            title="進度追蹤"
            description="完整的歷史記錄和統計分析"
          />
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            為什麼選擇 HomeBank V2？
          </h2>
          <div className="space-y-4 text-gray-700">
            <p className="text-lg">
              ✅ <strong>培養責任感</strong>：透過完成家務工作賺取點數
            </p>
            <p className="text-lg">
              ✅ <strong>學習理財</strong>：了解儲蓄和消費的概念
            </p>
            <p className="text-lg">
              ✅ <strong>家庭互動</strong>：增進親子溝通和合作
            </p>
            <p className="text-lg">
              ✅ <strong>簡單易用</strong>：直覺的介面，全家都能輕鬆使用
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p>© 2025 HomeBank V2. Built with Next.js + TypeScript</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
