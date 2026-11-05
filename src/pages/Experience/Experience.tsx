import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { categories, type Category } from "./Experience.types";
import { experienceData } from "./Experience.content";

export default function Experience() {
  const [activeCategory, setActiveCategory] = useState<Category>("work");

  return (
    <section className="mx-auto max-w-4xl px-6 pt-4 py-20">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="mt-4 text-5xl font-bold tracking-tight text-[#365B47]">
          experience ⋆˚✿
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-[#6B7F70]">
          A little look at my journey so far ✦
        </p>
      </motion.div>

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="Experience categories"
        className="mt-12 flex flex-wrap gap-3"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              id={`tab-${category.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="experience-panel"
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full border px-6 py-3 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "border-[#365B47] bg-[#365B47] text-white shadow-md"
                  : "border-white/70 bg-white/40 text-[#527D60] backdrop-blur-md hover:bg-white/70"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Animated timeline */}
      <div
        id="experience-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeCategory}`}
        className="mt-12"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="relative border-l-2 border-[#B8D8BE] pl-8"
          >
            {experienceData[activeCategory].map((item, index) => (
              <motion.article
                key={`${item.title}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                }}
                className="relative mb-8 rounded-3xl border border-white/70 bg-white/45 p-7 shadow-sm backdrop-blur-xl"
              >
                {/* Timeline dot */}
                <span className="absolute -left-[43px] top-8 h-5 w-5 rounded-full border-4 border-[#B8D8BE] bg-white" />

                <p className="text-sm font-medium text-[#527D60]">
                  {item.period}
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#365B47]">
                  {item.title}
                </h2>

                <p className="mt-1 font-medium text-[#6B7F70]">
                  {item.organisation}
                </p>

                {item.description.length > 0 && (
                  <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-[#6B7F70] marker:text-[#527D60]">
                    {item.description.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                )}

                {/* Skills / tags */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#B8D8BE]/60 bg-white/50 px-3 py-1 text-xs text-[#365B47]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
