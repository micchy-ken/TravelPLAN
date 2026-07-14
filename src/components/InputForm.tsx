import React from "react";
import { MapPin, Calendar, Clock, Compass, Heart, Sparkles, Tent, Award, Map as MapIcon } from "lucide-react";

interface InputFormProps {
  destination: string;
  setDestination: (val: string) => void;
  days: string;
  setDays: (val: string) => void;
  departureTime: string;
  setDepartureTime: (val: string) => void;
  style: string;
  setStyle: (val: string) => void;
  policy: string;
  setPolicy: (val: string) => void;
  travelType: string;
  setTravelType: (val: string) => void;
  transportMode: string;
  setTransportMode: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
  onSuggestSpots: () => void;
  spotsLoading: boolean;
  hasSuggestedSpots: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  destination,
  setDestination,
  days,
  setDays,
  departureTime,
  setDepartureTime,
  style,
  setStyle,
  policy,
  setPolicy,
  travelType,
  setTravelType,
  transportMode,
  setTransportMode,
  onSubmit,
  loading,
  onSuggestSpots,
  spotsLoading,
  hasSuggestedSpots,
}) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" id="travel-planner-form">
      {/* 目的地 */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-slate-700" htmlFor="destination-input">
          <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
          目的地
        </label>
        <div className="relative">
          <input
            id="destination-input"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="例: 伊豆、京都、北海道、那須"
            className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            required
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (destination && !loading && !spotsLoading) {
                  onSuggestSpots();
                }
              }
            }}
          />
          <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 日程 */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-slate-700" htmlFor="days-select">
            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
            日程
          </label>
          <div className="relative">
            <select
              id="days-select"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              disabled={loading}
            >
              <option value="日帰り">日帰り</option>
              <option value="1泊2日">1泊2日</option>
              <option value="2泊3日">2泊3日</option>
              <option value="3泊4日">3泊4日</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>

        {/* 出発時刻 */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-slate-700" htmlFor="departure-time">
            <Clock className="w-4 h-4 mr-2 text-indigo-600" />
            出発希望時刻
          </label>
          <input
            id="departure-time"
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm"
            disabled={loading || spotsLoading}
            required
          />
        </div>
      </div>

      {/* 移動手段の選択 */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-slate-700">
          <Compass className="w-4 h-4 mr-2 text-indigo-600" />
          移動手段
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            key="transit-car"
            type="button"
            onClick={() => setTransportMode("car")}
            className={`py-3 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              transportMode === "car"
                ? "border-indigo-600 bg-indigo-50/60 text-indigo-800 font-bold shadow-xs"
                : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
            }`}
            disabled={loading || spotsLoading}
          >
            <span className="text-base">🚗 自家用車・レンタカー</span>
            <span className="text-[9px] font-normal text-slate-500">駐車場やドライブ重視</span>
          </button>
          <button
            key="transit-public"
            type="button"
            onClick={() => setTransportMode("public")}
            className={`py-3 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              transportMode === "public"
                ? "border-indigo-600 bg-indigo-50/60 text-indigo-800 font-bold shadow-xs"
                : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
            }`}
            disabled={loading || spotsLoading}
          >
            <span className="text-base">🚃 公共交通機関</span>
            <span className="text-[9px] font-normal text-slate-500">駅近・バスルートを考慮</span>
          </button>
        </div>
      </div>

      {/* 旅行スタイル */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-slate-700">
          <Heart className="w-4 h-4 mr-2 text-indigo-600" />
          旅行スタイル
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "一人旅", label: "一人旅" },
            { id: "カップル", label: "カップル" },
            { id: "家族旅行", label: "家族旅行 (子供連れ)" },
            { id: "友人グループ", label: "友人グループ" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStyle(item.id)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                style === item.id
                  ? "border-indigo-600 bg-indigo-50/60 text-indigo-800 font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
              }`}
              disabled={loading || spotsLoading}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 旅行の種類 */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-slate-700">
          <Tent className="w-4 h-4 mr-2 text-indigo-600" />
          旅行の種類
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "観光", label: "観光旅行" },
            { id: "キャンプ", label: "キャンプ・アウトドア" },
            { id: "温泉宿", label: "温泉旅館ステイ" },
            { id: "体験・アクティビティ", label: "体験・アクティビティ" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTravelType(item.id)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                travelType === item.id
                  ? "border-indigo-600 bg-indigo-50/60 text-indigo-800 font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
              }`}
              disabled={loading || spotsLoading}
            >
              {item.label}
            </button>
          ))}
        </div>
        {travelType === "キャンプ" && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100 mt-1 leading-relaxed">
            💡 <strong>キャンプ優先設定：</strong>
            周辺の清潔なトイレ（ウォシュレット付き等）、買い出し用の地元スーパー、近くの良質な温泉施設を優先的にスケジュールへ盛り込みます。
          </p>
        )}
      </div>

      {/* しおり方針・こだわり */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-slate-700">
          <Compass className="w-4 h-4 mr-2 text-indigo-600" />
          しおり方針・こだわり
        </label>
        <div className="space-y-2">
          {[
            { id: "観光重視", label: "観光重視（定番スポットを欲張りに巡る）" },
            { id: "グルメ＆食べ歩き", label: "グルメ＆食べ歩き（ご当地グルメ・カフェ巡り）" },
            { id: "ゆっくり温泉・癒やし", label: "ゆっくり温泉・癒やし（無理のない大人の旅程）" },
            { id: "アクティビティ・自然", label: "アクティビティ・自然（アウトドア体験満載）" },
            { id: "穴場巡り・ディープ", label: "穴場巡り・ディープ（ローカルに愛される隠れた名店）" },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setPolicy(item.id)}
              className={`flex items-center p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${
                policy === item.id
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-800 font-bold"
                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center transition-all ${
                  policy === item.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
                }`}
              >
                {policy === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* 2ステップ・コントロール */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        {/* ボタン1: おすすめスポット提案 */}
        <button
          type="button"
          onClick={onSuggestSpots}
          disabled={loading || spotsLoading || !destination}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center transition-all duration-200 cursor-pointer ${
            spotsLoading
              ? "bg-indigo-100 border border-indigo-200 text-indigo-500 cursor-wait"
              : loading || !destination
              ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 active:scale-[0.99]"
          }`}
        >
          {spotsLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              立ち寄りスポットを検索中...
            </>
          ) : (
            <>
              <MapIcon className="w-4 h-4 mr-2 text-indigo-500" />
              1. 立ち寄り候補地をマップに並べる
            </>
          )}
        </button>

        {/* ボタン2: 行程表の作成 */}
        <button
          type="submit"
          disabled={loading || spotsLoading || !destination}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            loading || spotsLoading || !destination
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : hasSuggestedSpots
              ? "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] hover:shadow-indigo-100 animate-pulse-subtle"
              : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] hover:shadow-indigo-100"
          }`}
          id="generate-plan-button"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>AIが最高のしおりを作成中...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center text-sm font-bold">
                <Sparkles className="w-4.5 h-4.5 mr-2 text-yellow-300" />
                2. 行程表（しおり）を作成する
              </div>
              {hasSuggestedSpots ? (
                <span className="text-[10px] font-medium text-indigo-100 mt-0.5">
                  ★ 選択したスポットを考慮してルートを最適化！
                </span>
              ) : (
                <span className="text-[10px] font-medium text-indigo-100 mt-0.5">
                  スポットの指定なしで直接自動生成することも可能です
                </span>
              )}
            </>
          )}
        </button>
      </div>

    </form>
  );
};
