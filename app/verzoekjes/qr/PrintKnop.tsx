"use client";

export default function PrintKnop({ label = "Print deze poster" }: { label?: string }) {
  return (
    <button type="button" className="qr-knop" onClick={() => window.print()}>
      {label}
    </button>
  );
}
