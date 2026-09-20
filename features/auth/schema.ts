import { z } from "zod";

// Shared by the client forms and the server actions (CODING_STANDARDS §5).
// Password policy: ≥ 8 characters (SECURITY §2.1); Firebase's own minimum is 6.
export const PASSWORD_MIN = 8;

export const SignUpFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email address").max(254),
  password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
});

export const SignInFormSchema = z.object({
  email: z.email("Enter a valid email address").max(254),
  password: z.string().min(1, "Enter your password"),
});

// Server-side inputs. Identity comes from the Firebase ID token, never from client-supplied ids.
const idToken = z.string().min(20).max(4096);

export const SignUpActionSchema = z.object({
  idToken,
  name: SignUpFormSchema.shape.name,
});

export const SignInActionSchema = z.object({ idToken });

/** Uniform result shape for legacy-style actions until next-safe-action lands in P2.1. */
export interface ActionResult {
  success: boolean;
  message: string;
}
