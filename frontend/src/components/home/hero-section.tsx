import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative">
      <div className="relative min-h-screen overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl">
        <div className="absolute inset-0 z-0">
          <Image
            src="/scalefinal.jpg"
            alt="Goddess of Justice"
            fill
            className="object-center object-cover"
            priority
            quality={90}
          />
        </div>
      </div>
    </section>
  );
}
