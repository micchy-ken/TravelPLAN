import React, { useState } from "react";
import { 
  Train, Compass, Utensils, Home, ShoppingBag, Clock, 
  MapPin, AlertCircle, Sparkles, CheckCircle2, ChevronRight, HelpCircle,
  ArrowUp, ArrowDown, Trash2, RefreshCw, GripVertical
} from "lucide-react";
import { TravelPlan, TimelineItem, Spot } from "../types";
import { LeafletMap } from "./LeafletMap";

interface TimelineViewProps {
  plan: TravelPlan;
  onUpdatePlan: (updatedPlan: TravelPlan) => void;
  onRecalculatePlan: (customSpots: Spot[]) => void;
  recalculating?: boolean;
  isPlanChanged: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  plan, 
  onUpdatePlan, 
  onRecalculatePlan, 
  recalculating = false,
  isPlanChanged
}) => {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, targetIndex: number) => {
    if (draggingIndex === null) return;
    setDragOverIndex(targetIndex);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    const dayIndex = plan.days.findIndex(d => d.dayNumber === activeDay);
    if (dayIndex === -1) return;

    const newPlan = JSON.parse(JSON.stringify(plan)) as TravelPlan;
    const items = newPlan.days[dayIndex].items;

    // Reorder items
    const [draggedItem] = items.splice(draggingIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    onUpdatePlan(newPlan);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const currentDayPlan = plan.days.find((d) => d.dayNumber === activeDay) || plan.days[0];

  // Reorder itinerary items
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const dayIndex = plan.days.findIndex(d => d.dayNumber === activeDay);
    if (dayIndex === -1) return;

    const newPlan = JSON.parse(JSON.stringify(plan)) as TravelPlan;
    const items = newPlan.days[dayIndex].items;
    
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }

    onUpdatePlan(newPlan);
  };

  // Delete itinerary item
  const deleteItem = (index: number) => {
    const dayIndex = plan.days.findIndex(d => d.dayNumber === activeDay);
    if (dayIndex === -1) return;

    const newPlan = JSON.parse(JSON.stringify(plan)) as TravelPlan;
    newPlan.days[dayIndex].items.splice(index, 1);
    
    onUpdatePlan(newPlan);
  };

  // Trigger AI schedule recalculation based on modified spots list
  const handleTriggerRecalculate = () => {
    // Generate Spot-compatible structures from the customized timeline items
    const customSpots: Spot[] = plan.days.flatMap((day) =>
      day.items
        .map((item, idx) => ({
          id: `custom-spot-${day.dayNumber}-${idx}`,
          name: item.activity,
          category: item.category,
          description: item.memo || item.location,
          recommendedDuration: item.duration || "60分",
          estimatedCost: item.cost || 0,
          x: item.x || 50,
          y: item.y || 50,
          lat: item.lat || 35.6812, // fallback
          lng: item.lng || 139.7671, // fallback
          reason: `${day.dayNumber}日目のカスタマイズ立ち寄り項目です。`
        }))
    );
    onRecalculatePlan(customSpots);
  };

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

      {/* 目的地までの具体的な地図表示 (Leaflet.js) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs" id="shiori-route-map">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">🗺️</span>
            {currentDayPlan.dateLabel} の移動ルートマップ
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100/40">
            Leaflet.js 連携
          </span>
        </div>

        <LeafletMap 
          items={currentDayPlan.items}
          activeId={hoveredItemId}
          height="350px"
        />

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-bold px-1 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full inline-block shadow-sm"></span>
            S: 出発・起点
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-indigo-600 border border-white rounded-full inline-block shadow-sm"></span>
            数字: 経由スポット
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-600 border border-white rounded-full inline-block shadow-sm"></span>
            G: 終着・帰着
          </span>
        </div>
      </div>

      {/* 行程再編成・AI再計算コールアウト */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${recalculating ? 'animate-spin' : ''}`} />
            行程を変更しましたか？
          </h4>
          <p className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
            スポットを「並び替え」たり「削除」した後は、再計算ボタンを押してください。<br />
            AIが移動時間やタイムスケジュールを自動最適化し、綺麗なタイムラインに再編成します。
          </p>
        </div>
        <button
          type="button"
          disabled={recalculating || !isPlanChanged || currentDayPlan.items.length === 0}
          onClick={handleTriggerRecalculate}
          className={`self-start md:self-center px-4 py-2 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            recalculating || !isPlanChanged || currentDayPlan.items.length === 0
              ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed border border-slate-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {recalculating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              AI再調整中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              スケジュールを再計算
            </>
          )}
        </button>
      </div>

      {/* タイムライン */}
      <div className="relative border-l-2 border-slate-100 pl-6 ml-4 py-2 space-y-8">
        {currentDayPlan.items.map((item, index) => {
          const itemId = `${activeDay}-${index}-${item.activity}`;
          const isCompleted = completedItems.includes(itemId);
          const mapId = `${item.time}-${item.activity}`;
          const isDraggingCurrent = draggingIndex === index;
          const isDragTarget = dragOverIndex === index && draggingIndex !== index;

          return (
            <div 
              key={itemId} 
              className="relative group animate-fade-in"
              onMouseEnter={() => setHoveredItemId(mapId)}
              onMouseLeave={() => setHoveredItemId(null)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* タイムラインの丸・アイコン */}
              <div 
                className={`absolute -left-[45px] top-1.5 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white shadow-xs transition-all duration-200 ${
                  isDraggingCurrent
                    ? "border-slate-200 opacity-45"
                    : isCompleted 
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
                  isDraggingCurrent
                    ? "border-dashed border-indigo-300 opacity-40 scale-[0.98] shadow-inner bg-slate-50"
                    : isDragTarget
                    ? "border-indigo-500 bg-indigo-50/40 scale-[1.01] shadow-md ring-2 ring-indigo-200"
                    : isCompleted 
                    ? "border-indigo-100 bg-indigo-50/10 opacity-75" 
                    : "border-slate-200/80 hover:border-indigo-200/60 shadow-xs hover:shadow-sm"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5" onDragStart={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    {/* ドラッグハンドル */}
                    <div 
                      className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 rounded transition-colors"
                      title="ドラッグして並び替え"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    {/* チェックボックス */}
                    <input 
                      type="checkbox" 
                      id={`check-${itemId}`}
                      checked={isCompleted}
                      onChange={() => toggleItemComplete(itemId)}
                      onDragStart={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    {/* 時間 */}
                    <span className="font-mono font-bold text-slate-800 text-base">
                      {item.time}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      ({item.duration})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5" onDragStart={(e) => e.stopPropagation()}>
                    {/* 行程並び替え・削除ボタン群 */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 mr-1 opacity-60 group-hover:opacity-100 transition-all duration-150">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'up');
                        }}
                        disabled={index === 0}
                        title="上へ移動"
                        onDragStart={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, 'down');
                        }}
                        disabled={index === currentDayPlan.items.length - 1}
                        title="下へ移動"
                        onDragStart={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(index);
                        }}
                        title="削除"
                        onDragStart={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

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

                <div className="space-y-2" onDragStart={(e) => e.stopPropagation()}>
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
        <p className="leading-relaxed font-semibold">
          プラン内の時刻や費用は目安です。現地の交通状況やお店の定休日、営業時間などを事前に確認して、安全で楽しい旅行をお楽しみください。
        </p>
      </div>
    </div>
  );
};
