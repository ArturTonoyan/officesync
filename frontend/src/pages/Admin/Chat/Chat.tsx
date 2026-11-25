import {
  useEffect,
  useMemo,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  setChatDraft,
  setChatTopic,
  resetChatLoadingIfIdle,
} from "../../../store/chatSlice/chat.Slice";
import {
  isChatRequestActive,
  sendChatRequest,
  stopChatRequest,
} from "../../../store/chatSlice/chatRequest";

const TOPICS = [
  { value: "company", label: "Компания" },
  { value: "offices", label: "Офисы" },
  { value: "floors", label: "Этажи" },
  { value: "users", label: "Сотрудники" },
  { value: "equipments", label: "Оборудование" },
  { value: "problems", label: "Заявки на ремонт" },
  { value: "tos", label: "ТО" },
];

const QUICK_QUESTIONS: Record<string, string[]> = {
  company: [
    "Расскажи кратко о компании",
    "Какие основные данные есть по компании?",
  ],
  offices: [
    "Сколько офисов и где они находятся?",
    "Перечисли все офисы",
  ],
  floors: [
    "Сколько этажей и в каких офисах?",
    "Перечисли все этажи",
  ],
  users: [
    "Сколько сотрудников в компании?",
    "Кто работает на каких этажах?",
  ],
  equipments: [
    "Сколько всего оборудования?",
    "Перечисли всё оборудование",
    "Какое оборудование требует внимания?",
  ],
  problems: [
    "Сколько открытых заявок на ремонт?",
    "Какие самые срочные заявки?",
  ],
  tos: [
    "Какие ТО запланированы или в работе?",
    "Перечисли заявки на ТО",
  ],
};

function Chat() {
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topic = useAppSelector((state) => state.chat.topic);
  const question = useAppSelector((state) => state.chat.draft);
  const loading = useAppSelector((state) => state.chat.loading);
  const messages = useAppSelector((state) => state.chat.messages);

  const topicTitle = useMemo(
    () => TOPICS.find((item) => item.value === topic)?.label || "Тема",
    [topic],
  );

  const quickQuestions = QUICK_QUESTIONS[topic] || [];

  useEffect(() => {
    if (!isChatRequestActive()) {
      dispatch(resetChatLoadingIfIdle());
    }
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleStop = () => {
    stopChatRequest(dispatch);
  };

  const handleSend = (overrideQuestion?: string) => {
    void sendChatRequest(overrideQuestion, dispatch);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (loading) {
      return;
    }
    handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <h1>AI-чат по данным компании</h1>

      <div className="mt-7 box-border flex min-h-[calc(100vh-180px)] w-full flex-col gap-[18px] bg-transparent p-6 max-[900px]:min-h-0 max-[900px]:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="topic" className="text-[13px] font-semibold text-fg-secondary">
            Тема:
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(event) => dispatch(setChatTopic(event.target.value))}
            className="min-w-[230px] appearance-none rounded-md border border-line bg-elevated bg-[length:12px_8px] bg-[right_14px_center] bg-no-repeat py-2.5 pl-3.5 pr-10 text-sm text-fg outline-none transition-[border-color] focus:border-fg"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b6b70' d='M1.4 1.4 6 6l4.6-4.6L12 2.8 6 8.8 0 2.8z'/%3E%3C/svg%3E\")",
            }}
          >
            {TOPICS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="rounded-sm bg-tag-blue-bg px-2.5 py-1.5 text-xs font-semibold text-tag-blue">
            Выбрано: {topicTitle}
          </div>
        </div>

        <div className="scrollbar-thin flex max-h-[calc(100vh-390px)] flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-line bg-elevated p-4 max-[900px]:max-h-[420px]">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "flex max-w-[90%] flex-col gap-[7px] rounded-md px-3.5 py-3 max-[900px]:max-w-full",
                message.role === "user" &&
                  "ml-auto border-0 bg-ink [&_p]:text-white [&_span]:text-white [&_span]:opacity-65",
                message.role === "assistant" &&
                  "mr-auto border border-line bg-bg",
                message.isError &&
                  "border-[#f0bab8] bg-tag-red-bg [&_p]:text-tag-red [&_span]:text-tag-red",
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-fg-muted">
                {message.role === "user" ? "Вы" : "Ассистент"}
              </span>
              <p className="m-0 whitespace-pre-wrap text-sm leading-snug text-fg">
                {message.content}
              </p>
            </div>
          ))}
          {loading && (
            <div className="mr-auto flex max-w-[90%] flex-col gap-[7px] rounded-md border border-line bg-bg px-3.5 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-fg-muted">
                Ассистент
              </span>
              <p className="m-0 whitespace-pre-wrap text-sm leading-snug text-fg">
                Думаю над ответом...
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
          {quickQuestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(item)}
                  className="rounded-md border border-line bg-elevated px-3 py-1.5 text-left text-[12px] font-medium text-fg-secondary transition-colors hover:border-line-strong hover:bg-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          <textarea
            placeholder="Например: Сколько сотрудников в компании и на каких этажах больше всего людей? Enter — отправить, Shift+Enter — новая строка"
            value={question}
            onChange={(event) => dispatch(setChatDraft(event.target.value))}
            onKeyDown={handleKeyDown}
            className="box-border min-h-24 max-h-[220px] w-full resize-y rounded-md border border-line bg-elevated p-3.5 text-sm leading-normal text-fg outline-none transition-[border-color,box-shadow] focus:border-fg focus:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
          />
          {loading ? (
            <Button
              type="button"
              onClick={handleStop}
              aria-label="Остановить генерацию"
              title="Остановить"
              className="min-w-[140px] self-end max-[900px]:w-full"
            >
              <span
                aria-hidden
                className="inline-block size-3.5 shrink-0 rounded-[2px] bg-white"
              />
              Стоп
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!question.trim()}
              className="min-w-[140px] self-end max-[900px]:w-full"
            >
              Отправить
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Chat;
