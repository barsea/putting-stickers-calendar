'use client';

import { User } from '@/types/auth';

interface UserInfoProps {
  user: User;
  onLogout: () => void;
}

export default function UserInfo({ user, onLogout }: UserInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {user.name.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              ようこそ、{user.name}さん
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}