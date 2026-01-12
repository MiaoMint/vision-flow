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
import { toast } from "sonner";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useSystemInfo } from "@/hooks/use-system-info";
import { cn } from "@/lib/utils";

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
  const { _ } = useLingui();
  const { systemInfo } = useSystemInfo();

  function wip() {
    toast(_(msg`👷 Work in progress`));
  }

  return (
    <Sidebar className="border-none">
      <SidebarHeader>
        <div className={cn("px-2", systemInfo?.isMac && "mt-10")}>
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
                  <span>
                    <Trans>Projects</Trans>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "assets"}
                  onClick={() => onViewChange("assets")}
                >
                  <Image />
                  <span>
                    <Trans>Assets</Trans>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => wip()}>
                  <Telescope />
                  <span>
                    <Trans>Explore</Trans>
                  </span>
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
              <span>
                <Trans>Settings</Trans>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* <NavUser
          user={{
            name: _(msg`Username`),
            email: "user@example.com",
            avatar: "https://placehold.co/100x100/6366f1/ffffff?text=U",
          }}
        /> */}
      </SidebarFooter>
    </Sidebar>
  );
}
