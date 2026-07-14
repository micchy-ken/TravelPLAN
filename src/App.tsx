import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Compass, Database, Globe, Map, TreePine, 
  Flame, Heart, Calendar, Clock, RefreshCw, AlertCircle, Key, MapPin
} from "lucide-react";
import { InputForm } from "./components/InputForm";
import { TimelineView } from "./components/TimelineView";
import { NotionIntegration } from "./components/NotionIntegration";
import { TravelPlan, Spot } from "./types";
import { generatePlanClient, suggestSpotsClient } from "./utils/geminiClient";
import { InteractiveMap } from "./components/InteractiveMap";

export default function App() {
  // Input states
  const [destination, setDestination] = useState("");
  const [startLocation, setStartLocation] = useState("東京駅");
  const [days, setDays] = useState("1泊2日");
  const [departureTime, setDepartureTime] = useState("08:00");
  const [style, setStyle] = useState("カップル");
  const [policy, setPolicy] = useState("ゆっくり温泉・癒やし");
  const [travelType, setTravelType] = useState("観光");

  // Transportation and spot customization states
  const [transportMode, setTransportMode] = useState("car");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(false);

  // Output/Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "notion">("timeline");

  // Client-side API settings (for GitHub Pages fallback)
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("user_gemini_api_key") || "";
  });
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Quick select items for excellent UX
  const quickSearches = [
    { destination: "伊豆高原", days: "1泊2日", travelType: "温泉宿", policy: "ゆっくり温泉・癒やし", style: "カップル", title: "♨️ 伊豆・温泉のんびり旅" },
    { destination: "富士山麓", days: "1泊2日", travelType: "キャンプ", policy: "ゆっくり温泉・癒やし", style: "友人グループ", title: "⛺ 富士・絶景キャンプ＆温泉" },
    { destination: "京都・嵐山", days: "2泊3日", travelType: "観光", policy: "グルメ＆食べ歩き", style: "一人旅", title: "🍁 京都・食べ歩き散策" },
  ];

  const handleQuickSelect = (item: typeof quickSearches[0]) => {
    setDestination(item.destination);
    setDays(item.days);
    setTravelType(item.travelType);
    setPolicy(item.policy);
    setStyle(item.style);
    // When changing destination, clear previously loaded spots for fresh search
    setSpots([]);
    setSelectedSpotIds([]);
  };

  const handleSuggestSpots = async () => {
    if (!destination) {
      setError("目的地を入力してください。");
      return;
    }
    setSpotsLoading(true);
    setError(null);
    try {
      const isGitHubPages = window.location.hostname.endsWith("github.io");
      let success = false;
      let generatedSpots: Spot[] = [];

      // 1. Try backend server first, unless explicitly hosted on static GitHub Pages
      if (!isGitHubPages) {
        try {
          const response = await fetch("/api/spots", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              destination,
              travelType,
              transportMode,
              style,
              policy,
              startLocation,
            }),
          });

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error("HTML response received (404 page).");
          }

          const data = await response.json();
          if (response.ok && data.success) {
            generatedSpots = data.spots;
            success = true;
          } else {
            throw new Error(data.error || "おすすめスポットの検索中に予期しないエラーが発生しました。");
          }
        } catch (serverErr) {
          console.warn("Backend spots API request failed. Falling back to client-side direct generation...", serverErr);
        }
      }

      // 2. Fall back to direct browser generation if server fails or on static pages
      if (!success) {
        let activeKey = apiKey.trim();
        
        // Fall back to Vite-injected build-time key from GitHub Secrets
        const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!activeKey && viteKey && viteKey !== "MY_GEMINI_API_KEY" && viteKey.trim() !== "") {
          activeKey = viteKey.trim();
        }

        if (!activeKey) {
          setShowApiSettings(true); // Open settings panel automatically so user can paste a key
          throw new Error(
            "GitHub Pagesなどの静的環境では、おすすめスポット取得にGemini APIキーの直接指定が必要です。左下の「APIキー設定」からご自身のGemini APIキーを入力して保存してください（キーはブラウザに安全に保存されます）。"
          );
        }

        generatedSpots = await suggestSpotsClient(
          {
            destination,
            travelType,
            transportMode,
            style,
            policy,
            startLocation,
          },
          activeKey
        );
      }

      if (generatedSpots && generatedSpots.length > 0) {
        setSpots(generatedSpots);
        // Pre-select all suggested spots by default for complete planning comfort
        setSelectedSpotIds(generatedSpots.map((s) => s.id));
      } else {
        throw new Error("おすすめスポットの提案結果が空でした。");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "立ち寄りスポットの検索に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setSpotsLoading(false);
    }
  };

  const handleToggleSpot = (id: string) => {
    setSelectedSpotIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const isGitHubPages = window.location.hostname.endsWith("github.io");
      let success = false;
      let generatedPlan: TravelPlan | null = null;
      const selectedSpots = spots.filter((spot) => selectedSpotIds.includes(spot.id));

      // 1. Try backend server first, unless explicitly hosted on static GitHub Pages
      if (!isGitHubPages) {
        try {
          const response = await fetch("/api/plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              destination,
              days,
              departureTime,
              style,
              policy,
              travelType,
              transportMode,
              selectedSpots,
              startLocation,
            }),
          });

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error("HTML response received (404 page).");
          }

          const data = await response.json();
          if (response.ok && data.success) {
            generatedPlan = data.plan;
            success = true;
          } else {
            throw new Error(data.error || "しおりの生成中に予期しないエラーが発生しました。");
          }
        } catch (serverErr) {
          console.warn("Backend API request failed. Falling back to browser direct generation...", serverErr);
        }
      }

      // 2. Fall back to direct browser generation if server fails or on static pages
      if (!success) {
        let activeKey = apiKey.trim();
        
        // Fall back to Vite-injected build-time key from GitHub Secrets
        const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!activeKey && viteKey && viteKey !== "MY_GEMINI_API_KEY" && viteKey.trim() !== "") {
          activeKey = viteKey.trim();
        }

        if (!activeKey) {
          setShowApiSettings(true); // Open settings panel automatically so user can paste a key
          throw new Error(
            "GitHub Pagesなどの静的環境では、AIプラン生成にGemini APIキーの直接指定が必要です。左下の「APIキー設定」からご自身のGemini APIキーを入力して保存してください（キーはブラウザに安全に保存され、直接Google APIのみと通信します）。"
          );
        }

        generatedPlan = await generatePlanClient(
          {
            destination,
            days,
            departureTime,
            style,
            policy,
            travelType,
            transportMode,
            selectedSpots,
            startLocation,
          },
          activeKey
        );
      }

      if (generatedPlan) {
        setPlan(generatedPlan);
        setActiveTab("timeline"); // Automatically show timeline
      } else {
        throw new Error("プランの生成結果が空でした。");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "サーバーとの通信に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 共通ナビゲーションヘッダー */}
      <header className="bg-white/95 border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 flex items-center">
                旅のしおりプランナー
                <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold border border-indigo-100/60">
                  AI & Notion Ready
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold hidden sm:block">
                旅行プラン自動生成 & Notionデータベース流し込みシステム
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Notion Sync Connected
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 左カラム：入力条件フォーム (幅5/12) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs sticky top-24">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-bold text-slate-900 text-base flex items-center">
                <Map className="w-5 h-5 mr-2 text-indigo-600" />
                旅行のこだわり設定
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">
                目的地、日程、重視するこだわりを入力してください。AIが最適な旅のしおりをお作りします。
              </p>
            </div>

            <InputForm
              destination={destination}
              setDestination={setDestination}
              days={days}
              setDays={setDays}
              departureTime={departureTime}
              setDepartureTime={setDepartureTime}
              style={style}
              setStyle={setStyle}
              policy={policy}
              setPolicy={setPolicy}
              travelType={travelType}
              setTravelType={setTravelType}
              transportMode={transportMode}
              setTransportMode={setTransportMode}
              onSubmit={handleGeneratePlan}
              loading={loading}
              onSuggestSpots={handleSuggestSpots}
              spotsLoading={spotsLoading}
              hasSuggestedSpots={spots.length > 0}
            />

            {/* スタート地点・出発地設定（元APIキー入力箇所をフルアップグレード） */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50 border border-indigo-100/50 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">🚀</span>
                  <span>ルート起点（出発地・スタート地点）</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  しおり作成時、この場所をルートの最初の起点（スタート地点）として全体のタイムスケジュールを組み立てます。
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="例: 東京駅、自宅、新宿駅"
                    className="w-full px-3 py-2.5 pl-9 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-indigo-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 右カラム：プランプレビュー & Notion (幅7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* エラー表示 */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-850"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">プランの作成に問題が発生しました</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{error}</p>
                </div>
              </motion.div>
            )}

            {/* 1. おすすめスポット＆簡易エリアマップ */}
            {(spots.length > 0 || spotsLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {spotsLoading ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-6 shadow-xs">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-900 animate-pulse">
                        おすすめの立ち寄り候補地をマッピング中...
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
                        目的地周辺から、ご指定のこだわりや移動手段（{transportMode === "car" ? "マイカー" : "公共交通機関"}）にぴったりな場所を探し出しています。
                      </p>
                    </div>
                  </div>
                ) : (
                  <InteractiveMap
                    spots={spots}
                    selectedSpotIds={selectedSpotIds}
                    onToggleSpot={handleToggleSpot}
                    transportMode={transportMode}
                    destination={destination}
                  />
                )}
              </motion.div>
            )}

            {/* 2. プラン未生成かつ候補地もない初期ウェルカム表示 */}
            {!plan && !loading && spots.length === 0 && !spotsLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-xs"
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">しおり作成をはじめましょう！</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    左側のフォームにあなたの理想の旅行を入力し、まずは<br />
                    <strong className="text-indigo-600 font-extrabold">「1. 立ち寄り候補地をマップに並べる」</strong> ボタンを押してください。AIがおすすめの立ち寄り地をご提案します！
                  </p>
                </div>

                <div className="max-w-xl mx-auto border-t border-slate-100 pt-6">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                    💡 クイックお試し体験
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {quickSearches.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickSelect(item)}
                        className="p-3 text-left bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all duration-200 text-slate-700 cursor-pointer text-xs shadow-2xs"
                      >
                        <div className="font-bold text-slate-800 text-xs mb-1">{item.title}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          {item.destination} • {item.days}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. おすすめスポット選択完了後、しおり自動生成を促す案内 */}
            {!plan && !loading && spots.length > 0 && !spotsLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg shrink-0">
                  ✨
                </div>
                <div className="flex-1">
                  <h5 className="text-xs font-extrabold text-slate-850">
                    次のステップ：しおり（行程スケジュール）の作成へ進みましょう
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-semibold">
                    マップ上のピンまたはリストから立ち寄りたい場所のチェックが終わったら、左側にある<br />
                    <strong className="text-indigo-600 font-extrabold">「2. 旅程表を自動生成する」</strong> ボタンを押してください。時間配分を考慮した旅程スケジュールをAIが完成させます。
                  </p>
                </div>
              </motion.div>
            )}

            {/* ローディング表示 */}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-6 shadow-xs"
              >
                <div className="space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 animate-pulse">
                      AIがあなただけの『旅のしおり』を構築中...
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
                      目的地周辺の魅力的なスポット、滞在時間、所要移動時間、ご当地グルメ、そして最適な費用をシミュレーションしています。
                    </p>
                  </div>
                </div>

                {travelType === "キャンプ" && (
                  <div className="max-w-md mx-auto bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-left space-y-1.5 shadow-2xs">
                    <div className="flex items-center text-amber-800 text-xs font-bold">
                      <TreePine className="w-4 h-4 mr-1.5 shrink-0 text-amber-600" />
                      キャンプ・アウトドア向け特別調整中
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                      周辺の快適なウォシュレット付きトイレ情報、食材買い出し用の地元市場やスーパー、疲れを癒やす温泉処を検索＆計画にインテグレートしています。
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* プラン生成完了後の結果表示エリア */}
            {plan && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* タブナビゲーション */}
                <div className="flex border border-slate-200 bg-slate-50 p-1.5 rounded-xl gap-1">
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      activeTab === "timeline"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    旅程タイムライン
                  </button>
                  <button
                    onClick={() => setActiveTab("notion")}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      activeTab === "notion"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Notion連携・データ確認
                  </button>
                </div>

                {/* タブコンテンツ */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <AnimatePresence mode="wait">
                    {activeTab === "timeline" ? (
                      <motion.div
                        key="timeline-tab"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TimelineView plan={plan} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="notion-tab"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <NotionIntegration plan={plan} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </main>

      {/* ステータスバー（Professional Polish 仕様） */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-between px-6 text-[10px] uppercase tracking-widest font-mono z-50">
        <div>旅のしおりプランナー v1.2</div>
        <div>Notion Integration Ready & Offline-friendly</div>
      </footer>
    </div>
  );
}
