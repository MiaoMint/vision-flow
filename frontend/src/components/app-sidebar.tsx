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
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { Home, Image, Settings, Telescope } from "lucide-react";
import { toast } from "sonner"

export type AppView = "projects" | "assets";

export function AppSidebar({
  activeView,
  onViewChange,
  onSettingsClick,
}: {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onSettingsClick: () => void;
}) {

  function wip() {
    toast("👷 Work in progress")
  }

  return (
    <Sidebar className="border-none">
      <SidebarHeader>
        <div className="px-2 mt-10">
          <h2 className="text-xl font-bold">VisionFlow</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "projects"}
                  onClick={() => onViewChange("projects")}
                >
                  <Home />
                  <span>项目</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "assets"}
                  onClick={() => onViewChange("assets")}
                >
                  <Image />
                  <span>素材库</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => wip()}>
                  <Telescope />
                  <span>浏览</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSettingsClick}>
              <Settings />
              <span>设置</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* <NavUser
          user={{
            name: "用户名",
            email: "user@example.com",
            avatar: "https://placehold.co/100x100/6366f1/ffffff?text=U",
          }}
        /> */}
      </SidebarFooter>
    </Sidebar>
  );
}
