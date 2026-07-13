import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Shared Gemini client utility
// Note: User-Agent is set to 'aistudio-build' in httpOptions for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser
  app.use(express.json({ limit: "10mb" }));

  // API Route: Generate travel plan
  app.post("/api/plan", async (req, res) => {
    const { destination, days, departureTime, style, policy, travelType } = req.body;

    if (!destination) {
      return res.status(400).json({ error: "目的地を入力してください。" });
    }

    try {
      // Build instructions based on requirements
      let prompt = `以下の条件に沿った、非常に具体的で魅力的な旅行タイムスケジュールを作成してください。
目的地: ${destination}
日程: ${days}
出発希望時刻: ${departureTime}
旅行スタイル: ${style}
しおり方針・こだわり: ${policy}
旅行の種類: ${travelType}

### 指示：
- 旅行の全日程における、時間ごとの具体的なスケジュール（何時にどこに行って何をするか、移動時間など）を含めてください。
- キャンプ（travelType="キャンプ"）が選ばれた場合は、周辺の魅力的な温泉施設や食材の買い出しスポット、快適なトイレ（ウォシュレット付きなど清潔な設備）が利用できる場所を優先的に、行程に組み込むか、おすすめメモとして必ず盛り込んでください。
- 行程に含まれる各場所の「場所名、移動所要時間、目安費用（円）、カテゴリー（移動/観光/食事/宿泊/温泉/買い出し）、説明・メモ、および将来Notionデータベースへインポートするためのプロパティ構成」を含めてください。
- Notionに流し込む際のプロパティは、日本の旅行者がNotionで管理しやすいよう「Name (タイトル/行動内容)」「Day (日付/何日目)」「Time (時間帯)」「Category (カテゴリー)」「Location (場所/住所)」「Memo (メモ)」「Cost (費用)」を想定した値をJSON内に含めてください。
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "あなたはプロの旅行アドバイザーであり、Notionをフル活用するデジタルしおりクリエイターです。ユーザーがワクワクし、かつ実用的な、手抜きのないタイムスケジュールを作成してください。出力は必ず指定されたJSON形式にのみ従い、余計な説明テキストやMarkdownの装飾を一切含めないでください。",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "しおりの魅力的なタイトル（例: 「伊豆の自然を満喫！癒やしの温泉1泊2日プラン」）"
              },
              destination: {
                type: Type.STRING,
                description: "目的地"
              },
              daysCount: {
                type: Type.STRING,
                description: "何日間のプランか（例: 「2日間」）"
              },
              overview: {
                type: Type.STRING,
                description: "この旅行プランの全体的な見どころやコンセプトの紹介（150字程度）"
              },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: {
                      type: Type.INTEGER,
                      description: "何日目かを表す数値（1から始まる）"
                    },
                    dateLabel: {
                      type: Type.STRING,
                      description: "日程のラベル（例: 「1日目 (出発日)」、「2日目 (帰着日)」）"
                    },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: {
                            type: Type.STRING,
                            description: "時刻または時間帯（例: 「08:00」、「12:30」）"
                          },
                          activity: {
                            type: Type.STRING,
                            description: "行動・立ち寄り地名（例: 「東京駅集合・出発」、「伊豆シャボテン動物公園」）"
                          },
                          category: {
                            type: Type.STRING,
                            description: "カテゴリー：'移動', '観光', '食事', '宿泊', '温泉', '買い出し' のいずれか"
                          },
                          location: {
                            type: Type.STRING,
                            description: "具体的なスポット名や住所、駅名など"
                          },
                          duration: {
                            type: Type.STRING,
                            description: "滞在または移動時間（例: 「120分」、「60分」）"
                          },
                          cost: {
                            type: Type.INTEGER,
                            description: "一人あたりの目安費用（日本円。無料や不明の場合は0）"
                          },
                          memo: {
                            type: Type.STRING,
                            description: "具体的な内容、周辺情報、おすすめポイント、またはキャンプ時の温泉/トイレ/買い出し詳細など。詳しく記述してください。"
                          },
                          notionProperties: {
                            type: Type.OBJECT,
                            properties: {
                              Name: { type: Type.STRING, description: "Notionデータベースの「タイトル」に入る文字列" },
                              Day: { type: Type.STRING, description: "「何日目」を表すセレクト用値（例: 「Day 1」）" },
                              Time: { type: Type.STRING, description: "「時刻」を表すテキスト" },
                              Category: { type: Type.STRING, description: "「カテゴリー」を表すセレクト用値（移動/観光/食事/宿泊/温泉/買い出し）" },
                              Location: { type: Type.STRING, description: "「場所」を表すテキスト" },
                              Memo: { type: Type.STRING, description: "「メモ」に入る説明文（簡潔版）" },
                              Cost: { type: Type.INTEGER, description: "「費用」に入る数値" }
                            },
                            required: ["Name", "Day", "Time", "Category", "Location", "Memo", "Cost"]
                          }
                        },
                        required: ["time", "activity", "category", "location", "duration", "cost", "memo", "notionProperties"]
                      }
                    }
                  },
                  required: ["dayNumber", "dateLabel", "items"]
                }
              }
            },
            required: ["title", "destination", "daysCount", "overview", "days"]
          }
        }
      });

      const planText = response.text;
      if (!planText) {
        throw new Error("AIからの応答が空でした。");
      }

      // Parse JSON to ensure it is valid
      const parsedPlan = JSON.parse(planText);
      res.json({ success: true, plan: parsedPlan });
    } catch (error: any) {
      console.error("Plan Generation Error:", error);
      res.status(500).json({
        error: "プランの生成に失敗しました。時間をおいて再度お試しください。",
        details: error?.message || error
      });
    }
  });

  // API Route: Real export to Notion
  app.post("/api/notion/export", async (req, res) => {
    const { token, databaseId, items } = req.body;

    if (!token || !databaseId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "必要なパラメータ（token, databaseId, items）が不足しています。" });
    }

    try {
      const results = [];
      const errors = [];

      // Loop through items and insert them into the Notion Database
      for (const item of items) {
        const props = item.notionProperties || {};
        
        // Prepare Notion database row request body
        const requestBody = {
          parent: { database_id: databaseId },
          properties: {
            "Name": {
              title: [
                {
                  text: {
                    content: props.Name || item.activity || "名称未設定"
                  }
                }
              ]
            },
            "Day": {
              select: {
                name: props.Day || `Day ${item.dayNumber || 1}`
              }
            },
            "Time": {
              rich_text: [
                {
                  text: {
                    content: props.Time || item.time || ""
                  }
                }
              ]
            },
            "Category": {
              select: {
                name: props.Category || item.category || "その他"
              }
            },
            "Location": {
              rich_text: [
                {
                  text: {
                    content: props.Location || item.location || ""
                  }
                }
              ]
            },
            "Memo": {
              rich_text: [
                {
                  text: {
                    content: props.Memo || item.memo || ""
                  }
                }
              ]
            },
            "Cost": {
              number: typeof props.Cost === "number" ? props.Cost : (typeof item.cost === "number" ? item.cost : 0)
            }
          }
        };

        // Make API request to Notion
        const notionRes = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (notionRes.ok) {
          const resData = await notionRes.json();
          results.push({ activity: item.activity, status: "success", id: resData.id });
        } else {
          const errData = await notionRes.json();
          console.error("Notion page creation error:", errData);
          errors.push({ activity: item.activity, status: "error", details: errData });
        }
      }

      if (errors.length === items.length) {
        return res.status(500).json({
          success: false,
          error: "Notionへの流し込みに完全に失敗しました。TokenまたはDatabase ID、プロパティ設定（特にタイトルが「Name」かどうか）を確認してください。",
          errors
        });
      }

      res.json({
        success: true,
        message: `${results.length}個のアイテムをNotionへ登録しました。`,
        results,
        errors
      });

    } catch (error: any) {
      console.error("Notion Export Error:", error);
      res.status(500).json({
        error: "Notionへの接続中にエラーが発生しました。",
        details: error?.message || error
      });
    }
  });

  // Serve static files in production or use Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
