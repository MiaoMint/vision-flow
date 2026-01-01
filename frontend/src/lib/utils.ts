/**
 * Input: ClassValue[] (Tailwind CSS 类名数组)
 * Output: 合并后的类名字符串
 * Pos: 样式工具函数，智能合并 Tailwind CSS 类名（解决冲突）
 *
 * 一旦本文件被更新，务必更新：
 * 1. 本注释块
 * 2. frontend/src/lib/README.md
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
