"use client";

import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionSection,
} from "@/components/common/motion-wrapper";
import BgGradient from "@/components/common/bg-gradient";
import {
  Scale,
  Sparkles,
  Target,
  Users,
  Code2,
  Database,
  Brain,
  Server,
  Globe,
  Zap,
  Shield,
  Award,
  Heart,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AnimatedContent from "@/components/bits/AnimatedContent";
import { containerVariants, itemsVariants } from "@/utils/constants";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiPython,
  SiFastapi,
  SiGooglegemini,
  SiFramer,
} from "@icons-pack/react-simple-icons";

// Team Members Data
const teamMembers = [
  {
    name: "Ammar",
    role: "Full Stack Developer & AI Engineer",
    description:
      "Passionate about building intelligent systems that solve real-world problems. Specializes in RAG architecture and backend development.",
    icon: <Code2 className="h-6 w-6" />,
    gradient: "from-rose-500 to-pink-500",
  },
  {
    name: "Vistaar",
    role: "Full Stack Developer & UX Designer",
    description:
      "Focused on creating seamless user experiences with modern web technologies. Expertise in frontend architecture and design systems.",
    icon: <Globe className="h-6 w-6" />,
    gradient: "from-red-500 to-rose-500",
  },
  {
    name: "Shawn",
    role: "AI Researcher & Backend Developer",
    description:
      "Drives the machine learning innovations behind JurisDraft. Specializes in NLP and document processing pipelines.",
    icon: <Brain className="h-6 w-6" />,
    gradient: "from-pink-500 to-red-500",
  },
  {
    name: "Arpita",
    role: "Legal Tech Analyst & Developer",
    description:
      "Bridges the gap between legal requirements and technical implementation. Ensures accuracy in legal document generation.",
    icon: <Scale className="h-6 w-6" />,
    gradient: "from-rose-600 to-pink-600",
  },
];

// Technology Stack Data
const techStack = {
  frontend: [
    {
      name: "Next.js 16",
      icon: <SiNextdotjs className="h-8 w-8" />,
      description: "React framework for production",
    },
    {
      name: "React 19",
      icon: <SiReact className="h-8 w-8" />,
      description: "Modern UI library",
    },
    {
      name: "TypeScript",
      icon: <SiTypescript className="h-8 w-8" />,
      description: "Type-safe development",
    },
    {
      name: "Tailwind CSS",
      icon: <SiTailwindcss className="h-8 w-8" />,
      description: "Utility-first CSS framework",
    },
    {
      name: "Framer Motion",
      icon: <SiFramer className="h-8 w-8" />,
      description: "Smooth animations",
    },
    {
      name: "GSAP",
      icon: <Zap className="h-8 w-8" />,
      description: "Professional animations",
    },
  ],
  backend: [
    {
      name: "Python",
      icon: <SiPython className="h-8 w-8" />,
      description: "Core backend language",
    },
    {
      name: "FastAPI",
      icon: <SiFastapi className="h-8 w-8" />,
      description: "Modern API framework",
    },
    {
      name: "LangChain",
      icon: <Brain className="h-8 w-8" />,
      description: "LLM orchestration",
    },
    {
      name: "Google Gemini",
      icon: <SiGooglegemini className="h-8 w-8" />,
      description: "AI language model",
    },
    {
      name: "FAISS",
      icon: <Database className="h-8 w-8" />,
      description: "Vector similarity search",
    },
    {
      name: "Sentence Transformers",
      icon: <Server className="h-8 w-8" />,
      description: "Text embeddings",
    },
  ],
};

// Core Values
const values = [
  {
    icon: <Lightbulb className="h-8 w-8" />,
    title: "Innovation",
    description:
      "Pushing boundaries with cutting-edge AI to transform legal document creation",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Accuracy",
    description:
      "Ensuring precision and legal compliance in every generated document",
  },
  {
    icon: <Heart className="h-8 w-8" />,
    title: "User-Centric",
    description:
      "Designing intuitive experiences that make legal work accessible to everyone",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Excellence",
    description:
      "Committed to delivering professional-grade solutions that exceed expectations",
  },
];

