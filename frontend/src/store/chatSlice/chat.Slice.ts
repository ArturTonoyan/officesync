import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Привет! Выберите тему, задайте вопрос, и я отвечу по данным выбранной таблицы.",
};

type ChatState = {
  topic: string;
  messages: ChatMessage[];
  loading: boolean;
  draft: string;
};

const initialState: ChatState = {
  topic: "equipments",
  messages: [WELCOME_MESSAGE],
  loading: false,
  draft: "",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatTopic(state, action: PayloadAction<string>) {
      state.topic = action.payload;
    },
    setChatDraft(state, action: PayloadAction<string>) {
      state.draft = action.payload;
    },
    setChatLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    addChatMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    resetChatLoadingIfIdle(state) {
      // После перезагрузки страницы активного запроса уже нет
      state.loading = false;
    },
  },
});

export const {
  setChatTopic,
  setChatDraft,
  setChatLoading,
  addChatMessage,
  resetChatLoadingIfIdle,
} = chatSlice.actions;

export default chatSlice.reducer;
