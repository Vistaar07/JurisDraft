// Type definitions for Clerk user metadata
export interface UserPublicMetadata {
  plan?: "Free" | "Basic" | "Pro";
  priceId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}

declare module "@clerk/nextjs" {
  interface UserPublicMetadata {
    plan?: "Free" | "Basic" | "Pro";
    priceId?: string | null;
    subscriptionId?: string | null;
    customerId?: string | null;
  }
}
