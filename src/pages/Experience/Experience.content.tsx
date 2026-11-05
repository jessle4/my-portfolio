import type { Category, ExperienceItem } from "./Experience.types";

export const experienceData: Record<Category, ExperienceItem[]> = {
  work: [
    {
      title: "Graduate Software Engineer",
      organisation: "Alinta Energy",
      period: "2026 – Present",
      description: [
        "Full Stack Developer for the Alinta SalesTool Platform which was responsible for over 40 APIs and two key platforms used throughout the business internally",
        "Contributed to the development of several new features and improvements across the platform",
        "2026 Alinta Hackathon Winner - main developer for 'The Missing Digit'.",
      ],
      tags: ["React", "TypeScript", "C#", "Azure"],
    },
    {
      title: "Software Engineering Intern",
      organisation: "Alinta Energy",
      period: "Previous experience",
      description: [
        "Interned as part of the mobile development team for three months to create new features for Alinta’s new mobile app such as adding a new payment method using SSO (single sign on)",
        "Was offered to remain on the mobile team and continued to handle both iOS and android development in a part time capacity",
      ],
      tags: ["React Native", "JavaScript", "APIs", "Agile Methodologies"],
    },
    {
      title: "Specialist",
      organisation: "Apple",
      period: "Jun 2024 – Dec 2024",
      description: [
        "Provided exceptional technical support and troubleshooting for Apple devices, demonstrating strong problem-solving skills in high-pressure situations.",
        "Played a key role in the launch of Apple Vision Pro and the iPhone 16 range, developing comprehensive product knowledge.",
      ],
      tags: ["Communication", "Problem Solving", "Technical Support"],
    },
  ],

  education: [
    {
      title: "Bachelor of Science, Computing and Software Systems",
      organisation: "The University of Melbourne",
      period: "",
      description: [],
      tags: ["Software Engineering", "Computer Science", "AI/ML"],
    },
    {
      title: "VCE High School Certificate",
      organisation: "Suzanne Cory High School",
      period: "",
      description: [
        "Chorals ensemble pianist, Relay for Life, Good Friday Appeal volunteer, Beside Buds, Ecocore",
        "Awards/Honors: Psychology and Further Mathematics ‘Rank 1’",
      ],
      tags: [],
    },
  ],

  volunteering: [
    {
      title: "Lead Front-End Developer",
      organisation: "HackMelbourne",
      period: "June 2024 – July 2025",
      description: [
        "Worked in a team of six developers to create a platform for UniMelb students to explore the campus during Winter Fest O-Week. Students would complete challenges prompted by the platform at different locations to receive rewards.",
        "Designed UI using Figma and then translated into code to produce the frontend (including BFF) of the application.",
      ],
      tags: ["React Typescript", "Node.js", "GraphQL"],
    },
    {
      title: "Student Engagement Director → Treasurer",
      organisation: "HackMelbourne",
      period: "Sep 2023 – Sep 2025",
      description: [
        "Helped organise large-scale intercollegiate hackathons, including the annual Hackiethon, bringing together over 200 participants.",
        "Served as the primary point of contact for event collaborations with external organisations before transitioning into the executive financial lead role.",
        "Became HackMelbourne's first female treasurer.",
      ],
      tags: [
        "Leadership",
        "Event Management",
        "Financial Management",
        "Community Engagement",
      ],
    },
    {
      title: "Events Officer",
      organisation: "MCCC (Members of the Chinese Cultural Community)",
      period: "Feb 2022 – Sep 2023",
      description: [
        "MCCC Hope and Hearts Charity Cocktail which featured several raffles and professional performances, raising over $2000 for the Red Cross Foundation.",
      ],
      tags: ["Event Management"],
    },
  ],
};
