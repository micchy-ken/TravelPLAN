import { TravelPlan } from "../types";

export interface GeneratePlanParams {
  destination: string;
  days: string;
  departureTime: string;
  style: string;
  policy: string;
  travelType: string;
}

export async function generatePlanClient(
  params: GeneratePlanParams,
  apiKey: string
): Promise<TravelPlan> {
  const { destination, days, departureTime, style, policy, travelType } = params;

  const prompt = `以下の要件に基づいて、最高に魅力的な「旅のしおり」を1つの完璧なJSONオブジェクトとして生成してください。必ず指定されたJSONスキーマに従ってください。

### 条件：
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
- Notionに流し込む際のプロパティは、日本の旅行者がNotionで管理しやすいよう「Name (タイトル/行動内容)」「Day (日付/何日目)」「Time (時間帯)」「Category (カテゴリー)」「Location (場所/住所)」「Memo (メモ)」「Cost (費用)」を想定した値をJSON内に含めてください。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "あなたはプロの旅行アドバイザーであり、Notionをフル活用するデジタルしおりクリエイターです。ユーザーがワクワクし、かつ実用的な、手抜きのないタイムスケジュールを作成してください。出力は必ず指定されたJSON形式にのみ従い、余計な説明テキストやMarkdownの装飾を一切含めないでください。",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "しおりの魅力的なタイトル（例: 「伊豆の自然を満喫！癒やしの温泉1泊2日プラン」）"
            },
            destination: {
              type: "STRING",
              description: "目的地"
            },
            daysCount: {
              type: "STRING",
              description: "何日間のプランか（例: 「2日間」）"
            },
            overview: {
              type: "STRING",
              description: "この旅行プランの全体的な見どころやコンセプトの紹介（150字程度）"
            },
            days: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  dayNumber: {
                    type: "INTEGER",
                    description: "何日目かを表す数値（1から始まる）"
                  },
                  dateLabel: {
                    type: "STRING",
                    description: "日程のラベル（例: 「1日目 (出発日)」、「2日目 (帰着日)」）"
                  },
                  items: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        time: {
                          type: "STRING",
                          description: "時刻または時間帯（例: 「08:00」、「12:30」）"
                        },
                        activity: {
                          type: "STRING",
                          description: "行動・立ち寄り地名（例: 「東京駅集合・出発」、「伊豆シャボテン動物公園」）"
                        },
                        category: {
                          type: "STRING",
                          description: "カテゴリー：'移動', '観光', '食事', '宿泊', '温泉', '買い出し' のいずれか"
                        },
                        location: {
                          type: "STRING",
                          description: "具体的なスポット名や住所、駅名など"
                        },
                        duration: {
                          type: "STRING",
                          description: "滞在または移動時間（例: 「120分」、「60分」）"
                        },
                        cost: {
                          type: "INTEGER",
                          description: "一人あたりの目安費用（日本円。無料や不明の場合は0）"
                        },
                        memo: {
                          type: "STRING",
                          description: "具体的な内容、周辺情報、おすすめポイント、またはキャンプ時の温泉/トイレ/買い出し詳細など。詳しく記述してください。"
                        },
                        notionProperties: {
                          type: "OBJECT",
                          properties: {
                            Name: { type: "STRING", description: "Notionデータベースの「タイトル」に入る文字列" },
                            Day: { type: "STRING", description: "「何日目」を表すセレクト用値（例: 「Day 1」）" },
                            Time: { type: "STRING", description: "「時刻」を表すテキスト" },
                            Category: { type: "STRING", description: "「カテゴリー」を表すセレクト用値（移動/観光/食事/宿泊/温泉/買い出し）" },
                            Location: { type: "STRING", description: "「場所」を表すテキスト" },
                            Memo: { type: "STRING", description: "「メモ」に入る説明文（簡潔版）" },
                            Cost: { type: "INTEGER", description: "「費用」に入る数値" }
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
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errorDetails = "";
    try {
      const errJson = JSON.parse(errText);
      errorDetails = errJson?.error?.message || errText;
    } catch {
      errorDetails = errText;
    }
    throw new Error(`Gemini APIエラー: ${errorDetails}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("AIから有効な応答を取得できませんでした。");
  }

  return JSON.parse(text) as TravelPlan;
}
