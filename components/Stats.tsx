interface StatsProps {
  totalStickers: number;
  daysWithStickers: number;
  daysInMonth: number;
  percentage: number;
}

export default function Stats({ totalStickers, daysWithStickers, daysInMonth, percentage }: StatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
        今月の記録
      </h3>
      
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xl font-bold text-orange-600">
            {totalStickers}
          </div>
          <div className="text-xs text-gray-600">
            総ステッカー
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xl font-bold text-blue-600">
            {daysWithStickers}
          </div>
          <div className="text-xs text-gray-600">
            実行日数
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xl font-bold text-green-600">
            {percentage}%
          </div>
          <div className="text-xs text-gray-600">
            達成率
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xl font-bold text-purple-600">
            {daysInMonth}
          </div>
          <div className="text-xs text-gray-600">
            総日数
          </div>
        </div>
      </div>
      
      {percentage >= 80 && (
        <div className="mt-4 text-center">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-full text-sm font-medium">
            🎉 素晴らしい継続力です！
          </div>
        </div>
      )}
      
      {percentage >= 50 && percentage < 80 && (
        <div className="mt-4 text-center">
          <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
            👍 順調に続けています！
          </div>
        </div>
      )}
      
      {totalStickers > 0 && percentage < 50 && (
        <div className="mt-4 text-center">
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
            💪 コツコツ頑張りましょう！
          </div>
        </div>
      )}
    </div>
  );
}