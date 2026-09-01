import createImageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { dataset, isSanityConfigured, projectId } from "../env";

const builder = isSanityConfigured
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function urlFor(source: SanityImageSource) {
  return builder ? builder.image(source) : null;
}
