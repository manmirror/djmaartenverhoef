import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site-teksten",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow (boven de titel)", type: "string" }),
    defineField({ name: "heroTitleLine1", title: "Hero titel — regel 1", type: "string" }),
    defineField({ name: "heroTitleLine2", title: "Hero titel — regel 2 (gekleurd)", type: "string" }),
    defineField({ name: "tagline", title: "Tagline onder de titel", type: "text", rows: 3 }),
    defineField({ name: "primaryButtonLabel", title: "Tekst primaire knop (hero)", type: "string" }),
    defineField({ name: "secondaryButtonLabel", title: "Tekst secundaire knop (hero)", type: "string" }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp-nummer",
      description: "Internationaal formaat zonder + of spaties, bv. 31621211313",
      type: "string",
    }),
    defineField({
      name: "whatsappMessage",
      title: "Vooraf ingevulde WhatsApp-tekst (contactknop)",
      type: "text",
      rows: 2,
    }),
    defineField({ name: "phoneNumber", title: "Telefoonnummer (zoals getoond)", type: "string" }),
    defineField({ name: "email", title: "E-mailadres", type: "string" }),
    defineField({ name: "sequenceHeading", title: 'Kop "Van eerste plaat tot lichten aan"', type: "string" }),
    defineField({ name: "aboutHeading", title: 'Kop "Over"-sectie', type: "string" }),
    defineField({
      name: "aboutText",
      title: 'Tekst "Over"-sectie',
      description: "Elke nieuwe regel wordt een eigen alinea.",
      type: "text",
      rows: 6,
    }),
    defineField({
      name: "aboutPhoto",
      title: 'Foto "Over"-sectie',
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "chatHeading", title: "Kop chat-sectie", type: "string" }),
    defineField({ name: "chatText", title: "Tekst chat-sectie", type: "text", rows: 3 }),
    defineField({ name: "mediaHeading", title: "Kop media-sectie", type: "string" }),
    defineField({ name: "mediaSubtext", title: "Subtekst media-sectie", type: "string" }),
    defineField({ name: "musicHeading", title: "Kop muziek-sectie", type: "string" }),
    defineField({ name: "musicSubtext", title: "Subtekst muziek-sectie", type: "string" }),
    defineField({ name: "contactHeading", title: "Kop contact-sectie", type: "string" }),
    defineField({ name: "contactText", title: "Tekst contact-sectie", type: "text", rows: 3 }),
    defineField({ name: "footerCopyright", title: "Copyright-regel (footer)", type: "string" }),
  ],
  preview: {
    prepare() {
      return { title: "Site-teksten" };
    },
  },
});