export default function AboutPage() {
  return (
    <div className="relative w-full">
      {/* Hero Section */}
      <MotionSection
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl"
      >
        <BgGradient className="from-rose-500 via-red-500 to-pink-500 opacity-20" />

        {/* Badge */}
        <MotionDiv
          variants={itemsVariants}
          className="relative p-[3px] overflow-hidden mb-6 lg:mb-8 rounded-full bg-linear-to-r from-rose-200 via-rose-500 to-rose-800 animate-gradient-x group"
        >
          <Badge
            variant="secondary"
            className="relative px-6 py-2 text-base font-medium bg-white rounded-full group-hover:bg-gray-50 transition-colors duration-200"
          >
            <Users className="size-6 text-rose-600" />
            <p className="text-base text-rose-600 font-semibold">
              Meet the Team Behind JurisDraft
            </p>
          </Badge>
        </MotionDiv>

        {/* Main Heading */}
        <MotionH1
          variants={itemsVariants}
          className="font-bold mb-6 sm:mb-8 text-center text-4xl sm:text-5xl lg:text-6xl text-gray-900 px-4 leading-tight"
        >
          Revolutionizing Legal{" "}
          <span className="relative inline-block">
            <span className="relative z-10 px-2">Document Creation</span>
            <span
              className="absolute inset-0 bg-rose-200/50 -rotate-2 rounded-lg transform -skew-y-1"
              aria-hidden="true"
            />
          </span>
        </MotionH1>

        {/* Subheading */}
        <MotionH2
          variants={itemsVariants}
          className="text-lg sm:text-xl lg:text-2xl text-center px-6 lg:px-0 lg:max-w-3xl text-gray-600 mb-8 leading-relaxed"
        >
          We&apos;re a team of innovators combining legal expertise with
          cutting-edge AI to make professional document drafting accessible to
          everyone.
        </MotionH2>
      </MotionSection>

      {/* Mission & Vision Section */}
      <section className="relative bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <AnimatedContent
              distance={50}
              direction="horizontal"
              reverse={false}
            >
              <Card className="border-rose-200 bg-white/80 backdrop-blur-sm h-full">
                <CardContent className="p-8 lg:p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-linear-to-br from-rose-500/10 to-transparent">
                      <Target className="h-8 w-8 text-rose-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      Our Mission
                    </h3>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    To democratize access to professional legal document
                    creation by leveraging advanced AI technology. We believe
                    that everyone deserves high-quality legal assistance without
                    the traditional barriers of cost and complexity.
                  </p>
                </CardContent>
              </Card>
            </AnimatedContent>

            <AnimatedContent
              distance={50}
              direction="horizontal"
              reverse={true}
            >
              <Card className="border-pink-200 bg-white/80 backdrop-blur-sm h-full">
                <CardContent className="p-8 lg:p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-linear-to-br from-pink-500/10 to-transparent">
                      <Sparkles className="h-8 w-8 text-pink-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      Our Vision
                    </h3>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    To become the leading AI-powered legal drafting platform
                    globally, transforming how legal documents are created,
                    reviewed, and managed. We envision a future where legal work
                    is efficient, accurate, and accessible to all.
                  </p>
                </CardContent>
              </Card>
            </AnimatedContent>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent distance={30} direction="vertical">
            <div className="text-center mb-16">
              <h2 className="font-bold text-xl uppercase mb-4 text-rose-500">
                Our Core Values
              </h2>
              <h3 className="font-bold text-3xl lg:text-4xl max-w-2xl mx-auto text-gray-900">
                Principles That Guide Everything We Do
              </h3>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {values.map((value, index) => (
              <AnimatedContent
                key={index}
                distance={50}
                direction="vertical"
                delay={index * 0.1}
              >
                <Card className="border-rose-100 bg-white/80 backdrop-blur-sm hover:border-rose-300 transition-all duration-300 hover:shadow-lg h-full">
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-4 rounded-2xl bg-linear-to-br from-rose-500/10 to-pink-500/10">
                        <div className="text-rose-600">{value.icon}</div>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {value.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="relative bg-gray-50 py-16 lg:py-24 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl"
        >
          <div
            className="relative left-[calc(50%-20rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-br from-rose-500 via-red-500 to-pink-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.8% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent distance={30} direction="vertical">
            <div className="text-center mb-16">
              <h2 className="font-bold text-xl uppercase mb-4 text-rose-500">
                Technology Stack
              </h2>
              <h3 className="font-bold text-3xl lg:text-4xl max-w-3xl mx-auto text-gray-900">
                Built With Modern & Powerful Technologies
              </h3>
            </div>
          </AnimatedContent>

          {/* Frontend Technologies */}
          <div className="mb-16">
            <AnimatedContent distance={40} direction="vertical">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-linear-to-br from-rose-500/10 to-transparent">
                  <Globe className="h-8 w-8 text-rose-600" />
                </div>
                <h4 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Frontend
                </h4>
              </div>
            </AnimatedContent>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {techStack.frontend.map((tech, index) => (
                <AnimatedContent
                  key={index}
                  distance={50}
                  direction="vertical"
                  delay={index * 0.1}
                >
                  <Card className="border-rose-100 bg-white/90 backdrop-blur-sm hover:border-rose-300 transition-all duration-300 hover:shadow-lg hover:scale-105 h-full">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-4 rounded-2xl bg-linear-to-br from-rose-500/5 to-pink-500/5 text-rose-600">
                          {tech.icon}
                        </div>
                        <div>
                          <h5 className="text-lg font-bold text-gray-900 mb-1">
                            {tech.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {tech.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContent>
              ))}
            </div>
          </div>

          {/* Backend Technologies */}
          <div>
            <AnimatedContent distance={40} direction="vertical">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-linear-to-br from-red-500/10 to-transparent">
                  <Server className="h-8 w-8 text-red-600" />
                </div>
                <h4 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Backend & AI
                </h4>
              </div>
            </AnimatedContent>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {techStack.backend.map((tech, index) => (
                <AnimatedContent
                  key={index}
                  distance={50}
                  direction="vertical"
                  delay={index * 0.1}
                >
                  <Card className="border-red-100 bg-white/90 backdrop-blur-sm hover:border-red-300 transition-all duration-300 hover:shadow-lg hover:scale-105 h-full">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-4 rounded-2xl bg-linear-to-br from-red-500/5 to-pink-500/5 text-red-600">
                          {tech.icon}
                        </div>
                        <div>
                          <h5 className="text-lg font-bold text-gray-900 mb-1">
                            {tech.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {tech.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContent>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent distance={30} direction="vertical">
            <div className="text-center mb-16">
              <h2 className="font-bold text-xl uppercase mb-4 text-rose-500">
                Meet Our Team
              </h2>
              <h3 className="font-bold text-3xl lg:text-4xl max-w-2xl mx-auto text-gray-900">
                The Minds Behind JurisDraft
              </h3>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {teamMembers.map((member, index) => (
              <AnimatedContent
                key={index}
                distance={60}
                direction="vertical"
                delay={index * 0.15}
              >
                <Card className="border-rose-100 bg-white/80 backdrop-blur-sm hover:border-rose-300 transition-all duration-300 hover:shadow-xl group h-full">
                  <CardContent className="p-8 lg:p-10">
                    <div className="flex flex-col gap-6">
                      {/* Icon & Gradient */}
                      <div className="flex items-start justify-between">
                        <div
                          className={`p-4 rounded-2xl bg-linear-to-br ${member.gradient}/10 group-hover:${member.gradient}/20 transition-colors`}
                        >
                          <div
                            className={`bg-linear-to-br ${member.gradient} bg-clip-text text-transparent`}
                          >
                            {member.icon}
                          </div>
                        </div>
                        <div
                          className={`h-1 w-20 rounded-full bg-linear-to-r ${member.gradient} mt-8`}
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                          {member.name}
                        </h4>
                        <p
                          className={`text-lg font-semibold bg-linear-to-r ${member.gradient} bg-clip-text text-transparent mb-4`}
                        >
                          {member.role}
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          {member.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="relative bg-gray-50 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent distance={40} direction="vertical">
            <Card className="border-rose-200 bg-white/90 backdrop-blur-sm shadow-xl">
              <CardContent className="p-10 lg:p-16 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-linear-to-br from-rose-500/10 to-pink-500/10">
                    <Heart className="h-12 w-12 text-rose-600" />
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Join Us on This Journey
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  We&apos;re constantly innovating and improving JurisDraft to
                  serve you better. Whether you&apos;re a legal professional,
                  business owner, or individual seeking legal document
                  assistance, we&apos;re here to make your experience seamless
                  and efficient.
                </p>
                <p className="text-lg font-semibold bg-linear-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Let&apos;s redefine legal document creation together.
                </p>
              </CardContent>
            </Card>
          </AnimatedContent>
        </div>
      </section>
    </div>
  );
}
