import { apiAskChat } from "../../api/apirequests";
import { createLogger } from "../../utils/logger";
import store, { type AppDispatch } from "../store";
import {
  addChatMessage,
  setChatDraft,
  setChatLoading,
} from "./chat.Slice";

const logger = createLogger("chat-request");

let activeAbortController: AbortController | null = null;

function isRequestAborted(error: unknown) {
  const err = error as { code?: string; name?: string };
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

export function isChatRequestActive() {
  return Boolean(activeAbortController);
}

export function stopChatRequest(dispatch: AppDispatch = store.dispatch) {
  activeAbortController?.abort();
  activeAbortController = null;
  dispatch(setChatLoading(false));
}

export async function sendChatRequest(
  overrideQuestion?: string,
  dispatch: AppDispatch = store.dispatch,
) {
  const { topic, draft, loading } = store.getState().chat;
  const trimmedQuestion = (overrideQuestion ?? draft).trim();

  if (!trimmedQuestion || loading || activeAbortController) {
    return;
  }

  const startedAt = Date.now();
  const abortController = new AbortController();
  activeAbortController = abortController;

  dispatch(addChatMessage({ role: "user", content: trimmedQuestion }));
  dispatch(setChatDraft(""));
  dispatch(setChatLoading(true));

  try {
    logger.info("chat_question_sent", {
      topic,
      questionLength: trimmedQuestion.length,
    });

    const response = await apiAskChat(
      { topic, question: trimmedQuestion },
      { signal: abortController.signal },
    );

    if (isRequestAborted(response)) {
      logger.info("chat_request_aborted", {
        topic,
        durationMs: Date.now() - startedAt,
      });
      dispatch(
        addChatMessage({
          role: "assistant",
          content: "Генерация остановлена.",
        }),
      );
      return;
    }

    if (response?.response || response instanceof Error) {
      throw response;
    }

    const answer =
      response?.data?.answer || "Не удалось получить ответ от сервера.";

    logger.info("chat_answer_received", {
      topic,
      durationMs: Date.now() - startedAt,
    });

    dispatch(addChatMessage({ role: "assistant", content: answer }));
  } catch (error) {
    if (isRequestAborted(error)) {
      logger.info("chat_request_aborted", {
        topic,
        durationMs: Date.now() - startedAt,
      });
      dispatch(
        addChatMessage({
          role: "assistant",
          content: "Генерация остановлена.",
        }),
      );
      return;
    }

    logger.error("chat_request_failed", error, {
      topic,
      durationMs: Date.now() - startedAt,
    });

    const serverMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ||
      "Произошла ошибка при запросе к чату. Попробуйте еще раз.";

    dispatch(
      addChatMessage({
        role: "assistant",
        content: serverMessage,
        isError: true,
      }),
    );
  } finally {
    if (activeAbortController === abortController) {
      activeAbortController = null;
    }
    dispatch(setChatLoading(false));
  }
}
