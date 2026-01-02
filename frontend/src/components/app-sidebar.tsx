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

export function AppSidebar({ onSettingsClick }: { onSettingsClick: () => void }) {
  return (
    <Sidebar className="border-none">
      <SidebarHeader>
        <div className="px-2 mt-10">
          <h2 className="text-xl font-bold">Firebringer</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
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
                  <Image />
                  <span>素材库</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
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
