"use server";

import { createSession } from "@/server/auth/session";

import { getAdminAuth, getDb } from "@/firebase/admin";

/** Subset of the Firestore user document used by the login-streak helpers. */
type StoredUser = Omit<User, "id">;

const readUser = async (userId: string): Promise<StoredUser | undefined> => {
  const snapshot = await getDb().collection("users").doc(userId).get();
  return snapshot.data() as StoredUser | undefined;
};

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    // check if user exists in db
    const userRecord = await getDb().collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await getDb().collection("users").doc(uid).set({
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
    const userRecord = await getAdminAuth().getUserByEmail(email);

    await createSession(idToken);

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

// Record daily login for streak tracking
export async function recordDailyLogin(userId: string) {
  try {
    const today = todayIsoDate();
    const userRef = getDb().collection("users").doc(userId);

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
