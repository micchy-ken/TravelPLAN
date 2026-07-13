import React, { useState } from "react";
import { 
  Train, Compass, Utensils, Home, ShoppingBag, Clock, 
  MapPin, AlertCircle, Sparkles, CheckCircle2, ChevronRight, HelpCircle
} from "lucide-react";
import { TravelPlan, TimelineItem } from "../types";

interface TimelineViewProps {
  plan: TravelPlan;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ plan }) => {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "移動":
        return <Train className="w-5 h-5 text-sky-600" />;
      case "観光":
        return <Compass className="w-5 h-5 text-indigo-600" />;
      case "食事":
        return <Utensils className="w-5 h-5 text-amber-600" />;
      case "宿泊":
        return <Home className="w-5 h-5 text-rose-600" />;
      case "温泉":
        return <span className="text-lg">♨️</span>; // High contrast emoji works great for hot spring
      case "買い出し":
        return <ShoppingBag className="w-5 h-5 text-indigo-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  // Category Styling helper
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "移動":
        return "bg-sky-50 text-sky-800 border-sky-100";
      case "観光":
        return "bg-indigo-50 text-indigo-800 border-indigo-100";
      case "食事":
        return "bg-amber-50 text-amber-800 border-amber-100";
      case "宿泊":
        return "bg-rose-50 text-rose-800 border-rose-100";
      case "温泉":
        return "bg-cyan-50 text-cyan-800 border-cyan-100";
      case "買い出し":
        return "bg-emerald-50 text-emerald-800 border-emerald-100";
      default:
        return "bg-slate-50 text-slate-800 border-slate-100";
    }
  };

  // Toggle item completion
  const toggleItemComplete = (activityId: string) => {
    if (completedItems.includes(activityId)) {
      setCompletedItems(completedItems.filter(id => id !== activityId));
    } else {
      setCompletedItems([...completedItems, activityId]);
    }
  };

  const currentDayPlan = plan.days.find((d) => d.dayNumber === activeDay) || plan.days[0];

  // Calculate stats
  const totalCost = plan.days.reduce((sum, day) => {
    return sum + day.items.reduce((daySum, item) => daySum + (item.cost || 0), 0);
  }, 0);

  const totalItemsCount = plan.days.reduce((sum, day) => sum + day.items.length, 0);

  return (
    <div className="space-y-6">
      {/* 旅行概要ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4 scale-150">
          <Sparkles className="w-96 h-96" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
              📍 {plan.destination}
            </span>
            <span className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
              📅 {plan.daysCount}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black leading-tight tracking-tight">
            {plan.title}
          </h2>
          <p className="text-sm text-indigo-100 leading-relaxed font-medium">
            {plan.overview}
          </p>
        </div>
      </div>

      {/* 統計概要 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-center shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">想定される総費用 (目安)</span>
          <span className="text-lg md:text-xl font-black text-slate-800 mt-1">
            ¥{totalCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ 人</span>
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-center shadow-xs">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">立ち寄り・スポット総数</span>
          <span className="text-lg md:text-xl font-black text-indigo-600 mt-1">
            {totalItemsCount} 箇所
          </span>
        </div>
      </div>

      {/* 日程切り替えタブ */}
      {plan.days.length > 1 && (
        <div className="flex border-b border-slate-200 gap-2 p-1 bg-slate-100/50 rounded-xl">
          {plan.days.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeDay === day.dayNumber
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {day.dateLabel} ({day.items.length}件)
            </button>
          ))}
        </div>
      )}

      {/* タイムライン */}
      <div className="relative border-l-2 border-slate-100 pl-6 ml-4 py-2 space-y-8">
        {currentDayPlan.items.map((item, index) => {
          const itemId = `${activeDay}-${index}-${item.activity}`;
          const isCompleted = completedItems.includes(itemId);

          return (
            <div key={itemId} className="relative group">
              {/* タイムラインの丸・アイコン */}
              <div 
                className={`absolute -left-[45px] top-1.5 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white shadow-xs transition-all duration-200 ${
                  isCompleted 
                    ? "border-indigo-500 bg-indigo-50" 
                    : "border-slate-200 group-hover:border-slate-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                ) : (
                  getCategoryIcon(item.category)
                )}
              </div>

              {/* タイムライン項目カード */}
              <div 
                className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
                  isCompleted 
                    ? "border-indigo-100 bg-indigo-50/10 opacity-75" 
                    : "border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    {/* チェックボックス */}
                    <input 
                      type="checkbox" 
                      id={`check-${itemId}`}
                      checked={isCompleted}
                      onChange={() => toggleItemComplete(itemId)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    {/* 時間 */}
                    <span className="font-mono font-bold text-slate-800 text-base">
                      {item.time}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({item.duration})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* カテゴリーバッジ */}
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-bold ${getCategoryStyles(item.category)}`}>
                      {item.category}
                    </span>
                    {/* 費用目安 */}
                    {item.cost > 0 && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold border border-slate-200/60">
                        ¥{item.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label 
                    htmlFor={`check-${itemId}`}
                    className={`block font-black text-slate-800 text-base cursor-pointer ${
                      isCompleted ? "line-through text-slate-400" : ""
                    }`}
                  >
                    {item.activity}
                  </label>

                  {item.location && (
                    <div className="flex items-center text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/40 p-3 rounded-lg border border-slate-100/50">
                    {item.memo}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg flex items-start border border-slate-100">
        <AlertCircle className="w-4 h-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          プラン内の時刻や費用は目安です。現地の交通状況やお店の定休日、営業時間などを事前に確認して、安全で楽しい旅行をお楽しみください。
        </p>
      </div>
    </div>
  );
};
