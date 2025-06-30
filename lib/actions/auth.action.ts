"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

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
      // profileURL,
      // resumeURL,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: unknown) {
    console.error("Error creating user:", error);

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
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord)
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };

    await setSessionCookie(idToken);
    
    // Track daily login
    await recordDailyLogin(userRecord.uid);
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
  console.log("🔍 [getCurrentUser] Session Cookie:", sessionCookie);

  if (!sessionCookie) {
    console.log("❌ No session cookie found in request headers.");
    return null;
  }

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    console.log("✅ Session verified. Decoded claims:", decodedClaims);

    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      console.log("❌ User record not found in Firestore.");
      return null;
    }

    const userData = userRecord.data();
    console.log("✅ User data from Firestore:", userData);

    return {
      ...userData,
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.error("❌ Error verifying session cookie:", error);
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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const userRef = db.collection("users").doc(userId);
    
    // Get current user data
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    // Initialize or update daily login tracking
    const dailyLogins = userData?.dailyLogins || {};
    const lastLoginDate = userData?.lastLoginDate;
    
    // Only record if it's a new day
    if (lastLoginDate !== today) {
      dailyLogins[today] = true;
      
      // Calculate new streak
      const newStreak = calculateLoginStreak(dailyLogins, today);
      
      await userRef.update({
        dailyLogins,
        lastLoginDate: today,
        loginStreak: newStreak
      });
      
      console.log(`✅ Daily login recorded for user ${userId}. New streak: ${newStreak} days`);
    } else {
      console.log(`ℹ️ User ${userId} already logged in today`);
    }
  } catch (error) {
    console.error("Error recording daily login:", error);
  }
}

// Calculate current login streak
function calculateLoginStreak(dailyLogins: Record<string, boolean>, today: string): number {
  let streak = 0;
  let currentDate = new Date(today);
  
  // Check consecutive days backwards from today
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dailyLogins[dateStr]) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// Check if user has logged in today
export async function hasLoggedInToday(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log("🔍 [hasLoggedInToday] Checking for user:", userId, "on date:", today);
    
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    
    console.log("📊 [hasLoggedInToday] User data:", {
      lastLoginDate: userData?.lastLoginDate,
      loginStreak: userData?.loginStreak,
      hasDailyLogins: !!userData?.dailyLogins
    });
    
    const hasLoggedIn = userData?.lastLoginDate === today;
    console.log("✅ [hasLoggedInToday] Result:", hasLoggedIn);
    
    return hasLoggedIn;
  } catch (error) {
    console.error("❌ [hasLoggedInToday] Error:", error);
    return false;
  }
}

// Get user's login streak
export async function getUserLoginStreak(userId: string): Promise<number> {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    
    return userData?.loginStreak || 0;
  } catch (error) {
    console.error("Error getting login streak:", error);
    return 0;
  }
}

