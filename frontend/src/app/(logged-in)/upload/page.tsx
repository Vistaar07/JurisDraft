import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import UploadForm from "@/components/upload/upload-form";
import UploadHeader from "@/components/upload/upload-header";
// import { getPriceIdForActiveUser, hasReachedUploadLimit } from "@/lib/user";
import { containerVariants, pricingPlans } from "@/utils/constants";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const maxDuration = 60;

export default async function UploadPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/sign-in");
  }

  const userId = user.id;

  //   const { hasReachedLimit } = await hasReachedUploadLimit(userId);

  //   const userPriceId = await getPriceIdForActiveUser(
  //     user.emailAddresses[0].emailAddress
  //   );
  //   const isPro =
  //     userPriceId &&
  //     pricingPlans.find((plan) => plan.priceId === userPriceId)?.id === "pro";

  //   if (hasReachedLimit && !isPro) {
  //     redirect("/dashboard");
  //   }

  return (
    <section className="min-h-screen">
      <BgGradient />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className=" mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8"
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <UploadHeader />
          <UploadForm />
        </div>
      </MotionDiv>
    </section>
  );
}
