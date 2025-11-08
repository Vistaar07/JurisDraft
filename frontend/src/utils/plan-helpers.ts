/**
 * Helper functions for checking user plan status
 */

/**
 * Check if the user has an active paid plan (Basic or Pro)
 * @param plan - The user's current plan
 * @returns true if user has Basic or Pro plan
 */
export function hasActivePlan(plan: string | null | undefined): boolean {
  return plan === "Basic" || plan === "Pro";
}

/**
 * Check if the user has a Free plan or no plan
 * @param plan - The user's current plan
 * @returns true if user has Free plan or no plan
 */
export function isFreePlan(plan: string | null | undefined): boolean {
  return !plan || plan === "Free";
}
