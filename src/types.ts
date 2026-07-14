export interface NotionProperties {
  Name: string;
  Day: string;
  Time: string;
  Category: string;
  Location: string;
  Memo: string;
  Cost: number;
}

export interface TimelineItem {
  time: string;
  activity: string;
  category: "移動" | "観光" | "食事" | "宿泊" | "温泉" | "買い出し" | string;
  location: string;
  duration: string;
  cost: number;
  memo: string;
  notionProperties: NotionProperties;
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
}

export interface TravelDay {
  dayNumber: number;
  dateLabel: string;
  items: TimelineItem[];
}

export interface TravelPlan {
  title: string;
  destination: string;
  daysCount: string;
  overview: string;
  days: TravelDay[];
}

export interface Spot {
  id: string;
  name: string;
  description: string;
  category: "移動" | "観光" | "食事" | "宿泊" | "温泉" | "買い出し" | "その他" | string;
  recommendedDuration: string;
  estimatedCost: number;
  x: number; // 10-90 (X coordinate for custom map)
  y: number; // 10-90 (Y coordinate for custom map)
  reason: string; // Why recommended for this transportation mode
  lat?: number;
  lng?: number;
}
