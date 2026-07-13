import React, { useState, useEffect } from "react";
import { 
  Database, Key, ArrowRight, Check, Copy, Clipboard, FileJson, 
  HelpCircle, Settings, CheckCircle, AlertTriangle, Sparkles, Send
} from "lucide-react";
import { TravelPlan, TimelineItem } from "../types";

interface NotionIntegrationProps {
  plan: TravelPlan;
}

export const NotionIntegration: React.FC<NotionIntegrationProps> = ({ plan }) => {
  const [token, setToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTotal, setExportTotal] = useState(0);
  const [exportLogs, setExportLogs] = useState<string[]>([]);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("notion_token") || "";
    const savedDbId = localStorage.getItem("notion_database_id") || "";
    if (savedToken) setToken(savedToken);
    if (savedDbId) setDatabaseId(savedDbId);
    if (savedToken && savedDbId) setIsSaved(true);
  }, []);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("notion_token", token);
    localStorage.setItem("notion_database_id", databaseId);
    setIsSaved(true);
    // Temporary flash
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClearCredentials = () => {
    localStorage.removeItem("notion_token");
    localStorage.removeItem("notion_database_id");
    setToken("");
    setDatabaseId("");
    setIsSaved(false);
  };

  // Generate markdown for easy copy-paste inside a regular Notion page
  const generateMarkdown = (): string => {
    let md = `# 旅のしおり: ${plan.title}\n\n`;
    md += `**目的地:** ${plan.destination}\n`;
    md += `**日程:** ${plan.daysCount}\n\n`;
    md += `## 概要\n${plan.overview}\n\n`;

    plan.days.forEach((day) => {
      md += `### 📅 ${day.dateLabel}\n\n`;
      md += `| 時刻 | カテゴリー | 場所・アクティビティ | 滞在/移動 | 費用目安 | メモ |\n`;
      md += `| --- | --- | --- | --- | --- | --- |\n`;
      day.items.forEach((item) => {
        const costStr = item.cost > 0 ? `¥${item.cost.toLocaleString()}` : "無料";
        md += `| ${item.time} | ${item.category} | **${item.activity}** | ${item.duration} | ${costStr} | ${item.memo} |\n`;
      });
      md += `\n`;
    });

    return md;
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Handle Notion Export
  const handleNotionExport = async () => {
    if (!token || !databaseId) {
      alert("NotionのインテグレーションキーとデータベースIDを入力してください。");
      return;
    }

    setExporting(true);
    setExportResult(null);
    setExportLogs(["流し込み処理を開始します..."]);
    
    // Gather all items from all days
    const allItems: any[] = [];
    plan.days.forEach(day => {
      day.items.forEach(item => {
        allItems.push({
          ...item,
          dayNumber: day.dayNumber
        });
      });
    });

    setExportTotal(allItems.length);
    setExportProgress(0);

    try {
      setExportLogs(prev => [...prev, `${allItems.length} 個の旅程データを検出しました。`]);
      
      const response = await fetch("/api/notion/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          databaseId,
          items: allItems
        })
      });

      const data = await response.json();

      if (data.success) {
        setExportProgress(allItems.length);
        setExportLogs(prev => [
          ...prev, 
          `成功: ${data.message}`,
          "Notionデータベースの流し込みがすべて完了しました！"
        ]);
        setExportResult({
          success: true,
          message: `${data.results.length}件すべてのデータを正常にNotionに連携しました！`
        });
      } else {
        setExportLogs(prev => [...prev, `エラー: ${data.error}`]);
        setExportResult({
          success: false,
          message: data.error || "エクスポートに失敗しました。"
        });
      }
    } catch (err: any) {
      console.error(err);
      setExportLogs(prev => [...prev, `接続エラー: ${err.message || err}`]);
      setExportResult({
        success: false,
        message: "サーバーとの通信に失敗しました。Notionの認証キーやネットワークを確認してください。"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 説明ヘッダー */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center space-x-2 text-slate-800">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base">将来のNotionデータベース設計 ＆ 自動連携</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          このアプリで生成したタイムスケジュールは、Notionの「データベース」に流し込める形式で構成されています。
          お手持ちのNotionデータベースに1クリックで自動インポート（流し込み）する機能、または簡易的にコピペできるMarkdownを生成できます。
        </p>
      </div>

      {/* タブ切り替え（データベース設計 vs 連携設定） */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200">
          <h4 className="font-bold text-slate-800 text-sm flex items-center">
            <Settings className="w-4 h-4 mr-2 text-slate-500" />
            1. Notionデータベースのスキーマ（テーブル設定）
          </h4>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            連携データベースをNotionで作成する場合、以下の列名（プロパティ）と型を設定してください。
            設定すると、下記の自動流し込み機能が完全に動作します。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-bold">プロパティ名</th>
                  <th className="py-2 font-bold">Notionの型</th>
                  <th className="py-2 font-bold">流し込みのデータ値（例）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Name</td>
                  <td className="py-2.5">タイトル (Title)</td>
                  <td className="py-2.5">伊豆シャボテン動物公園</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Day</td>
                  <td className="py-2.5">セレクト (Select)</td>
                  <td className="py-2.5">Day 1, Day 2</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Time</td>
                  <td className="py-2.5">テキスト (Text)</td>
                  <td className="py-2.5">13:30</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Category</td>
                  <td className="py-2.5">セレクト (Select)</td>
                  <td className="py-2.5">観光, 食事, 移動, 温泉, 宿泊, 買い出し</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Location</td>
                  <td className="py-2.5">テキスト (Text)</td>
                  <td className="py-2.5">静岡県伊東市富戸1317-13</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Memo</td>
                  <td className="py-2.5">テキスト (Text)</td>
                  <td className="py-2.5">カピバラの露天風呂が見どころです！</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold font-mono text-indigo-600">Cost</td>
                  <td className="py-2.5">数値 (Number)</td>
                  <td className="py-2.5">2700</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notion自動流し込み（本当の動作） */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 text-sm flex items-center">
            <Key className="w-4 h-4 mr-2 text-indigo-600" />
            2. Notion API リアルタイム流し込み実行
          </h4>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
            フル機能動作
          </span>
        </div>
        <div className="p-5 space-y-4">
          <form onSubmit={handleSaveCredentials} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center" htmlFor="notion-token">
                Notion インテグレーション秘密トークン (Internal Integration Token)
              </label>
              <input 
                id="notion-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center" htmlFor="notion-db-id">
                連携先データベースID (Database ID)
              </label>
              <input 
                id="notion-db-id"
                type="text"
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                placeholder="32桁の英数字（例: 8527a92b0e9f4a66a1529ea273874b9e）"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button 
                type="submit"
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
              >
                接続キーをブラウザに保存
              </button>
              {(token || databaseId) && (
                <button 
                  type="button"
                  onClick={handleClearCredentials}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                >
                  クリア
                </button>
              )}
            </div>
            {isSaved && (
              <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-lg font-bold flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                資格情報をLocalStorageに保存しました！
              </p>
            )}
          </form>

          <hr className="border-slate-100" />

          {/* 流し込み実行ボタン */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleNotionExport}
              disabled={exporting || !token || !databaseId}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center transition-all cursor-pointer ${
                exporting || !token || !databaseId
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
              }`}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  流し込み処理中 ({exportProgress}/{exportTotal})...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Notionへ自動流し込みを実行する
                </>
              )}
            </button>

            {!token || !databaseId ? (
              <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                ⚠️ 自動流し込みを使用するには、上記のトークンとデータベースIDを先に入力・保存してください。
              </p>
            ) : null}

            {/* 進捗バー & ログ */}
            {(exporting || exportLogs.length > 0) && (
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-indigo-400 border-b border-slate-800 pb-1.5">
                  <span>進行状況</span>
                  <span>{exportProgress} / {exportTotal} 件完了</span>
                </div>
                {/* プログレスバー */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${exportTotal > 0 ? (exportProgress / exportTotal) * 100 : 0}%` }}
                  />
                </div>
                {/* ログビューアー */}
                <div className="max-h-32 overflow-y-auto space-y-1 text-slate-400 select-text leading-relaxed">
                  {exportLogs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap">{log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 結果表示 */}
            {exportResult && (
              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                exportResult.success 
                  ? "bg-indigo-50 border-indigo-100 text-indigo-850" 
                  : "bg-red-50 border-red-100 text-red-800"
              }`}>
                {exportResult.success ? (
                  <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h5 className="font-bold text-sm">
                    {exportResult.success ? "インポート完了！" : "インポートに失敗しました"}
                  </h5>
                  <p className="text-xs leading-relaxed opacity-90">{exportResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 簡易コピペ & Markdownエクスポート */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 text-sm flex items-center">
            <Clipboard className="w-4 h-4 mr-2 text-slate-500" />
            3. 簡易Markdownコピペ (通常のNotionページ貼付用)
          </h4>
          <button
            onClick={() => handleCopy(generateMarkdown(), "markdown")}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg font-bold flex items-center transition-all cursor-pointer"
          >
            {copiedText === "markdown" ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                コピー完了
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                クリップボードにコピー
              </>
            )}
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Notionの通常の白紙ページにこの旅行プランをまるごと綺麗なドキュメントとして貼り付けたい場合は、
            上記のボタンを押してそのままNotionページ上で <code>Cmd+V</code> (または <code>Ctrl+V</code>) でペーストしてください。
            綺麗な表と見出しでそのままレンダリングされます。
          </p>
          <div className="bg-slate-50 p-4 rounded-xl max-h-40 overflow-y-auto text-xs text-slate-500 font-mono border border-slate-100 select-text">
            {generateMarkdown()}
          </div>
        </div>
      </div>

      {/* RAW JSON Export */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 text-sm flex items-center">
            <FileJson className="w-4 h-4 mr-2 text-slate-500" />
            4. 生のプランデータ (JSON出力)
          </h4>
          <button
            onClick={() => handleCopy(JSON.stringify(plan, null, 2), "json")}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg font-bold flex items-center transition-all cursor-pointer"
          >
            {copiedText === "json" ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                コピー完了
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                JSONをコピー
              </>
            )}
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-3">
            開発者やカスタム自動化（Zapier / Make経由の流し込みなど）を検討している方向けに、
            AIが生成したスキーマ設計済みのピュアなJSONデータを提供します。
          </p>
          <div className="bg-slate-50 p-4 rounded-xl max-h-40 overflow-y-auto text-xs text-slate-500 font-mono border border-slate-100 select-text">
            {JSON.stringify(plan, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
};
