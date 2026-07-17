import { TravelPlan, Spot } from "../types";

export interface GeneratePlanParams {
  destination: string;
  days: string;
  departureTime: string;
  style: string;
  policy: string;
  travelType: string;
  transportMode: string;
  selectedSpots: Spot[];
  startLocation?: string;
}

export interface SuggestSpotsParams {
  destination: string;
  travelType: string;
  transportMode: string;
  style: string;
  policy: string;
  startLocation?: string;
}

async function clientRetry(fn: () => Promise<Response>, retries = 3, delay = 1000): Promise<Response> {
  try {
    const res = await fn();
    if (res.status === 429 || res.status >= 500) {
      if (retries > 0) {
        console.warn(`Browser Gemini API call failed with status ${res.status}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return clientRetry(fn, retries - 1, delay * 2);
      }
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Browser Gemini API call failed. Retrying in ${delay}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return clientRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function suggestSpotsClient(
  params: SuggestSpotsParams,
  apiKey: string
): Promise<Spot[]> {
  const { destination, travelType, transportMode, style, policy, startLocation = "東京駅" } = params;
  const transitText = transportMode === "car" ? "自家用車・レンタカー（道路アクセスや駐車場が便利、ドライブ向き）" : "公共交通機関（電車・バス、駅から徒歩圏内、またはバス便が良い）";

  const prompt = `出発地「${startLocation}」から目的地「${destination}」へ向かう、またはその周辺を周遊する際に、以下の条件に最適な立ち寄りスポット・おすすめスポット（観光地、飲食店、温泉、買い出し場所など）を5箇所から8箇所、提案してください。
旅行の種類: ${travelType}
移動手段: ${transitText}
旅行スタイル: ${style}
しおり方針: ${policy}

### 条件：
1. 各スポットには10から90の範囲の相対的な二次元座標 (x, y) を割り当ててください。これらは、簡易マップ上にスポットをプロットするために使用されます。出発地・起点である「${startLocation}」（またはその最寄駅・ICなどエリア入口）を「x=50, y=15」あたりに想定し、そこからの実際の位置関係や南下・西進などの方向性を表現する形で各スポットの相対的な (x, y) 座標を割り当ててください。
2. 移動手段が「自家用車」の場合は、駐車場がある、またはドライブで立ち寄りやすい場所を重視してください。
3. 移動手段が「公共交通機関」の場合は、駅から近い、あるいはバスで行きやすいなど、アクセスしやすいスポットを提案してください。
4. キャンプ（travelType="キャンプ"）の場合は、買い出しスポット、清潔なトイレ・水洗トイレが整った場所、および魅力的な温泉・入浴施設を必ず複数含めてください。
5. 各スポットについて、なぜこの移動手段（自家用車または公共交通機関）にとって最適なのか、その理由 (reason) を詳しく記述してください。
6. 各スポットの実世界の正確な緯度(lat)と経度(lng)を推測し、それぞれ小数型（Number）で設定してください。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [
          {
            text: "あなたは地元の観光情報に非常に精通した優秀なトラベルコンシェルジュです。ユーザーの移動手段（車 vs 公共交通機関）や目的に対して、本当に快適で満足度の高い立ち寄りスポットを、正確な相対座標付きで提案してください。出力は指定されたJSONスキーマに完全に準拠し、余計な説明文は一切省いてください。",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            spots: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING", description: "ユニークな識別子（例: spot-1, spot-2）" },
                  name: { type: "STRING", description: "スポットの正式名称または具体的な場所名" },
                  description: { type: "STRING", description: "スポットの魅力、見どころ、何ができるかの説明（100文字程度）" },
                  category: { type: "STRING", description: "カテゴリー: '観光', '食事', '宿泊', '温泉', '買い出し', 'その他' のいずれか" },
                  recommendedDuration: { type: "STRING", description: "推奨滞在時間（例: 「60分」、「120分」）" },
                  estimatedCost: { type: "INTEGER", description: "一人あたりの目安費用（日本円。無料や不明の場合は0）" },
                  x: { type: "INTEGER", description: "マップ描画用のX座標 (10-90の範囲で、スポットの位置関係を表現)" },
                  y: { type: "INTEGER", description: "マップ描画用のY座標 (10-90の範囲で、スポットの位置関係を表現)" },
                  lat: { type: "NUMBER", description: "実世界の緯度（例: 35.6812）" },
                  lng: { type: "NUMBER", description: "実世界の経度（例: 139.7671）" },
                  reason: { type: "STRING", description: "この移動手段（車または公共交通機関）で訪れるのにおすすめな具体的な理由やアクセスのヒント" }
                },
                required: ["id", "name", "description", "category", "recommendedDuration", "estimatedCost", "x", "y", "lat", "lng", "reason"]
              }
            }
          },
          required: ["spots"]
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini APIエラー: ${errText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("AIからおすすめスポットの応答を取得できませんでした。");
  }

  const parsed = JSON.parse(text);
  return parsed.spots as Spot[];
}

export async function generatePlanClient(
  params: GeneratePlanParams,
  apiKey: string
): Promise<TravelPlan> {
  const { destination, days, departureTime, style, policy, travelType, transportMode, selectedSpots, startLocation = "東京駅" } = params;

  let prompt = `以下の要件に基づいて、最高に魅力的な「旅のしおり」を1つの完璧なJSONオブジェクトとして生成してください。必ず指定されたJSONスキーマに従ってください。

### 条件：
出発地: ${startLocation}
目的地: ${destination}
日程: ${days}
出発希望時刻: ${departureTime}
旅行スタイル: ${style}
しおり方針・こだわり: ${policy}
旅行の種類: ${travelType}
移動手段: ${transportMode === "car" ? "自家用車・レンタカー（道路状況・駐車場を考慮）" : "公共交通機関（電車・バスの時刻や徒歩ルートを考慮）"}
`;

  prompt += `\n### ルートの起点・終点条件：
1. 旅行は必ず、指定された出発時間（${departureTime}）に「出発地：${startLocation}」から移動を始めるスケジュールにしてください。
2. 1日目の最初のスケジュールに「${startLocation}を出発」といった項目を必ず入れてください。
3. 2日以上の旅行で最終日がある場合は、最後の行動として「${startLocation}に帰着」または帰りの便に乗るスケジュールにしてください。
`;

  if (selectedSpots && selectedSpots.length > 0) {
    prompt += `\n### 必ず行程に組み込む立ち寄りスポット（最優先・訪問順序）：\n`;
    selectedSpots.forEach((spot, idx) => {
      prompt += `${idx + 1}. ${spot.name} (カテゴリー: ${spot.category}, 座標: x=${spot.x}, y=${spot.y}, 滞在目安: ${spot.recommendedDuration}, 費用目安: ${spot.estimatedCost}円): ${spot.description}\n`;
    });
    prompt += `\n上記スポットを、ユーザーが指定した通りの順番（1番から順に訪問するルート）で行程に必ず含め、適切な移動時間を見積もってタイムスケジュールを組み立ててください。移動方法は「${transportMode === "car" ? "車移動" : "公共交通機関や徒歩"}」の所要時間・特徴を反映させてください。\n`;
    prompt += `\n【重要・厳守ルール】観光・見学・温泉などの目的地として組み込むのは、上記の「必ず行程に組み込む立ち寄りスポット」として指定されたスポットのみにしてください。ユーザーがチェック（選択）していない、無関係な新しい観光スポットや候補地リストにない場所は、絶対に行程に含めないでください。ただし、出発地、到着地、食事（ランチ・ディナー等）、宿泊、および移動手段の乗り継ぎ駅などは自動で妥当なものを追加しても構いません。\n`;
  }

  prompt += `\n### 指示：
- 各スケジュール項目には必ず、簡易マップ描画用の相対二次元座標 (x, y) を割り当ててください（10から90の範囲）。
  - 起点である出発地「${startLocation}」は、x=50, y=15近辺（またはスポットに近い位置）に配置してください。
  - 行程中の各スポットの位置関係、移動の順番に合わせて、x, y座標を整合性のある形で割り当ててください（例えば、1番目の立ち寄り地、2番目の立ち寄り地、3番目の立ち寄り地、宿泊地、と順番に移動経路が繋がるように設定してください）。
- 各スケジュール項目（立ち寄りスポット、駅、ホテルなど、移動項目は除くか移動先/現在の座標）の実世界における正確な緯度と経度（lat, lng）を推定して、それぞれ数値（例: latは35.6812、lngは139.7671）で設定してください。
- 旅行の全日程における、時間ごとの具体的なスケジュール（何時にどこに行って何をするか、移動時間など）を含めてください。
- キャンプ（travelType="キャンプ"）が選ばれた場合は、周辺的魅力のある温泉施設や食材の買い出しスポット、快適なトイレ（ウォシュレット付きなど清潔な設備）が利用できる場所を優先的に、行程に組み込むか、おすすめメモとして必ず盛り込んでください。
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
            text: "あなたはプロの旅行アドバイザーであり、Notionをフル活用するデジタルしおりクリエイターです。ユーザーがワクワクし、かつ実用的な、手抜きのないタイムスケジュールを作成してください。出力は必ず指定されたJSON形式にのみ従い、余計な説明テキストやMarkdown of 装飾を一切含めないでください。",
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
                        x: {
                          type: "INTEGER",
                          description: "マップ描画用の相対X座標（10-90）"
                        },
                        y: {
                          type: "INTEGER",
                          description: "マップ描画用の相対Y座標（10-90）"
                        },
                        lat: {
                          type: "NUMBER",
                          description: "実世界の緯度（例: 35.6812）"
                        },
                        lng: {
                          type: "NUMBER",
                          description: "実世界の経度（例: 139.7671）"
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
                      required: ["time", "activity", "category", "location", "duration", "cost", "memo", "x", "y", "lat", "lng", "notionProperties"]
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
