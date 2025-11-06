"use client";

import { useState } from "react";
import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionSection,
} from "@/components/common/motion-wrapper";
import BgGradient from "@/components/common/bg-gradient";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AnimatedContent from "@/components/bits/AnimatedContent";
import {
  containerVariants,
  itemsVariants,
  buttonVariants,
} from "@/utils/constants";

// Contact Information
const contactInfo = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email Us",
    value: "jurisdraft-noreply@gmail.com",
    description: "We'll respond within 24 hours",
    gradient: "from-rose-500 to-pink-500",
    href: "mailto:jurisdraft-noreply@gmail.com",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Call Us",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri from 9am to 6pm",
    gradient: "from-red-500 to-rose-500",
    href: "tel:+15551234567",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Visit Us",
    value: "Mumbai, Maharashtra",
    description: "India",
    gradient: "from-pink-500 to-red-500",
    href: null,
  },
];

// FAQ Items
const faqs = [
  {
    question: "How quickly can I get a response?",
    answer:
      "We typically respond to all inquiries within 24 hours during business days.",
  },
  {
    question: "What should I include in my message?",
    answer:
      "Please provide as much detail as possible about your inquiry, including your use case and any specific requirements.",
  },
  {
    question: "Do you offer technical support?",
    answer:
      "Yes! We provide comprehensive technical support for all our users. Premium users get priority support.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create mailto link with pre-filled data
    const mailtoLink = `mailto:jurisdraft-noreply@gmail.com?subject=${encodeURIComponent(
      formData.subject || "Inquiry from " + formData.name
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;

    // Open email client
    window.location.href = mailtoLink;

    // Optional: Clear form after a brief delay
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    }, 1000);
  };

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
            <MessageSquare className="size-6 text-rose-600" />
            <p className="text-base text-rose-600 font-semibold">
              We&apos;re Here to Help
            </p>
          </Badge>
        </MotionDiv>

        {/* Main Heading */}
        <MotionH1
          variants={itemsVariants}
          className="font-bold mb-6 sm:mb-8 text-center text-4xl sm:text-5xl lg:text-6xl text-gray-900 px-4 leading-tight"
        >
          Get in{" "}
          <span className="relative inline-block">
            <span className="relative z-10 px-2">Touch</span>
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
          Have a question or need assistance? We&apos;re here to help you with
          all your legal document needs.
        </MotionH2>
      </MotionSection>

      {/* Contact Information Cards */}
      <section className="relative py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {contactInfo.map((info, index) => (
              <AnimatedContent
                key={index}
                distance={50}
                direction="vertical"
                delay={index * 0.1}
              >
                <Card className="border-rose-100 bg-white/80 backdrop-blur-sm hover:border-rose-300 transition-all duration-300 hover:shadow-lg group h-full">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div
                        className={`p-4 rounded-2xl bg-linear-to-br ${info.gradient}/10 group-hover:${info.gradient}/20 transition-colors`}
                      >
                        <div className={`text-rose-600`}>{info.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {info.title}
                        </h3>
                        {info.href ? (
                          <a
                            href={info.href}
                            className={`text-lg font-semibold bg-linear-to-r ${info.gradient} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p
                            className={`text-lg font-semibold bg-linear-to-r ${info.gradient} bg-clip-text text-transparent`}
                          >
                            {info.value}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          {info.description}
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

      {/* Main Content - Form and Info */}
      <section className="relative bg-gray-50 py-16 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-br from-rose-500 via-red-500 to-pink-500 opacity-20 sm:left-[calc(50%+36rem)] sm:w-288.75"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.8% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <AnimatedContent
                distance={50}
                direction="horizontal"
                reverse={false}
              >
                <Card className="border-rose-200 bg-white/90 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-8 lg:p-12">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 rounded-xl bg-linear-to-br from-rose-500/10 to-transparent">
                        <MessageSquare className="h-8 w-8 text-rose-600" />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900">
                        Send us a Message
                      </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label
                            htmlFor="name"
                            className="text-sm font-semibold text-gray-700"
                          >
                            Your Name *
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            className="border-rose-200 focus:border-rose-500 focus:ring-rose-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="email"
                            className="text-sm font-semibold text-gray-700"
                          >
                            Email Address *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="john@example.com"
                            className="border-rose-200 focus:border-rose-500 focus:ring-rose-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="subject"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Subject *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="How can we help you?"
                          className="border-rose-200 focus:border-rose-500 focus:ring-rose-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Message *
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Tell us more about your inquiry..."
                          rows={6}
                          className="border-rose-200 focus:border-rose-500 focus:ring-rose-500 resize-none"
                        />
                      </div>

                      <MotionDiv whileHover={buttonVariants} className="w-full">
                        <Button
                          type="submit"
                          className="w-full text-white text-lg rounded-xl px-8 py-6 bg-linear-to-r from-slate-900 to-rose-900 hover:from-rose-500 hover:to-slate-900 font-bold shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                          Send Message
                        </Button>
                      </MotionDiv>

                      <p className="text-sm text-gray-500 text-center">
                        By submitting this form, your email client will open
                        with the pre-filled information
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </AnimatedContent>
            </div>

            {/* Side Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Hours */}
              <AnimatedContent
                distance={50}
                direction="horizontal"
                reverse={true}
              >
                <Card className="border-rose-100 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-linear-to-br from-rose-500/10 to-transparent">
                        <Clock className="h-6 w-6 text-rose-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-4">
                          Business Hours
                        </h4>
                        <div className="space-y-3 text-gray-600">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Monday - Friday</span>
                            <span>9:00 AM - 6:00 PM</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Saturday</span>
                            <span>10:00 AM - 4:00 PM</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Sunday</span>
                            <span>Closed</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                          *All times are in IST (Indian Standard Time)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContent>

              {/* Quick FAQs */}
              <AnimatedContent
                distance={50}
                direction="horizontal"
                reverse={true}
                delay={0.2}
              >
                <Card className="border-rose-100 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-linear-to-br from-pink-500/10 to-transparent">
                        <CheckCircle2 className="h-6 w-6 text-pink-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Quick FAQs
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-rose-200 pl-4"
                        >
                          <p className="font-semibold text-gray-900 mb-2">
                            {faq.question}
                          </p>
                          <p className="text-sm text-gray-600">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContent>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Support Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent distance={40} direction="vertical">
            <Card className="border-rose-200 bg-white/90 backdrop-blur-sm shadow-xl">
              <CardContent className="p-10 lg:p-16 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-linear-to-br from-rose-500/10 to-pink-500/10">
                    <Mail className="h-12 w-12 text-rose-600" />
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Need Immediate Assistance?
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                  For urgent inquiries or technical support, please don&apos;t
                  hesitate to reach out directly. Our team is committed to
                  providing you with prompt and professional assistance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <MotionDiv whileHover={buttonVariants}>
                    <Button
                      asChild
                      className="text-white text-lg rounded-xl px-8 py-6 bg-linear-to-r from-slate-900 to-rose-900 hover:from-rose-500 hover:to-slate-900 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <a href="mailto:jurisdraft-noreply@gmail.com">
                        <Mail className="mr-2 h-5 w-5" />
                        Email Us Directly
                      </a>
                    </Button>
                  </MotionDiv>
                  <MotionDiv whileHover={buttonVariants}>
                    <Button
                      asChild
                      variant="outline"
                      className="text-rose-600 border-2 border-rose-600 text-lg rounded-xl px-8 py-6 font-bold hover:bg-rose-50 transition-all duration-300"
                    >
                      <a href="tel:+15551234567">
                        <Phone className="mr-2 h-5 w-5" />
                        Call Us Now
                      </a>
                    </Button>
                  </MotionDiv>
                </div>
              </CardContent>
            </Card>
          </AnimatedContent>
        </div>
      </section>
    </div>
  );
}
