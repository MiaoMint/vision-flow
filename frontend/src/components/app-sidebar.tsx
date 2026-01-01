/**
 * Input:
 *   - Sidebar UI 组件的 [Pos: shadcn/ui 侧边栏组件]
 *   - NavUser 的 [Pos: 用户信息展示组件]
 * Output: 应用侧边栏导航组件
 * Pos: 应用的主导航栏，包含菜单项和用户信息
 *
 * 一旦本文件被更新，务必更新：
 * 1. 本注释块
 * 2. frontend/src/components/README.md
 */
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
import { Home, Image, Settings } from "lucide-react";

export function AppSidebar() {
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
  );
}
