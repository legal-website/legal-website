"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300 && window.scrollY > lastScrollY) {
        setIsVisible(true); // Show when scrolling down
      } else {
        setIsVisible(false); // Hide when scrolling up
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 flex items-center justify-center">
      {isVisible && (
        <div className="relative flex items-center justify-center w-28 h-28">
          <motion.div
            className="absolute w-full h-full flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <path
                  id="circlePath"
                  d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                  fill="transparent"
                />
              </defs>
              <text className="text-[9px] uppercase font-semibold fill-[#22c984] tracking-wide">
                <textPath href="#circlePath" startOffset="0%">
                Click • Here • For • A • Smooth • Scroll • 
                </textPath>
              </text>
            </svg>
          </motion.div>

          <motion.button
            onClick={scrollToTop}
            className="absolute w-12 h-12 bg-[#22c984] text-white rounded-full flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp size={22} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
