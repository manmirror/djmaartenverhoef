import { defineField, defineType } from "sanity";

export const track = defineType({
  name: "track",
  title: "Muziektrack",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: 'Titel (bv. "SoundCloud — Zomerset 2026")',
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dotColor",
      title: "Kleur bolletje",
      type: "string",
      options: {
        list: [
          { title: "Roze", value: "var(--pink)" },
          { title: "Paars", value: "var(--violet)" },
          { title: "Oranje", value: "var(--orange)" },
        ],
      },
      initialValue: "var(--pink)",
    }),
    defineField({
      name: "audioFile",
      title: "Audiobestand",
      type: "file",
      options: { accept: "audio/*" },
      description: "Upload een mp3/wav om een echte afspeelbalk te tonen onder de golfvorm.",
    }),
    defineField({
      name: "externalUrl",
      title: "Of: link naar SoundCloud/Spotify",
      type: "url",
    }),
    defineField({ name: "order", title: "Volgorde", type: "number" }),
  ],
  orderings: [
    { title: "Volgorde", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "title" } },
});
