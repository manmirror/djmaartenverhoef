"use client";

import { useEffect } from "react";

function buildWave(el: HTMLElement, seed: number) {
  const bars: number[] = [];
  for (let i = 0; i < 40; i++) {
    const v = 8 + Math.abs(Math.sin(i * 0.5 + seed)) * 48 + Math.random() * 10;
    bars.push(v);
  }
  el.innerHTML = bars.map((v) => `<span style="height:${v}px"></span>`).join("");
}

export default function Effects() {
  useEffect(() => {
    const wave1 = document.getElementById("wave1");
    const wave2 = document.getElementById("wave2");
    if (wave1) buildWave(wave1, 1);
    if (wave2) buildWave(wave2, 2.4);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll(".step").forEach((el) => io.observe(el));

    const chatIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            document.querySelectorAll(".bubble").forEach((b, i) => {
              setTimeout(() => b.classList.add("in"), i * 450);
            });
            chatIo.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    const phone = document.querySelector(".phone");
    if (phone) chatIo.observe(phone);

    return () => {
      io.disconnect();
      chatIo.disconnect();
    };
  }, []);

  return null;
}
