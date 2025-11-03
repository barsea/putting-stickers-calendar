interface StatsProps {
  totalStickers: number;
  daysWithStickers: number;
  daysInMonth: number;
  percentage: number;
  year: number;
  month: number;
}

export default function Stats({ totalStickers, daysWithStickers, daysInMonth, percentage, year, month }: StatsProps) {
  // 現在月かどうかをチェック
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  // 月名の配列
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <section className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mt-4" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="text-lg font-semibold text-gray-800 mb-3 text-center">
        {isCurrentMonth ? '今月' : `${year}年${monthNames[month - 1]}`}の記録
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center" role="list">
        <div className="bg-orange-50 rounded-lg p-2 sm:p-3" role="listitem">
          <div className="text-lg sm:text-xl font-bold text-orange-600" aria-label={`総ステッカー数 ${totalStickers}個`}>
            {totalStickers}
          </div>
          <div className="text-xs text-gray-600">
            総ステッカー
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-2 sm:p-3" role="listitem">
          <div className="text-lg sm:text-xl font-bold text-blue-600" aria-label={`実行日数 ${daysWithStickers}日`}>
            {daysWithStickers}
          </div>
          <div className="text-xs text-gray-600">
            実行日数
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-2 sm:p-3" role="listitem">
          <div className="text-lg sm:text-xl font-bold text-green-700" aria-label={`達成率 ${percentage}パーセント`}>
            {percentage}%
          </div>
          <div className="text-xs text-gray-600">
            達成率
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-2 sm:p-3" role="listitem">
          <div className="text-lg sm:text-xl font-bold text-purple-600" aria-label={`総日数 ${daysInMonth}日`}>
            {daysInMonth}
          </div>
          <div className="text-xs text-gray-600">
            総日数
          </div>
        </div>
      </div>
      
      {percentage === 100 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-900 px-3 py-2 rounded-full text-sm font-medium border-2 border-yellow-300">
            ✨🏆 PERFECT! 完璧な達成です！ 🏆✨
          </div>
        </div>
      )}
      
      {percentage !== 100 && totalStickers >= 100 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-full text-sm font-medium">
            🏆 驚異的なステッカー数です！
          </div>
        </div>
      )}

      {totalStickers >= 80 && totalStickers < 100 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-full text-sm font-medium">
            🎉 素晴らしい記録です！
          </div>
        </div>
      )}

      {totalStickers >= 60 && totalStickers < 80 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm font-medium">
            ✨ 習慣が定着してきました！
          </div>
        </div>
      )}

      {totalStickers >= 40 && totalStickers < 60 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
            👍 順調に続けています！
          </div>
        </div>
      )}

      {totalStickers >= 20 && totalStickers < 40 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
            🌱 良いスタートです！
          </div>
        </div>
      )}

      {totalStickers >= 1 && totalStickers < 20 && (
        <div className="mt-4 text-center" role="status" aria-live="polite">
          <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-full text-sm font-medium">
            💪 コツコツ頑張りましょう！
          </div>
        </div>
      )}
    </section>
  );
}