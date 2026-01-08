import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProjectList } from "@/components/project-list";
import { CanvasView } from "@/components/canvas-view";
import { AppSidebar } from "@/components/app-sidebar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { useState } from "react";
import { database } from "../wailsjs/go/models";

export default function App() {
  const [selectedProject, setSelectedProject] = useState<database.Project | null>(
    null
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleProjectClick = (project: database.Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return (
      <div className="h-screen">
        <CanvasView
          project={selectedProject}
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
        <AppSidebar onSettingsClick={() => setIsSettingsOpen(true)} />
        <SidebarInset className="m-2 rounded-2xl z-10 border">
          <ProjectList onProjectClick={handleProjectClick} />
        </SidebarInset>
      </SidebarProvider>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
