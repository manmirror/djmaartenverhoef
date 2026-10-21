"use client";

export default function PrintKnop() {
  return (
    <button type="button" className="qr-knop" onClick={() => window.print()}>
      Print deze poster
    </button>
  );
}
