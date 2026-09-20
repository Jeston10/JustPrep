import { z } from "zod";

// Avatar is a small inline image until object storage lands (P2.6, RISKS B15). The cap keeps the
// user document well under Firestore's 1 MB limit.
const AVATAR_DATA_URL_MAX = 300_000;

export const UpdateProfileSchema = z.object({
  description: z.string().trim().max(500, "Keep the description under 500 characters"),
  photoURL: z
    .string()
    .max(AVATAR_DATA_URL_MAX, "Image is too large (max ~220 KB)")
    .refine(
      (value) =>
        value === "/profile.svg" ||
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) ||
        /^https:\/\/[^\s]+$/.test(value),
      "Unsupported image",
    ),
});
