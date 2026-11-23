import { useMemo, useState } from "react";
import { apiAskChat } from "../../../api/apirequests";
import { createLogger } from "../../../utils/logger";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";

const TOPICS = [
  { value: "company", label: "Компания" },
  { value: "offices", label: "Офисы" },
  { value: "floors", label: "Этажи" },
  { value: "users", label: "Сотрудники" },
  { value: "equipments", label: "Оборудование" },
  { value: "problems", label: "Заявки на ремонт" },
  { value: "tos", label: "ТО" },
];

function Chat() {
  const logger = createLogger("chat-ui");
  const [topic, setTopic] = useState("equipments");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Привет! Выберите тему, задайте вопрос, и я отвечу по данным выбранной таблицы.",
    },
  ]);

  const topicTitle = useMemo(
    () => TOPICS.find((item) => item.value === topic)?.label || "Тема",
    [topic],
  );

  const handleSend = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) {
      return;
    }

    const startedAt = Date.now();

    const userMessage = { role: "user", content: trimmedQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      logger.info("chat_question_sent", {
        topic,
        questionLength: trimmedQuestion.length,
      });

      const response = await apiAskChat({ topic, question: trimmedQuestion });
      const answer =
        response?.data?.answer || "Не удалось получить ответ от сервера.";

      logger.info("chat_answer_received", {
        topic,
        durationMs: Date.now() - startedAt,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error) {
      logger.error("chat_request_failed", error, {
        topic,
        durationMs: Date.now() - startedAt,
      });

      const serverMessage =
        error?.response?.data?.message ||
        "Произошла ошибка при запросе к чату. Попробуйте еще раз.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: serverMessage,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
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
            onChange={(event) => setTopic(event.target.value)}
            className="min-w-[230px] rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-fg outline-none transition-[border-color] focus:border-fg"
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

        <div className="scrollbar-thin flex max-h-[calc(100vh-390px)] flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-line bg-bg p-4 max-[900px]:max-h-[420px]">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "flex max-w-[90%] flex-col gap-[7px] rounded-md px-3.5 py-3 max-[900px]:max-w-full",
                message.role === "user" &&
                  "ml-auto border-0 bg-ink [&_p]:text-white [&_span]:text-white [&_span]:opacity-65",
                message.role === "assistant" &&
                  "mr-auto border border-line bg-elevated",
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
            <div className="mr-auto flex max-w-[90%] flex-col gap-[7px] rounded-md border border-line bg-elevated px-3.5 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-fg-muted">
                Ассистент
              </span>
              <p className="m-0 whitespace-pre-wrap text-sm leading-snug text-fg">
                Думаю над ответом...
              </p>
            </div>
          )}
        </div>

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
          <textarea
            placeholder="Например: Сколько сотрудников в компании и на каких этажах больше всего людей?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="box-border min-h-24 max-h-[220px] w-full resize-y rounded-md border border-line bg-bg p-3.5 text-sm leading-normal text-fg outline-none transition-[border-color,box-shadow] focus:border-fg focus:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
          />
          <Button
            type="submit"
            disabled={loading || !question.trim()}
            className="min-w-[140px] self-end max-[900px]:w-full"
          >
            {loading ? "Отправка..." : "Отправить"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chat;