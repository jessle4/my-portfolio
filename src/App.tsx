import { motion } from "motion/react";

export default function App() {
  return (
    <main className="min-h-screen bg-[#FFF8F5] text-[#493841]">
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

      <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 rounded-full bg-pink-100 px-5 py-2 text-sm text-pink-700">
          ✦ Software Engineer
        </span>

        <motion.h1 className="mb-6 text-5xl font-semibold tracking-tight md:text-7xl">
          hi, i'm your jessica le <span className="text-pink-400">♡</span>
        </motion.h1>

        <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#806D76]">
          I love building thoughtful, beautiful digital experiences.
        </p>

        <a
          href="#projects"
          className="rounded-full bg-[#493841] px-7 py-3 text-white transition hover:bg-[#A45573]"
        >
          Explore my work ↗
        </a>
      </section>

      <section id="about" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-4 text-3xl font-semibold">a little about me ✿</h2>
        <p className="text-[#806D76]">
          I'm a software engineer who enjoys solving problems and creating
          intuitive user experiences.
        </p>
      </section>

      <section id="projects" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-8 text-3xl font-semibold">selected work ✨</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {["Project One", "Project Two"].map((project) => (
            <article key={project} className="rounded-3xl bg-[#F9E5EA] p-8">
              <div className="mb-6 h-40 rounded-2xl bg-white/60" />
              <h3 className="text-xl font-semibold">{project}</h3>
              <p className="mt-2 text-sm text-[#806D76]">
                React · TypeScript · Tailwind CSS
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
