"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

interface PronounceButtonProps {
  text: string;
  lang: "de-DE" | "ja-JP";
  className?: string;
}

/**
 * Pronunciation player utilizing the browser's native window.speechSynthesis.
 * In accordance with Phase 5.3 specifications:
 * - Uses built-in speechSynthesis with lang: "de-DE" or "ja-JP".
 * - If no voice exists on the user's OS for that language, the play button is hidden.
 */
export function PronounceButton({ text, lang, className }: PronounceButtonProps) {
  const [hasVoice, setHasVoice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setHasVoice(false);
      return;
    }

    const checkVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const prefix = lang.split("-")[0]!.toLowerCase();
      const found = voices.some((v) => v.lang.toLowerCase().startsWith(prefix));
      setHasVoice(found);
    };

    checkVoice();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = checkVoice;
    }
  }, [lang]);

  if (!hasVoice) return null;

  const handleSpeak = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // clean, steady pace for language learners
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={`Listen to pronunciation (${lang})`}
      className={
        className ??
        "inline-flex items-center gap-1 border border-[var(--line-soft)] bg-[var(--surface-sunken)] px-2 py-0.5 font-mono text-[11px] text-[var(--accent)] hover:border-[var(--accent)]"
      }
    >
      <Volume2 size={12} className="shrink-0" />
      <span>Listen</span>
    </button>
  );
}
