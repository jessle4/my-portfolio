export type Category = "work" | "education" | "volunteering";

export interface ExperienceItem {
  title: string;
  organisation: string;
  period: string;
  description: string[];
  tags: string[];
}

export const categories: {
  id: Category;
  label: string;
}[] = [
  { id: "work", label: "Work Experience" },
  { id: "education", label: "Education" },
  { id: "volunteering", label: "Volunteering" },
];
