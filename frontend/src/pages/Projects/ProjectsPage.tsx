import type { Project } from "../../types/project"; //import types as long as projects are stored in frontend
import styles from "./ProjectsPage.module.css";

import portfolioCover from "../../assets/projects/portfolio-cover.png";
import portfolioCode from "../../assets/projects/portfolio-code.png"; //import assets
import { ProjectCard } from "../../components/Projects/ProjectCard/ProjectCard";
import { ProjectModal } from "../../components/Projects/ProjectModal/ProjectModal";
import { useState } from "react";


//provisorische projekte
const projects: Project[] = [
  {
    id: 1,
    title: "Portfolio Website",
    shortDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    longDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?",
    period: "Juli 2026 - August 2026",
    tags: ["React", "TypeScript", "Web"],
    coverMedia: {
      type: "image",
      src: portfolioCover,
    },
    media: [
      {
        type: "image",
        src: portfolioCode,
      },
      {
        type: "image",
        src: portfolioCover,
      },
    ],
    links: [
      {
        type: "website",
        label: "Website",
        href: "https://github.com/",
      },
      {
        type: "github",
        label: "Source",
        href: "https://github.com/",
      },
      {
        type: "document",
        label: "Abstract",
        href: "/projects/portfolio-abstract.pdf",
      },
    ],
  },

  {
    id: 2,
    title: "Portfolio Website 2",
    shortDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    longDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?",
    period: "Juli 2026 - August 2026",
    tags: ["React", "TypeScript", "Web"],
    coverMedia: {
      type: "image",
      src: portfolioCode,
    },
    media: [
      {
        type: "image",
        src: portfolioCover,
      },
      {
        type: "image",
        src: portfolioCover,
      },
    ],
    links: [
      {
        type: "website",
        label: "Website",
        href: "https://github.com/",
      },
      {
        type: "github",
        label: "Source",
        href: "https://github.com/",
      },
      {
        type: "document",
        label: "Abstract",
        href: "/projects/portfolio-abstract.pdf",
      },
    ],
  },
];


export function ProjectsPage() {

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  return (
    <section>
        <h1 className={styles.title}>meine Projekte</h1>
        
        <div className={styles.projectGrid}>
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => setSelectedProject(project)} />
            ))}
        </div>

        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
    </section>
  );
}
