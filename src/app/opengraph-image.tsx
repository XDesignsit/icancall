import { DEFAULT_PREVIEW, OG_SIZE, previewImage } from "@/lib/linkPreviews";

// The link preview for every page that sets no image of its own. Links sent
// by text carry their own card instead (src/lib/linkPreviews.tsx).
export const alt = "iCanCall: one number your loved one will never forget";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return previewImage(DEFAULT_PREVIEW);
}
