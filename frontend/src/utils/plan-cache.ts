// Utility functions for managing user plan in localStorage

const PLAN_STORAGE_KEY = "jurisdraft_user_plan";

export function savePlanToCache(userId: string, plan: string): void {
  if (typeof window === "undefined") return;
  const storageKey = `${PLAN_STORAGE_KEY}_${userId}`;
  localStorage.setItem(storageKey, plan);
  console.log(`[PlanCache] Saved plan "${plan}" for user ${userId}`);
}

export function getPlanFromCache(userId: string): string | null {
  if (typeof window === "undefined") return null;
  const storageKey = `${PLAN_STORAGE_KEY}_${userId}`;
  const plan = localStorage.getItem(storageKey);
  if (plan) {
    console.log(`[PlanCache] Retrieved plan "${plan}" for user ${userId}`);
  }
  return plan;
}

export function clearPlanCache(userId?: string): void {
  if (typeof window === "undefined") return;

  if (userId) {
    const storageKey = `${PLAN_STORAGE_KEY}_${userId}`;
    localStorage.removeItem(storageKey);
    console.log(`[PlanCache] Cleared plan for user ${userId}`);
  } else {
    // Clear all plan caches
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(PLAN_STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log("[PlanCache] Cleared all plan caches");
  }
}
