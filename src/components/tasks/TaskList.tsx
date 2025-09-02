'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers'
import { TaskWithRelations, TaskFilters } from '@/types'
import { taskApi } from '@/lib/api'
import TaskItem from './TaskItem'
import TaskFiltersComponent from './TaskFilters'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TaskListProps {
  onCreateTask: () => void
  onEditTask: (task: TaskWithRelations) => void
  onViewTask: (task: TaskWithRelations) => void
  filters?: TaskFilters
  onFiltersChange?: (filters: TaskFilters) => void
}

export default function TaskList({
  onCreateTask,
  onEditTask,
  onViewTask,
  filters = {},
  onFiltersChange,
}: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setLoading(true)
      const tasksData = await taskApi.getTasks(filters)
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error('加载任务失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换任务完成状态
  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      setUpdating(true)
      const updatedTask = await taskApi.toggleComplete(id, completed)
      
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? updatedTask : task
        )
      )
      
      toast.success(completed ? '任务已完成' : '任务已标记为未完成')
    } catch (error) {
      console.error('Failed to toggle task:', error)
      toast.error('更新任务失败')
    } finally {
      setUpdating(false)
    }
  }

  // 删除任务
  const handleDeleteTask = async (id: string) => {
    try {
      setUpdating(true)
      await taskApi.deleteTask(id)
      setTasks(prev => prev.filter(task => task.id !== id))
      toast.success('任务已删除')
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error('删除任务失败')
    } finally {
      setUpdating(false)
    }
  }

  // 拖拽结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setTasks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      return arrayMove(items, oldIndex, newIndex)
    })

    // 更新服务器端顺序
    try {
      const reorderedTasks = arrayMove(tasks, 
        tasks.findIndex((item) => item.id === active.id),
        tasks.findIndex((item) => item.id === over.id)
      )

      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order: index
      }))

      await taskApi.reorderTasks(updates)
      toast.success('任务顺序已更新')
    } catch (error) {
      console.error('Failed to reorder tasks:', error)
      toast.error('更新任务顺序失败')
      // 恢复原始顺序
      loadTasks()
    }
  }

  // 初始加载和筛选器变化时重新加载
  useEffect(() => {
    loadTasks()
  }, [filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      {onFiltersChange && (
        <TaskFiltersComponent
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )}

      {/* 新建任务按钮 */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          任务列表 ({tasks.length})
        </h2>
        <Button onClick={onCreateTask} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          新建任务
        </Button>
      </div>

      {/* 任务列表 */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">暂无任务</div>
          <p className="text-gray-500 text-sm mb-4">
            创建你的第一个任务开始使用吧
          </p>
          <Button onClick={onCreateTask} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            新建任务
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={onEditTask}
                  onDelete={handleDeleteTask}
                  onViewDetails={onViewTask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 加载状态覆盖层 */}
      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </div>
      )}
    </div>
  )
}