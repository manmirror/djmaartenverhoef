import { defineField, defineType } from "sanity";

export const venue = defineType({
  name: "venue",
  title: "Vaste locatie",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Naam",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "order", title: "Volgorde", type: "number" }),
  ],
  orderings: [
    { title: "Volgorde", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "name" } },
});
