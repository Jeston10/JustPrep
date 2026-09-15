"use server";

import { cookies } from "next/headers";

import { auth, db } from "@/firebase/admin";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

/** Subset of the Firestore user document used by the login-streak helpers. */
type StoredUser = Omit<User, "id">;

const readUser = async (userId: string): Promise<StoredUser | undefined> => {
  const snapshot = await db.collection("users").doc(userId).get();
  return snapshot.data() as StoredUser | undefined;
};

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: unknown) {
    // Handle Firebase specific errors
    if (typeof error === "object" && error !== null && "code" in error) {
      if ((error as { code?: string }).code === "auth/email-already-exists") {
        return {
          success: false,
          message: "This email is already in use",
        };
      }
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    // Throws if the user does not exist.
    const userRecord = await auth.getUserByEmail(email);

    await setSessionCookie(idToken);

    // Track daily login
    await recordDailyLogin(userRecord.uid);

    return { success: true, message: "Signed in." };
  } catch {
    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    const userRecord = await db.collection("users").doc(decodedClaims.uid).get();
    if (!userRecord.exists) return null;

    return {
      ...(userRecord.data() as StoredUser),
      id: userRecord.id,
    };
  } catch {
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

// Record daily login for streak tracking
export async function recordDailyLogin(userId: string) {
  try {
    const today = todayIsoDate();
    const userRef = db.collection("users").doc(userId);

    const userData = await readUser(userId);

    // Initialize or update daily login tracking
    const dailyLogins: Record<string, boolean> = userData?.dailyLogins ?? {};
    const lastLoginDate = userData?.lastLoginDate;

    // Only record if it's a new day
    if (lastLoginDate !== today) {
      dailyLogins[today] = true;

      // Calculate new streak
      const newStreak = calculateLoginStreak(dailyLogins, today);

      await userRef.update({
        dailyLogins,
        lastLoginDate: today,
        loginStreak: newStreak,
      });
    }
  } catch {
    // Streak tracking is best-effort; never block sign-in on it.
  }
}

const todayIsoDate = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Calculate current login streak
function calculateLoginStreak(dailyLogins: Record<string, boolean>, today: string): number {
  let streak = 0;
  const currentDate = new Date(today);

  // Check consecutive days backwards from today
  while (dailyLogins[currentDate.toISOString().slice(0, 10)]) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// Check if user has logged in today
export async function hasLoggedInToday(userId: string): Promise<boolean> {
  try {
    const userData = await readUser(userId);
    return userData?.lastLoginDate === todayIsoDate();
  } catch {
    return false;
  }
}

// Get user's login streak
export async function getUserLoginStreak(userId: string): Promise<number> {
  try {
    const userData = await readUser(userId);
    return userData?.loginStreak ?? 0;
  } catch {
    return 0;
  }
}
