import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Spot } from "../types";
import { MapPin, Info, Car, Train, Clock, CircleDollarSign, Check, Plus, Minus, Layers } from "lucide-react";

interface InteractiveMapProps {
  spots: Spot[];
  selectedSpotIds: string[];
  onToggleSpot: (id: string) => void;
  transportMode: string;
  destination: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  spots,
  selectedSpotIds,
  onToggleSpot,
  transportMode,
  destination,
}) => {
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const categories = ["all", "観光", "食事", "温泉", "買い出し", "宿泊"];

  const filteredSpots = spots.filter(
    (spot) => selectedCategoryFilter === "all" || spot.category === selectedCategoryFilter
  );

  const selectedSpotsInOrder = spots.filter((spot) => selectedSpotIds.includes(spot.id));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 space-y-6" id="interactive-map-workspace">
      {/* 区分ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">🗺️</span>
            {destination ? `${destination} のおすすめ立ち寄りスポット` : "おすすめの立ち寄り地"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            移動手段（{transportMode === "car" ? "🚗 自家用車" : "🚃 公共交通機関"}）に最適な場所です。しおりに入れたい場所を選んでください。
          </p>
        </div>
        
        {spots.length > 0 && (
          <div className="flex items-center gap-1.5 self-start bg-slate-50 p-1 rounded-xl border border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-indigo-600 px-2">
              選択中: {selectedSpotIds.length} / {spots.length} 件
            </span>
          </div>
        )}
      </div>

      {spots.length === 0 ? (
        /* プレースホルダー（まだスポットが読み込まれていない状態） */
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-3xl shadow-sm mb-4"
          >
            📍
          </motion.div>
          <h4 className="text-sm font-bold text-slate-700">まずはおすすめ候補地を探しましょう！</h4>
          <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
            左側のフォームで目的地と条件を入力し、<br />
            <strong className="text-indigo-600 font-bold">「1. 立ち寄り候補地をマップに並べる」</strong> ボタンを押すと、AIがここに最適な観光スポットや食事処をマッピングします。
          </p>
          
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <span className="bg-white px-2.5 py-1 rounded-full border border-slate-200">🚗 ドライブ最適化</span>
            <span className="bg-white px-2.5 py-1 rounded-full border border-slate-200">🚃 路線アクセス考慮</span>
            <span className="bg-white px-2.5 py-1 rounded-full border border-slate-200">🏕️ キャンプ温泉連携</span>
          </div>
        </div>
      ) : (
        /* メインマップ & スポット選択ビュー */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左：ビジュアル簡易マップ (5/12) */}
          <div className="lg:col-span-5 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                簡易エリアマップ (相対座標表示)
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                インタラクティブ
              </span>
            </div>

            {/* カスタムマップキャンバス */}
            <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 shadow-inner overflow-hidden flex-1 min-h-[280px]">
              {/* マップ用グリッド線（SF/テック/モダン風） */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-[0.04]">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="border border-white"></div>
                ))}
              </div>
              
              {/* 背景の等高線・円形パルス（演出） */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-full border border-white/[0.02] pointer-events-none animate-pulse-slow"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5 h-2/5 rounded-full border border-white/[0.03] pointer-events-none"></div>

              {/* 移動手段インジケーター */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs border border-white/[0.1] rounded-lg text-[9px] text-slate-300 font-bold font-mono">
                {transportMode === "car" ? (
                  <>
                    <Car className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    DRIVE ROUTE ACTIVE
                  </>
                ) : (
                  <>
                    <Train className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    TRANSIT ROUTE ACTIVE
                  </>
                )}
              </div>

              {/* 主要拠点インジケーター（x=50, y=15近辺に玄関口となる駅・ICを自動でプロット） */}
              <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping absolute"></div>
                <div className="w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white relative"></div>
                <span className="text-[8px] text-white/70 font-bold bg-slate-950/90 px-1.5 py-0.5 rounded-md mt-1 scale-75 border border-white/10 whitespace-nowrap">
                  📍 エリア入口 (駅/IC)
                </span>
              </div>

              {/* 選択されたスポット同士をつなぐ経路線（SVG） */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {selectedSpotsInOrder.length > 1 && (
                  <g>
                    {/* ライン（点線） */}
                    <path
                      d={selectedSpotsInOrder
                        .map((spot, index) => `${index === 0 ? "M" : "L"} ${spot.x}% ${spot.y}%`)
                        .join(" ")}
                      fill="none"
                      stroke="url(#route-grad)"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      className="animate-dash"
                    />
                    
                    {/* ルートのグラデーション定義 */}
                    <defs>
                      <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#312e81" />
                      </linearGradient>
                    </defs>
                  </g>
                )}
              </svg>

              {/* スポットピンのレンダリング */}
              {filteredSpots.map((spot, index) => {
                const isSelected = selectedSpotIds.includes(spot.id);
                const isHovered = hoveredSpotId === spot.id;
                const spotIndex = selectedSpotsInOrder.findIndex((s) => s.id === spot.id);

                return (
                  <div
                    key={spot.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%`, zIndex: isHovered ? 40 : 20 }}
                    onMouseEnter={() => setHoveredSpotId(spot.id)}
                    onMouseLeave={() => setHoveredSpotId(null)}
                    onClick={() => onToggleSpot(spot.id)}
                  >
                    {/* ピンの外輪パルス */}
                    {isSelected && (
                      <span className="absolute -inset-2.5 bg-indigo-500/20 rounded-full animate-ping pointer-events-none"></span>
                    )}

                    {/* メインピンノード */}
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-white text-white"
                          : "bg-slate-800 border-slate-600 text-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected ? (
                        <span className="text-[10px] font-black">{spotIndex !== -1 ? spotIndex + 1 : "✓"}</span>
                      ) : (
                        <span className="text-[9px] font-bold">{index + 1}</span>
                      )}
                    </motion.div>

                    {/* スポット名ホバーラベル */}
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-[10px] font-bold text-white whitespace-nowrap transition-all duration-150 ${
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="px-1 py-0.2 bg-indigo-500/30 text-indigo-300 rounded text-[8px]">
                          {spot.category}
                        </span>
                        {spot.name}
                      </div>
                      <div className="text-[8px] text-slate-400 font-normal mt-0.5 max-w-[150px] truncate">
                        {spot.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 下部ヘルプ */}
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              💡 <strong>簡易マップの見方：</strong>
              ピンをクリックして選択すると、しおりにその場所が組み込まれます。選択順に経路（ルート点線）が描画され、最適な移動行程がAIに伝わります。
            </p>
          </div>

          {/* 右：スポットカード一覧 (7/12) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* カテゴリフィルター */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/50"
                  }`}
                >
                  {cat === "all" ? "すべて" : cat}
                </button>
              ))}
            </div>

            {/* スポットカードスクロール領域 */}
            <div className="space-y-2.5 overflow-y-auto pr-1 max-h-[420px] scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {filteredSpots.map((spot, index) => {
                  const isSelected = selectedSpotIds.includes(spot.id);
                  const isHovered = hoveredSpotId === spot.id;
                  const selectedIndex = selectedSpotsInOrder.findIndex((s) => s.id === spot.id);

                  return (
                    <motion.div
                      key={spot.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/15 shadow-sm"
                          : "border-slate-150 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                      onMouseEnter={() => setHoveredSpotId(spot.id)}
                      onMouseLeave={() => setHoveredSpotId(null)}
                      onClick={() => onToggleSpot(spot.id)}
                    >
                      {/* 選択時のインディケータ左帯 */}
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-600"></div>
                      )}

                      <div className="flex gap-3">
                        {/* 選択トグル部 */}
                        <div className="flex flex-col items-center justify-start pt-1">
                          <div
                            className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-slate-50 group-hover:border-slate-400"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                            )}
                          </div>
                          {isSelected && selectedIndex !== -1 && (
                            <span className="text-[9px] font-black text-indigo-600 mt-1.5 bg-indigo-100/60 px-1.5 py-0.2 rounded-md">
                              {selectedIndex + 1}番
                            </span>
                          )}
                        </div>

                        {/* スポット情報 */}
                        <div className="flex-1 space-y-2">
                          {/* タイトルとカテゴリ */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                              {spot.name}
                            </h4>
                            
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">
                                #{index + 1}
                              </span>
                              <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md">
                                {spot.category}
                              </span>
                            </div>
                          </div>

                          {/* 説明文 */}
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {spot.description}
                          </p>

                          {/* 費用・時間情報 */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-semibold pt-1">
                            <span className="flex items-center gap-1 text-indigo-600">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              滞在目安: {spot.recommendedDuration}
                            </span>
                            {spot.estimatedCost > 0 ? (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                目安費用: {spot.estimatedCost.toLocaleString()}円
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                目安費用: 無料
                              </span>
                            )}
                          </div>

                          {/* 移動手段最適理由 */}
                          {spot.reason && (
                            <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl text-[10.5px] leading-relaxed text-slate-600 flex gap-2">
                              <span className="text-xs self-start">💡</span>
                              <div>
                                <strong className="text-slate-700 font-bold block text-[10px] mb-0.5">
                                  {transportMode === "car" ? "🚗 マイカー快適度UP理由" : "🚃 公共交通でのアクセス"}
                                </strong>
                                {spot.reason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
