import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import { TEXT_EDIT_HINTS } from "./constants";
import type { TextEditMessage } from "./types";

type Props = {
  messages: TextEditMessage[];
  ollamaAvailable: boolean;
  applying: boolean;
  onSend: (text: string) => void;
};

function TextEditPanel({
  messages,
  ollamaAvailable,
  applying,
  onSend,
}: Props) {
  const [draft, setDraft] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || applying) return;
    onSend(text);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {!ollamaAvailable && (
        <div className="mx-4 mt-4 rounded-sm border border-[#e8c38a] bg-[#fff8eb] px-3 py-2.5 text-[12px] font-medium leading-snug text-[#7a5320]">
          Ollama недоступна — текстовые правки временно отключены. Можно править
          план мышкой в редакторе.
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="rounded-sm border border-dashed border-line px-3 py-4 text-center">
            <p className="mb-3 text-[13px] font-medium text-fg-secondary">
              Опишите правку простым текстом
            </p>
            <div className="flex flex-col gap-1.5">
              {TEXT_EDIT_HINTS.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  disabled={!ollamaAvailable || applying}
                  onClick={() => setDraft(hint)}
                  className="cursor-pointer rounded-sm border border-line bg-white px-2.5 py-2 text-left text-[12px] text-fg-secondary transition-colors hover:border-fg hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  «{hint}»
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="flex flex-col gap-2.5">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={cn(
                "max-w-[92%] rounded-sm px-3 py-2 text-[13px] leading-snug",
                msg.role === "user" && "ml-auto bg-ink text-white",
                msg.role === "assistant" && "bg-muted text-fg",
                msg.role === "system" &&
                  "mx-auto max-w-full border border-line bg-white text-center text-[12px] text-fg-muted",
              )}
            >
              {msg.text}
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={submit}
        className="shrink-0 border-t border-line bg-elevated p-4"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          disabled={!ollamaAvailable || applying}
          placeholder="Например: добавь ещё 4 стола"
          className="mb-2.5 w-full resize-none rounded-sm border border-line bg-white px-3 py-2.5 font-sans text-[13px] font-medium text-fg outline-none placeholder:font-normal placeholder:text-fg-muted focus:border-fg focus:shadow-[0_0_0_3px_rgba(17,17,17,0.06)] disabled:opacity-50"
        />
        <Button
          type="submit"
          className="h-10 w-full"
          disabled={!draft.trim() || !ollamaAvailable || applying}
        >
          {applying ? "Применение…" : "Применить правку"}
        </Button>
      </form>
    </div>
  );
}

export default TextEditPanel;
