"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Verzoek } from "../types";

/** Wat een rij aan zijn sleepgreep hangt. */
export type Greep = {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

type Props = {
  verzoeken: Verzoek[];
  className?: string;
  /** Tekent één rij. De rij moet een element met `data-id={verzoek.id}` zijn. */
  rij: (verzoek: Verzoek, greep: Greep, sleept: boolean) => ReactNode;
  /** De nieuwe volgorde, van boven naar beneden, na loslaten. */
  onVolgorde: (ids: string[]) => void;
};

/** Hoe dicht bij de rand van het scherm het meescrollen begint, en hoe snel. */
const RAND_PX = 80;
const SCROLL_PX = 14;

/**
 * Een lijst die je met de greep van elke rij op volgorde sleept. Met pointer
 * events in plaats van html-slepen, want dat laatste werkt niet op een telefoon
 * of tablet. Met de pijltjestoetsen op de greep kan het ook.
 */
export default function SleepLijst({ verzoeken, className, rij, onVolgorde }: Props) {
  // Tijdens het slepen tekenen we onze eigen volgorde, zodat het verversen van
  // de lijst op de achtergrond niets door elkaar gooit.
  const [lokaal, setLokaal] = useState<string[] | null>(null);
  const [sleepId, setSleepId] = useState<string | null>(null);

  const lijstRef = useRef<HTMLUListElement>(null);
  const sleepRef = useRef<string | null>(null);
  const volgordeRef = useRef<string[]>([]);
  const beginRef = useRef<string[]>([]);
  const laatsteY = useRef(0);
  const laatsteX = useRef(0);
  const frame = useRef<number | null>(null);
  const focusNa = useRef<string | null>(null);

  const perId = new Map(verzoeken.map((verzoek) => [verzoek.id, verzoek]));
  const volgorde = lokaal
    ? // Wat er tijdens het slepen binnenkomt, komt er onderaan bij.
      [...lokaal, ...verzoeken.map((v) => v.id).filter((id) => !lokaal.includes(id))]
    : verzoeken.map((verzoek) => verzoek.id);
  const getoond = volgorde
    .map((id) => perId.get(id))
    .filter((verzoek): verzoek is Verzoek => verzoek !== undefined);

  // Na verplaatsen met het toetsenbord de greep weer focus geven: het element
  // is in de pagina verschoven en raakt daarbij de focus kwijt.
  useEffect(() => {
    const id = focusNa.current;
    if (!id) return;
    focusNa.current = null;
    lijstRef.current
      ?.querySelector<HTMLButtonElement>(`[data-id="${CSS.escape(id)}"] .bt-greep`)
      ?.focus();
  });

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  /** Zet het gesleepte verzoekje op de plek die hoort bij punt (`x`, `y`). */
  function herschik(x: number, y: number) {
    const lijst = lijstRef.current;
    const gesleept = sleepRef.current;
    if (!lijst || !gesleept) return;

    const rijen = [...lijst.querySelectorAll<HTMLElement>(":scope > [data-id]")];
    // Twee kolommen (de tablet liggend): de eerste twee staan dan naast elkaar.
    const kolommen =
      rijen.length > 1 &&
      rijen[0].getBoundingClientRect().top === rijen[1].getBoundingClientRect().top;
    const anderen = rijen
      .filter((element) => element.dataset.id !== gesleept)
      .map((element) => element.getBoundingClientRect());

    let plek = 0;
    for (const vak of anderen) {
      const voorbij = kolommen
        ? // Lezen van links naar rechts, dan naar beneden: een vak telt als
          // voorbij als je eronder zit, of ernaast rechts van het midden.
          y > vak.bottom || (y > vak.top && x > vak.left + vak.width / 2)
        : y > vak.top + vak.height / 2;
      if (voorbij) plek++;
    }

    const huidig = volgordeRef.current;
    const nieuw = huidig.filter((id) => id !== gesleept);
    nieuw.splice(plek, 0, gesleept);
    if (nieuw.join("|") !== huidig.join("|")) {
      volgordeRef.current = nieuw;
      setLokaal(nieuw);
    }
  }

  function stap() {
    const y = laatsteY.current;
    const x = laatsteX.current;
    if (y < RAND_PX) window.scrollBy(0, -SCROLL_PX);
    else if (y > window.innerHeight - RAND_PX) window.scrollBy(0, SCROLL_PX);
    herschik(x, y);
    frame.current = requestAnimationFrame(stap);
  }

  function greepVoor(verzoek: Verzoek): Greep {
    return {
      onPointerDown(event) {
        if (event.button !== 0) return;
        event.preventDefault();
        const pointer = event.pointerId;

        sleepRef.current = verzoek.id;
        beginRef.current = volgorde;
        volgordeRef.current = volgorde;
        laatsteY.current = event.clientY;
        laatsteX.current = event.clientX;
        setSleepId(verzoek.id);
        setLokaal(volgorde);
        frame.current = requestAnimationFrame(stap);

        // Luisteren op het hele venster, niet op de greep: zodra de rij in de
        // lijst verschuift, haalt de browser hem even uit de pagina, en met een
        // vinger (Android, iPad) komen de bewegingen daarna niet meer bij de
        // greep aan. Met een muis viel dat niet op.
        // Chrome op een tablet opent bij lang indrukken een menu (Downloaden,
        // Delen, Afdrukken), en dat breekt het slepen af.
        const geenMenu = (menu: Event) => menu.preventDefault();
        const beweeg = (beweging: PointerEvent) => {
          if (beweging.pointerId !== pointer) return;
          laatsteY.current = beweging.clientY;
          laatsteX.current = beweging.clientX;
        };
        const los = (einde: PointerEvent) => {
          if (einde.pointerId !== pointer) return;
          window.removeEventListener("pointermove", beweeg);
          window.removeEventListener("pointerup", los);
          window.removeEventListener("pointercancel", los);
          window.removeEventListener("contextmenu", geenMenu);
          if (frame.current !== null) cancelAnimationFrame(frame.current);
          frame.current = null;

          const eind = volgordeRef.current;
          sleepRef.current = null;
          setSleepId(null);
          setLokaal(null);
          if (eind.join("|") !== beginRef.current.join("|")) onVolgorde(eind);
        };
        window.addEventListener("pointermove", beweeg);
        window.addEventListener("pointerup", los);
        window.addEventListener("pointercancel", los);
        window.addEventListener("contextmenu", geenMenu);
      },

      // Ook als je de greep alleen even vasthoudt, zonder te schuiven.
      onContextMenu(event) {
        event.preventDefault();
      },

      onKeyDown(event) {
        const richting = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        if (!richting) return;
        event.preventDefault();
        const van = volgorde.indexOf(verzoek.id);
        const naar = van + richting;
        if (van < 0 || naar < 0 || naar >= volgorde.length) return;
        const nieuw = [...volgorde];
        nieuw.splice(van, 1);
        nieuw.splice(naar, 0, verzoek.id);
        focusNa.current = verzoek.id;
        onVolgorde(nieuw);
      },
    };
  }

  return (
    <ul ref={lijstRef} className={className}>
      {getoond.map((verzoek) => rij(verzoek, greepVoor(verzoek), verzoek.id === sleepId))}
    </ul>
  );
}
