"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type ChatMessage = { from: "them" | "me"; text: string };

type Props = {
  label: string;
  messages: ChatMessage[];
  avatarThem?: string | null;
  avatarMe?: string | null;
  avatarMeInitial?: string;
};

const FIRST_DELAY = 500; // wachten voor het eerste bericht
const STEP_DELAY = 1400; // tussen twee berichten
const HOLD_DELAY = 2600; // hele gesprek in beeld laten staan
const FADE_DURATION = 500; // uitfaden voor de herhaling
const RISE_DURATION = 420; // stapel schuift omhoog

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function ChatCard({
  label,
  messages,
  avatarThem,
  avatarMe,
  avatarMeInitial = "M",
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const [resetting, setResetting] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );

  // Bij "reduced motion" staat het hele gesprek er meteen, zonder herhaling.
  const visibleCount = reducedMotion ? messages.length : count;

  // Start het gesprek pas zodra het blok in beeld komt.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Berichten één voor één tonen, even laten staan, en dan opnieuw.
  useEffect(() => {
    if (!started || reducedMotion) return;

    let timer: number;
    if (resetting) {
      timer = window.setTimeout(() => {
        setCount(0);
        setResetting(false);
      }, FADE_DURATION);
    } else if (count < messages.length) {
      timer = window.setTimeout(
        () => setCount((c) => c + 1),
        count === 0 ? FIRST_DELAY : STEP_DELAY
      );
    } else {
      timer = window.setTimeout(() => setResetting(true), HOLD_DELAY);
    }
    return () => window.clearTimeout(timer);
  }, [started, reducedMotion, resetting, count, messages.length]);

  // De hele stapel schuift omhoog zodra er een bericht bij komt.
  useEffect(() => {
    if (visibleCount === 0 || reducedMotion) return;
    const stack = stackRef.current;
    const newest = stack?.lastElementChild as HTMLElement | null;
    if (!stack || !newest || typeof stack.animate !== "function") return;

    const rise = newest.getBoundingClientRect().height + 10; // + gap
    stack.animate(
      [{ transform: `translateY(${rise}px)` }, { transform: "translateY(0)" }],
      { duration: RISE_DURATION, easing: "cubic-bezier(.22,.61,.36,1)" }
    );
  }, [visibleCount, reducedMotion]);

  return (
    <div className="chatcard" ref={cardRef}>
      <div className="chatcard-label">{label}</div>
      <div
        className={`chat-stack${resetting ? " is-resetting" : ""}`}
        ref={stackRef}
      >
        {messages.slice(0, visibleCount).map((message, i) => {
          const avatar = message.from === "them" ? avatarThem : avatarMe;
          return (
            <div className={`chat-row ${message.from}`} key={i}>
              {avatar ? (
                <span
                  className="chat-avatar"
                  style={{ backgroundImage: `url(${avatar})` }}
                />
              ) : message.from === "them" ? (
                <span className="chat-avatar chat-avatar-them">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                  </svg>
                </span>
              ) : (
                <span className="chat-avatar chat-avatar-me">{avatarMeInitial}</span>
              )}
              <span className="chat-bubble">{message.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
