export interface FilePreviews {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: FilePreviews[];
  chatId: string;
}
