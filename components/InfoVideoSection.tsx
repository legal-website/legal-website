"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { motion } from "framer-motion";

export default function InfoVideoSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("info-video-section");
      if (section) {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (sectionTop < windowHeight - 100) {
          setAnimate(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeInVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  };

  const slideFromLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  };

  const slideFromRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  };

  return (
    <section id="info-video-section" className="py-0 bg-white px-[13%]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          variants={fadeInVariants}
          className="text-[40px] font-medium font-['Montserrat'] text-center mb-10"
        >
          What you should know about
          <br />
          Starting an LLC
        </motion.h2>

        <div className="bg-white p-10 rounded-3xl shadow-[0px_2px_5px_rgba(0,0,0,0.1)] border border-gray-200">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial="hidden"
              animate={animate ? "visible" : "hidden"}
              variants={slideFromLeft}
            >
              <p className="text-gray-700 text-[17px] font-['Nethead'] mb-4">
                To form an LLC you&apos;ll need to file articles of organization with the state.
                <span className="underline decoration-[#22c984]">
                  Each state has its own rules, but our experience across all states helps us keep things moving
                </span>
                when we file on your behalf.
              </p>
              <p className="text-gray-600">
                Here are a few things you&apos;ll need to keep in mind to get your LLC up and running.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              animate={animate ? "visible" : "hidden"}
              variants={slideFromRight}
              className="relative"
            >
              <div
                className="aspect-[16/9] relative rounded-md overflow-hidden cursor-pointer w-3/4 mx-auto"
                onClick={() => setIsOpen(true)}
              >
                <Image src="/video.webp" alt="Video thumbnail" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-black bg-opacity-75 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-transparent p-6 rounded-2xl max-w-2xl w-full relative shadow-none border-none">
            <button
              className="absolute top-2 right-2 text-gray-700 hover:text-black"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative aspect-video">
              <iframe
                className="w-full h-full rounded-2xl"
                src="https://www.youtube.com/embed/dWT6P2asa8Y"
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
