import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProjectList } from "@/components/project-list";
import { CanvasView } from "@/components/canvas-view";
import { AssetLibrary } from "@/components/asset-library";
import { AppSidebar, type AppView } from "@/components/app-sidebar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { useState, useEffect } from "react";
import { database } from "../wailsjs/go/models";
import { CheckUpdate } from "../wailsjs/go/app/Service";
import { UpdateDialog } from "@/components/update-dialog";
import { GetInitError } from "../wailsjs/go/app/Service";
import { StartupErrorScreen } from "@/components/startup/startup-error-screen";

export default function App() {
  const [selectedProject, setSelectedProject] =
    useState<database.Project | null>(null);
  const [activeView, setActiveView] = useState<AppView>("projects");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    GetInitError().then((err) => {
      if (err) {
        setInitError(err);
      }
    });

    CheckUpdate()
      .then((info) => {
        if (info.hasUpdate) {
          setUpdateInfo(info);
          setShowUpdateDialog(true);
        }
      })
      .catch(() => {
        // Silent fail for auto check
      });
  }, []);

  if (initError) {
    return <StartupErrorScreen error={initError} />;
  }

  const handleProjectClick = (project: database.Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return (
      <div className="h-screen">
        <CanvasView project={selectedProject} onBack={handleBackToProjects} />
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
        <AppSidebar
          onSettingsClick={() => setIsSettingsOpen(true)}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <SidebarInset className="m-2 rounded-2xl z-10 border bg-background overflow-hidden relative">
          {activeView === "projects" ? (
            <ProjectList onProjectClick={handleProjectClick} />
          ) : (
            <AssetLibrary />
          )}
        </SidebarInset>
      </SidebarProvider>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <UpdateDialog
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        info={updateInfo}
      />
    </div>
  );
}
