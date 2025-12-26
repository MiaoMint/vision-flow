import { Plus } from "lucide-react"

interface Project {
  id: string
  name: string
  image: string
}

export function ProjectList() {
  // 示例项目数据
  const projects: Project[] = [
    {
      id: "1",
      name: "示例项目 1",
      image: "https://placehold.co/600x400"
    },
    {
      id: "2",
      name: "示例项目 2",
      image: "https://placehold.co/600x400"
    },
    {
      id: "3",
      name: "示例项目 3",
      image: "https://placehold.co/600x400"
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">项目</h1>
        <p className="text-muted-foreground mt-2">管理和访问您的所有项目</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* 新建项目卡片 */}
        <div className="group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all hover:shadow-lg hover:border-primary/50">
          <div className="h-full flex items-center justify-center bg-linear-to-br from-muted to-muted/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
              <Plus className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* 现有项目列表 */}
        {projects.map((project) => (
          <div key={project.id} className="group cursor-pointer overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:border-primary/50">
            <div className="aspect-video overflow-hidden bg-muted">
              <img 
                src={project.image} 
                alt={project.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium truncate">{project.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
