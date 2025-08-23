'use client';

interface AuthButtonsProps {
  onShowSignUp: () => void;
  onShowLogin: () => void;
}

export default function AuthButtons({ onShowSignUp, onShowLogin }: AuthButtonsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          アカウントでデータを保存しませんか？
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          ログインするとデータが保存され、他のデバイスからもアクセスできます
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onShowSignUp}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            新規登録
          </button>
          <button
            onClick={onShowLogin}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}