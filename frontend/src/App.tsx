import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ProjectList } from "@/components/project-list";
import { CanvasView } from "@/components/canvas-view";
import { NavUser } from "@/components/nav-user";
import { Home, Settings } from "lucide-react";
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
    <div className="relative">
      <div
        className="fixed top-0 left-0 h-15 w-full z-50"
        style={{ "--wails-draggable": "drag" } as React.CSSProperties}
      ></div>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="px-2 mt-8">
              <h2 className="text-xl font-bold">Firebringer</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>菜单</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <Home />
                      <span>项目</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings />
                      <span>设置</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <NavUser
              user={{
                name: "用户名",
                email: "user@example.com",
                avatar: "https://placehold.co/100x100/6366f1/ffffff?text=U",
              }}
            />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <ProjectList onProjectClick={handleProjectClick} />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
