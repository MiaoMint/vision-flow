import { useEffect, useState } from "react";
import { database } from "../../wailsjs/go/models";
import { ListProjects, SaveProject, DeleteProject } from "../../wailsjs/go/database/Service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Plus } from "lucide-react";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

interface ProjectListProps {
  onProjectClick: (project: database.Project) => void;
}

export function ProjectList({ onProjectClick }: ProjectListProps) {
  const { _ } = useLingui();
  const [projects, setProjects] = useState<database.Project[]>([]);

  const fetchProjects = async () => {
    try {
      const list = await ListProjects();
      setProjects(list);
      console.log(list);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);


  const handleCreateProject = async () => {
    try {
      const newProject = new database.Project({
        name: _(msg`Untitled Project`),
      });
      const savedProject = await SaveProject(newProject);
      onProjectClick(savedProject);
      fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };


  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold"><Trans>Projects</Trans></h1>
        <p className="text-muted-foreground mt-2"><Trans>Manage and access all your projects</Trans></p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {/* 新建项目卡片 */}
        <div
          className="aspect-square group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all hover:shadow-lg hover:border-primary/50"
          onClick={handleCreateProject}
        >
          <div className="h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/50 min-h-50">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <span className="font-medium text-muted-foreground">
                <Trans>New Project</Trans>
              </span>
            </div>
          </div>
        </div>

        {/* 现有项目列表 */}
        {projects?.map((project) => (
          <div
            key={project.id}
            className="aspect-square group cursor-pointer overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:border-primary/50 flex flex-col relative"
            onClick={() => onProjectClick(project)}
          >
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      DeleteProject(project.id).then(() => fetchProjects());
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> <Trans>Delete</Trans>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-hidden bg-muted relative">
              {project.coverImage ? (
                <img
                  src={project.coverImage}
                  alt={project.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-muted-foreground">
                  <span className="text-sm"><Trans>No Cover</Trans></span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col">
              <h3 className="font-medium truncate text-lg">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.description}
                </p>
              )}
              <div className="mt-auto pt-2 text-xs text-muted-foreground">
                <Trans>Updated on</Trans> {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
