'use client';

import { User } from '@/types/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthButtons from '@/components/AuthButtons';

interface HeaderProps {
  user?: User;
  onLogout?: () => void;
  onShowSignUp?: () => void;
  onShowLogin?: () => void;
}

export default function Header({ user, onLogout, onShowSignUp, onShowLogin }: HeaderProps) {
  return (
    <header className="flex items-end justify-between mb-6 gap-4">
      {/* 左側の空白スペース */}
      <div className="flex-shrink-0 w-40">
        {/* 空白領域 */}
      </div>
      
      {/* 中央のタイトル */}
      <div className="text-center flex-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 whitespace-nowrap">
          ステッカーカレンダー
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          習慣化をサポートする、シンプルなカレンダーアプリ
        </p>
      </div>
      
      {/* 右側のユーザーエリア */}
      <div className="flex justify-end flex-shrink-0 w-40">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-colors cursor-pointer">
                <span className="text-white font-medium text-lg">
                  {user.name.charAt(0)}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          onShowSignUp && onShowLogin && (
            <div className="flex gap-2">
              <button
                onClick={onShowSignUp}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
              >
                新規登録
              </button>
              <button
                onClick={onShowLogin}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors whitespace-nowrap"
              >
                ログイン
              </button>
            </div>
          )
        )}
      </div>
    </header>
  );
}