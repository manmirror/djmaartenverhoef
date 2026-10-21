// Maakt de QR-code die naar het verzoekjesformulier wijst.
//
//   node scripts/maak-qr.mjs
//
// Schrijft public/verzoekjes-qr.svg (voor printen) en public/verzoekjes-qr.png
// (handig om te delen via WhatsApp). Een ander adres meegeven mag:
//
//   node scripts/maak-qr.mjs https://djmaartenverhoef.nl/verzoekjes

import { mkdir, writeFile } from "node:fs/promises";

import QRCode from "qrcode";

const adres = process.argv[2] ?? "https://djmaartenverhoef.nl/verzoekjes";

// Hoge foutcorrectie: een geprinte code met een kreukel of een glas erop
// blijft dan nog leesbaar. Het adres is kort, dus de code blijft ruim genoeg.
const opties = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#0c0a12ff", light: "#ffffffff" },
};

await mkdir("public", { recursive: true });

const svg = await QRCode.toString(adres, { ...opties, type: "svg" });
await writeFile("public/verzoekjes-qr.svg", svg);

await QRCode.toFile("public/verzoekjes-qr.png", adres, { ...opties, width: 1400 });

console.log(`QR-code gemaakt voor ${adres}`);
console.log("  public/verzoekjes-qr.svg");
console.log("  public/verzoekjes-qr.png");
