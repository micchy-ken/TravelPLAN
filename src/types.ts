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
