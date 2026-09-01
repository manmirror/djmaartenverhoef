import { defineField, defineType } from "sanity";

export const mediaItem = defineType({
  name: "mediaItem",
  title: "Media-item",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Label/titel op de tegel",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Afbeelding",
      type: "image",
      options: { hotspot: true },
      description: "Laat leeg om de kleurverloop-placeholder te tonen.",
    }),
    defineField({
      name: "gradientFrom",
      title: "Gradient kleur — start (bv. #ff2f7e)",
      type: "string",
      description: "Wordt alleen gebruikt zolang er geen afbeelding is ingesteld.",
    }),
    defineField({
      name: "gradientTo",
      title: "Gradient kleur — eind",
      type: "string",
    }),
    defineField({
      name: "tall",
      title: "Extra hoge tegel",
      type: "boolean",
      initialValue: false,
    }),
    defineField({ name: "order", title: "Volgorde", type: "number" }),
  ],
  orderings: [
    { title: "Volgorde", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "label", media: "image" } },
});
