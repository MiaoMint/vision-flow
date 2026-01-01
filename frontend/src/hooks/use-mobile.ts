/**
 * Input: 无
 * Output: 响应式的移动端检测状态
 * Pos: 响应式设计的工具 Hook，检测当前是否为移动端视图
 *
 * 一旦本文件被更新，务必更新：
 * 1. 本注释块
 * 2. frontend/src/hooks/README.md
 */
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
