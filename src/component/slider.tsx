"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import slide1 from "@/assets/silder.png"; // 👈 Your uploaded image
import slide2 from "@/assets/silder1.png";   // 👈 Example second image (replace later)
import slide3 from "@/assets/silder2.png";   // 👈 Example third image (replace later)
import { useRouter } from "next/navigation";

const slides = [
  {
    image: slide1,
    title: "RUN ON AIR",
    subtitle: "DO IT NOW.",
    description: "Running Shoes",
    button: "DISCOVER",
  },
  {
    image: slide2,
    title: "STYLE & COMFORT",
    subtitle: "NEW COLLECTION",
    description: "Women’s Fashion Accessories",
    button: "DISCOVER",
  },
  {
    image: slide3,
    title: "STEP INTO POWER",
    subtitle: "FEEL THE SPEED",
    description: "Smart Gadgets for Smart People",
    button: "DISCOVER",
  },
];

export default function Slider() {
  const [current, setCurrent] = useState(0);
  const router = useRouter()

  // Auto slide every 3 sec
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

 

  return (
    <div className="relative w-full min-h-[85vh] md:min-h-[88vh] mt-16 overflow-hidden bg-[#07090e] text-white">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0 flex justify-center items-center"
        >
          <Image
            src={slides[current].image}
            alt={slides[current].title}
            fill
            priority
            className="object-cover opacity-60"
          />

          {/* Deep Multi-stop Vignette Overlay for High Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-black/40" />

          {/* Overlay content */}
          <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-12 md:px-16 flex flex-col items-start justify-center">
            {/* Pill Badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-4 text-xs font-semibold tracking-wider text-blue-300 uppercase shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {slides[current].subtitle}
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 max-w-2xl text-white drop-shadow-md leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {slides[current].description}
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-2xl text-gray-300 font-light mb-8 tracking-wide drop-shadow"
            >
              {slides[current].title}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(59,130,246,0.6)" }}
                whileTap={{ scale: 0.96 }}
                className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer"
                onClick={() => router.push("/category")}
              >
                <span>{slides[current].button}</span>
                <span className="text-lg">→</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/20 backdrop-blur-md transition-all duration-300 cursor-pointer"
                onClick={() => router.push("/shop")}
              >
                Explore Shops
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Dots Indicator */}
      <div className="absolute bottom-8 left-8 md:left-16 z-20 flex items-center gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              index === current
                ? "w-8 h-2.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Thumbnail navigation */}
      <div className="absolute bottom-6 right-6 md:right-12 z-20 hidden sm:flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
        {slides.map((slide, index) => (
          <motion.div
            key={index}
            onClick={() => setCurrent(index)}
            whileHover={{ scale: 1.08 }}
            className={`relative w-20 h-12 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
              index === current
                ? "ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] opacity-100"
                : "opacity-60 hover:opacity-90 ring-1 ring-white/10"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
