import { motion } from "motion/react";

import AuroraBackground from "./components/AuroraBackground";
import TiltCard from "./components/TiltCard";
import MagneticButton from "./components/MagneticButton";

interface Project {
  title: string;
  description: string;
  tech: string;
}

const projects: Project[] = [
  {
    title: "Project One",
    description: "A thoughtfully designed digital experience.",
    tech: "React · TypeScript · Tailwind CSS",
  },
  {
    title: "Project Two",
    description: "A creative solution to an interesting problem.",
    tech: "React · TypeScript · UI/UX",
  },
];

export default function App() {
  return (
    <main className="relative min-h-screen text-[#493841]">
      {/* Animated aurora background */}
      <AuroraBackground />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a href="#" className="text-xl font-semibold">
            jessica le ♡
          </a>

          <div className="flex gap-6 text-sm">
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="mailto:hello@example.com">Contact</a>
          </div>
        </nav>

        {/* Hero section */}
        <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <span className="mb-6 rounded-full border border-white/60 bg-white/40 px-5 py-2 text-sm text-pink-700 backdrop-blur-md">
            ✦ Software Engineer
          </span>

          <motion.h1
            className="mb-5 text-4xl font-bold tracking-tight text-[#5f0f2e] sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            hi, i'm jessica le ⋆˚꩜｡
          </motion.h1>

          <p className="mb-6 max-w-xl text-lg leading-relaxed text-[#806D76]">
            always looking to build
          </p>

          <MagneticButton href="#projects">Explore my work ↗</MagneticButton>
        </section>

        {/* About section */}
        <section id="about" className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-4 text-3xl font-semibold">a little about me ✿</h2>

          <p className="max-w-2xl text-[#806D76]">
            I'm a software engineer who enjoys solving problems and creating
            intuitive user experiences.
          </p>
        </section>

        {/* Projects section */}
        <section id="projects" className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-8 text-3xl font-semibold">selected work ✨</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <TiltCard
                key={project.title}
                title={project.title}
                description={project.description}
                tech={project.tech}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-sm text-[#806D76]">
          made with ♡ by jessica le
        </footer>
      </div>
    </main>
  );
}
