import { Priority, TaskStatus, RepeatType, Task, Project, Tag, Comment, Attachment, User, Habit, HabitCheckIn, HabitFrequency } from '@prisma/client'

// 扩展的任务类型，包含关联数据
export interface TaskWithRelations extends Task {
  project?: Project | null
  parent?: Task | null
  subtasks?: Task[]
  tags?: (TaskTag & { tag: Tag })[]
  comments?: (Comment & { user: User })[]
  attachments?: Attachment[]
  _count?: {
    subtasks: number
    comments: number
    attachments: number
  }
}

export interface TaskTag {
  id: string
  taskId: string
  tagId: string
  tag: Tag
}

export interface ProjectWithCount extends Project {
  _count: {
    tasks: number
  }
}

export interface TagWithCount extends Tag {
  _count: {
    tasks: number
  }
}

// 任务创建和更新的数据类型
export interface CreateTaskData {
  title: string
  description?: string
  priority?: Priority
  status?: TaskStatus
  dueDate?: string | null
  reminderAt?: string | null
  projectId?: string | null
  parentId?: string | null
  repeatType?: RepeatType
  repeatValue?: number | null
  estimatedTime?: number | null
  tagIds?: string[]
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  completed?: boolean
  order?: number
  actualTime?: number | null
}

// 项目创建数据类型
export interface CreateProjectData {
  name: string
  description?: string
  color?: string
}

// 标签创建数据类型
export interface CreateTagData {
  name: string
  color?: string
}

// 评论创建数据类型
export interface CreateCommentData {
  content: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 筛选器类型
export interface TaskFilters {
  projectId?: string
  completed?: boolean
  priority?: Priority
  tagId?: string
  search?: string
  dueDate?: {
    from?: string
    to?: string
  }
}

// 排序选项
export type TaskSortBy = 'created' | 'updated' | 'dueDate' | 'priority' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface TaskSortOptions {
  sortBy: TaskSortBy
  order: SortOrder
}

// 优先级配置
export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#10b981',    // green-500
  MEDIUM: '#f59e0b', // amber-500
  HIGH: '#ef4444',   // red-500
  URGENT: '#dc2626'  // red-600
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急'
}

// 状态配置
export const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: '#6b7280',      // gray-500
  IN_PROGRESS: '#3b82f6', // blue-500
  DONE: '#10b981'       // green-500
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已完成'
}

// 重复类型配置
export const REPEAT_TYPE_LABELS: Record<RepeatType, string> = {
  NONE: '不重复',
  DAILY: '每日',
  WEEKLY: '每周',
  MONTHLY: '每月',
  YEARLY: '每年'
}

// 习惯相关类型
export interface HabitWithCheckIns extends Habit {
  checkIns?: HabitCheckIn[]
  _count?: {
    checkIns: number
  }
}

// 习惯创建和更新的数据类型
export interface CreateHabitData {
  name: string
  description?: string
  color?: string
  frequency?: HabitFrequency
  targetCount?: number
  estimatedTime?: number | null
}

export interface UpdateHabitData extends Partial<CreateHabitData> {
  isActive?: boolean
}

// 习惯打卡创建数据类型
export interface CreateHabitCheckInData {
  habitId: string
  duration?: number | null
  note?: string
}

// 习惯频率配置
export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  DAILY: '每日',
  WEEKLY: '每周',
  MONTHLY: '每月',
  YEARLY: '每年'
}

export const HABIT_FREQUENCY_COLORS: Record<HabitFrequency, string> = {
  DAILY: '#10b981',    // green-500
  WEEKLY: '#3b82f6',   // blue-500
  MONTHLY: '#f59e0b',  // amber-500
  YEARLY: '#ef4444'    // red-500
}

// 习惯统计类型
export interface HabitStats {
  totalCheckIns: number
  currentStreak: number
  longestStreak: number
  completionRate: number
  totalDuration: number
  averageDuration: number
}
