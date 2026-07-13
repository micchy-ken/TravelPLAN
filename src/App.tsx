import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Compass, Database, Globe, Map, TreePine, 
  Flame, Heart, Calendar, Clock, RefreshCw, AlertCircle, Key
} from "lucide-react";
import { InputForm } from "./components/InputForm";
import { TimelineView } from "./components/TimelineView";
import { NotionIntegration } from "./components/NotionIntegration";
import { TravelPlan } from "./types";
import { generatePlanClient } from "./utils/geminiClient";

export default function App() {
  // Input states
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("1泊2日");
  const [departureTime, setDepartureTime] = useState("08:00");
  const [style, setStyle] = useState("カップル");
  const [policy, setPolicy] = useState("ゆっくり温泉・癒やし");
  const [travelType, setTravelType] = useState("観光");

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
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const isGitHubPages = window.location.hostname.endsWith("github.io");
      let success = false;
      let generatedPlan: TravelPlan | null = null;

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
              onSubmit={handleGeneratePlan}
              loading={loading}
            />

            {/* API Key Settings (For Static Pages Fallback / GitHub Pages) */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApiSettings(!showApiSettings)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  GitHub Pages 動作設定 (Gemini API)
                </span>
                <span>{showApiSettings ? "▲ 閉じる" : "▼ 開く"}</span>
              </button>

              <AnimatePresence>
                {showApiSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        GitHub Pagesなどの静的環境でAI生成を動かすための設定です。
                        GitHub Secretsに <code>GEMINI_API_KEY</code> を追加してビルドした場合は自動で適用されますが、それ以外の場合はここでご自身のAPIキーを一時的に登録して保存できます（キーはブラウザに安全に保存されます）。
                      </p>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Gemini API キー
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                              const val = e.target.value;
                              setApiKey(val);
                              localStorage.setItem("user_gemini_api_key", val);
                            }}
                            placeholder="AIzaSy... で始まるキーを入力"
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {apiKey && (
                            <button
                              type="button"
                              onClick={() => {
                                setApiKey("");
                                localStorage.removeItem("user_gemini_api_key");
                              }}
                              className="px-2.5 py-1.5 text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              消去
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {((import.meta as any).env?.VITE_GEMINI_API_KEY) && ((import.meta as any).env?.VITE_GEMINI_API_KEY) !== "MY_GEMINI_API_KEY" && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          環境変数からビルド済みのAPIキーが検出されました
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

            {/* プラン未生成の初期ウェルカム表示 */}
            {!plan && !loading && (
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
                    左側のフォームにあなたの理想の旅行を入力し、「AI自動生成スタート」ボタンを押してください。<br />
                    キャンプ、温泉旅、食べ歩きなど、あなたのスタイルに最適なオリジナルのタイムスケジュールを瞬時に設計します。
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
