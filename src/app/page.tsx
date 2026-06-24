'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { TaskWithRelations, TaskFilters, TaskStats } from '@/types'
import { taskApi } from '@/lib/api'
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'
import { Toaster } from '@/components/ui/sonner'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  CheckSquare,
  Calendar,
  Inbox,
  Star,
  BarChart3,
  Settings,
  Search,
  Plus,
  Menu,
  Timer,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

const EMPTY_STATS: TaskStats = {
  total: 0,
  completed: 0,
  active: 0,
  inProgress: 0,
  overdue: 0,
  dueToday: 0,
  upcoming: 0,
  completionRate: 0,
  totalEstimatedMinutes: 0,
  totalActualMinutes: 0,
  projectCount: 0,
  tagCount: 0,
  urgentOpen: 0,
  highOpen: 0,
}

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({})
  const [activeView, setActiveView] = useState<string>('inbox')
  const [stats, setStats] = useState<TaskStats>(EMPTY_STATS)
  const [statsLoading, setStatsLoading] = useState(false)
  const [taskListRefreshKey, setTaskListRefreshKey] = useState(0)

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const statsData = await taskApi.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // 处理任务操作
  const handleCreateTask = () => {
    setSelectedTask(null)
    setShowTaskForm(true)
  }

  const handleEditTask = (task: TaskWithRelations) => {
    setSelectedTask(task)
    setShowTaskForm(true)
  }

  const handleViewTask = (task: TaskWithRelations) => {
    // TODO: 实现任务详情弹窗
    console.log('View task:', task)
  }

  const handleTaskFormSuccess = (task: TaskWithRelations) => {
    // 任务创建/更新成功后刷新统计数据和列表
    loadStats()
    setTaskListRefreshKey(prev => prev + 1)
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()

  // 预设筛选器
  const presetFilters = {
    inbox: {},
    today: { dueDate: { from: todayStart, to: todayEnd }, completed: false },
    upcoming: { completed: false },
    completed: { completed: true },
  }

  // 切换视图
  const handleViewChange = (view: string) => {
    setActiveView(view)
    setFilters(presetFilters[view as keyof typeof presetFilters] || {})
  }

  const sidebarItems = [
    {
      id: 'inbox',
      label: '收件箱',
      icon: Inbox,
      count: stats.active,
    },
    {
      id: 'today',
      label: '今天',
      icon: Calendar,
      count: stats.dueToday,
    },
    {
      id: 'upcoming',
      label: '即将到期',
      icon: Star,
      count: stats.upcoming,
    },
    {
      id: 'completed',
      label: '已完成',
      icon: CheckSquare,
      count: stats.completed,
    },
  ]

  const statCards = [
    {
      label: '总任务',
      value: stats.total,
      helper: `${stats.active} 个待处理`,
      icon: Inbox,
      iconClassName: 'bg-blue-100 text-blue-600',
      valueClassName: 'text-gray-900',
    },
    {
      label: '已完成',
      value: stats.completed,
      helper: `完成率 ${stats.completionRate}%`,
      icon: CheckSquare,
      iconClassName: 'bg-green-100 text-green-600',
      valueClassName: 'text-green-600',
    },
    {
      label: '进行中',
      value: stats.inProgress,
      helper: `${stats.urgentOpen + stats.highOpen} 个高优先级`,
      icon: TrendingUp,
      iconClassName: 'bg-orange-100 text-orange-600',
      valueClassName: 'text-orange-600',
    },
    {
      label: '逾期任务',
      value: stats.overdue,
      helper: `今天到期 ${stats.dueToday} 个`,
      icon: AlertTriangle,
      iconClassName: 'bg-red-100 text-red-600',
      valueClassName: stats.overdue > 0 ? 'text-red-600' : 'text-gray-900',
    },
    {
      label: '项目 / 标签',
      value: `${stats.projectCount}/${stats.tagCount}`,
      helper: '用于任务归类',
      icon: BarChart3,
      iconClassName: 'bg-purple-100 text-purple-600',
      valueClassName: 'text-purple-600',
    },
    {
      label: '记录时间',
      value: `${Math.round(stats.totalActualMinutes / 60)}h`,
      helper: `预计 ${Math.round(stats.totalEstimatedMinutes / 60)}h`,
      icon: Timer,
      iconClassName: 'bg-cyan-100 text-cyan-600',
      valueClassName: 'text-cyan-600',
    },
  ]

  return (
    <div className="h-screen bg-gray-50">
      <SidebarProvider>
        {/* 侧边栏 */}
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Todoist</h1>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4">
            {/* 搜索框 */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索任务..."
                  className="pl-10"
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                />
              </div>
            </div>

            {/* 新建任务按钮 */}
            <Button
              onClick={handleCreateTask}
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建任务
            </Button>

            {/* 计时器按钮 */}
            <Button
              onClick={() => window.location.href = '/timer'}
              className="w-full mb-4 bg-green-600 hover:bg-green-700"
            >
              <Timer className="h-4 w-4 mr-2" />
              任务计时器
            </Button>

            {/* 习惯管理按钮 */}
            <Button
              onClick={() => window.location.href = '/habits'}
              className="w-full mb-6 bg-purple-600 hover:bg-purple-700"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              习惯管理
            </Button>

            {/* 导航菜单 */}
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* 项目分组 */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">项目</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>个人项目</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>工作项目</span>
                </button>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">U</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">用户</p>
                <p className="text-xs text-gray-500">user@example.com</p>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* 顶部导航栏 */}
          <header className="bg-white border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SidebarTrigger>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {sidebarItems.find(item => item.id === activeView)?.label || '收件箱'}
                </h2>
                <p className="text-sm text-gray-500">
                  管理你的任务和项目{statsLoading ? ' · 统计刷新中...' : ''}
                </p>
              </div>
            </div>
          </header>

          {/* 任务列表 */}
          <main className="flex-1 p-6 overflow-auto">
            {/* 任务统计卡片 */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.label}</p>
                        <p className={`text-2xl font-bold ${card.valueClassName}`}>{card.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{card.helper}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconClassName}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <TaskList
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
              onTasksChange={loadStats}
              refreshKey={taskListRefreshKey}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </main>
        </div>

        {/* 任务表单弹窗 */}
        <TaskForm
          open={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          task={selectedTask}
          onSuccess={handleTaskFormSuccess}
        />

        {/* 通知组件 */}
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </div>
  )
}
