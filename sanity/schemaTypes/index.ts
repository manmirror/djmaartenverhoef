import type { SchemaTypeDefinition } from "sanity";

import { mediaItem } from "./mediaItem";
import { siteSettings } from "./siteSettings";
import { track } from "./track";
import { venue } from "./venue";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [siteSettings, venue, mediaItem, track],
};
