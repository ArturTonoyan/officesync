import { useMemo, useState } from "react";
import styles from "./Chat.module.scss";
import { apiAskChat } from "../../../api/apirequests";

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

    const userMessage = { role: "user", content: trimmedQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await apiAskChat({ topic, question: trimmedQuestion });
      const answer =
        response?.data?.answer || "Не удалось получить ответ от сервера.";

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error) {
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
    <div className={styles.Chat}>
      <h1>AI-чат по данным компании</h1>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <label htmlFor="topic">Тема:</label>
          <select
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            {TOPICS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className={styles.currentTopic}>Выбрано: {topicTitle}</div>
        </div>

        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`${styles.message} ${
                message.role === "user" ? styles.user : styles.assistant
              } ${message.isError ? styles.error : ""}`}
            >
              <span className={styles.role}>
                {message.role === "user" ? "Вы" : "Ассистент"}
              </span>
              <p>{message.content}</p>
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <span className={styles.role}>Ассистент</span>
              <p>Думаю над ответом...</p>
            </div>
          )}
        </div>

        <form className={styles.inputBox} onSubmit={handleSubmit}>
          <textarea
            placeholder="Например: Сколько сотрудников в компании и на каких этажах больше всего людей?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button type="submit" disabled={loading || !question.trim()}>
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
