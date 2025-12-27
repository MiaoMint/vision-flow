import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProjectList } from "@/components/project-list";
import { CanvasView } from "@/components/canvas-view";
import { AppSidebar } from "@/components/app-sidebar";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  image: string;
}

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return (
      <div className="h-screen">
        <CanvasView
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onBack={handleBackToProjects}
        />
      </div>
    );
  }

  return (
    <div className="relative bg-sidebar">
      <div
        className="fixed top-0 left-0 h-15 w-full z-50"
        style={{ "--wails-draggable": "drag" } as React.CSSProperties}
      ></div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="m-2 rounded-2xl shadow z-10 border border-border/10">
          <ProjectList onProjectClick={handleProjectClick} />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
