'use client'

import React, { useState } from 'react'
import { TaskWithRelations, TaskFilters } from '@/types'
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
  Timer
} from 'lucide-react'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({})
  const [activeView, setActiveView] = useState<string>('inbox')

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
    // 任务创建/更新成功后刷新列表
    // TaskList 组件会自动重新加载数据
  }

  // 预设筛选器
  const presetFilters = {
    inbox: {},
    today: { dueDate: { from: new Date().toISOString(), to: new Date().toISOString() } },
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
      count: 0,
    },
    {
      id: 'today',
      label: '今天',
      icon: Calendar,
      count: 0,
    },
    {
      id: 'upcoming',
      label: '即将到期',
      icon: Star,
      count: 0,
    },
    {
      id: 'completed',
      label: '已完成',
      icon: CheckSquare,
      count: 0,
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
                  管理你的任务和项目
                </p>
              </div>
            </div>
          </header>

          {/* 任务列表 */}
          <main className="flex-1 p-6 overflow-auto">
            {/* 新功能：任务统计卡片 */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总任务</p>
                    <p className="text-2xl font-bold text-gray-900">10</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Inbox className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">已完成</p>
                    <p className="text-2xl font-bold text-green-600">4</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">进行中</p>
                    <p className="text-2xl font-bold text-orange-600">6</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">完成率</p>
                    <p className="text-2xl font-bold text-purple-600">40%</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <TaskList
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
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
