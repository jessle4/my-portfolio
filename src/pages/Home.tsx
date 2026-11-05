import { motion } from "motion/react";
import MagneticButton from "../components/MagneticButton";
import TiltCard from "../components/TiltCard";

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

export default function Home() {
  return (
    <>
      <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <motion.h1
          className="text-4xl font-bold text-[#365B47] sm:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          hi, i'm jessica le ⋆˚꩜｡
        </motion.h1>

        <p className="mt-10 mb-12 text-lg text-[#6B7F70]">
          always looking to build
        </p>

        <MagneticButton href="#projects">Explore my work ↗</MagneticButton>
      </section>

      {/* Projects section */}
      <section id="projects" className="mx-auto max-w-5xl px-6 py-20">
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
    </>
  );
}
