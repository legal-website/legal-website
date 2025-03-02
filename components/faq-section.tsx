"use client";

import { MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { ScrollAnimation } from "./GlobalScrollAnimation";

const faqs = [
  {
    question: "What does LLC mean?",
    answer:
      "An LLC (Limited Liability Company) is a business structure that combines the pass-through taxation of a partnership or sole proprietorship with the limited liability of a corporation.",
  },
  {
    question: "Do I need an LLC to start a business?",
    answer:
      "No, you don't necessarily need an LLC to start a business, but it provides personal liability protection and tax benefits that many business owners find valuable.",
  },
  {
    question: "LLC vs. Inc.—is an LLC a corporation?",
    answer:
      "No, an LLC is not a corporation. While both provide liability protection, they have different structures, tax treatments, and compliance requirements.",
  },
  {
    question: "LLC vs. S corp—what's the difference?",
    answer:
      "While both offer pass-through taxation, S corps have more rigid requirements for ownership and management structure compared to LLCs.",
  },
  {
    question: "Can an LLC be a nonprofit?",
    answer:
      "Yes, an LLC can be a nonprofit, but it must apply for tax-exempt status separately and meet specific IRS requirements.",
  },
  {
    question: "Can an S corporation own an LLC?",
    answer:
      "Yes, an S corporation can own an LLC, though this may affect the tax treatment and benefits of both entities.",
  },
  {
    question: "How much does it cost to form an LLC?",
    answer:
      "The cost varies by state and services needed, typically ranging from $50 to several hundred dollars in state filing fees.",
  },
  {
    question: "What's the difference between do-it-yourself and attorney-assisted LLC packages?",
    answer:
      "DIY packages provide basic formation services, while attorney-assisted packages include Orizen guidance and review of documents.",
  },
];

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ScrollAnimation>
    <section id="faqs" style={{ padding: "3%", backgroundColor: "#EAE6DF" }}>
      <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "5%", backgroundColor: "#F5F3F0", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ width: "33%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <MessageCircle style={{ width: "48px", height: "48px", color: "#4A4A4A", marginBottom: "16px" }} />
          <h2 style={{ fontSize: "40px", fontFamily: "Amy Medium", fontWeight: 600, color: "#333", lineHeight: "1.2" }}>
            Frequently
            <br />
            asked questions
          </h2>
        </div>
        <div style={{ width: "67%" }}>
          <Accordion type="single" collapsible style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "Work Sans Regular" }}>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  padding: "16px",
                  border: activeIndex === index ? "2px solid #22c984" : "2px solid transparent",
                  transition: "border-color 0.3s ease-in-out",
                }}
              >
                <AccordionTrigger style={{ textAlign: "left", textDecoration: "none", color: "#333", fontWeight: "500", fontSize: "16px" }}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent style={{ color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
    </ScrollAnimation>
  );
}