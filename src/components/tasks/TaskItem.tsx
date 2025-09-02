'use client'

import React from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Tag as TagIcon,
  MoreVertical,
  GripVertical
} from 'lucide-react'
import { TaskWithRelations, PRIORITY_COLORS, PRIORITY_LABELS } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: TaskWithRelations
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (task: TaskWithRelations) => void
  onDelete: (id: string) => void
  onViewDetails: (task: TaskWithRelations) => void
  isDragging?: boolean
}

export default function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewDetails,
  isDragging = false
}: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
  const priorityColor = PRIORITY_COLORS[task.priority]
  const priorityLabel = PRIORITY_LABELS[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-all duration-200',
        'hover:border-blue-200',
        task.completed && 'opacity-60',
        (isDragging || sortableIsDragging) && 'shadow-lg z-10',
        isOverdue && 'border-red-200 bg-red-50'
      )}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* 完成状态复选框 */}
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggleComplete(task.id, Boolean(checked))}
        className="flex-shrink-0"
      />

      {/* 优先级指示器 */}
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: priorityColor }}
        title={`优先级: ${priorityLabel}`}
      />

      {/* 任务内容 */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* 标题和项目 */}
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              'font-medium text-sm cursor-pointer hover:text-blue-600 transition-colors truncate',
              task.completed && 'line-through text-gray-500'
            )}
            onClick={() => onViewDetails(task)}
          >
            {task.title}
          </h3>
          {task.project && (
            <Badge
              variant="secondary"
              className="text-xs flex-shrink-0"
              style={{ color: task.project.color }}
            >
              {task.project.name}
            </Badge>
          )}
        </div>

        {/* 描述 */}
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* 元数据 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* 时间信息 */}
          {(task.actualTime || task.estimatedTime) && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                已记录: {task.actualTime || 0}分钟 / 预估: {task.estimatedTime || 0}分钟
              </span>
            </div>
          )}

          {/* 截止日期 */}
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-red-500 font-medium'
            )}>
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(task.dueDate), 'MM/dd', { locale: zhCN })}
              </span>
            </div>
          )}

          {/* 提醒时间 */}
          {task.reminderAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(task.reminderAt), 'HH:mm', { locale: zhCN })}
              </span>
            </div>
          )}

          {/* 子任务数量 */}
          {task._count && task._count.subtasks > 0 && (
            <span className="text-blue-600">
              {task._count.subtasks} 个子任务
            </span>
          )}

          {/* 评论数量 */}
          {task._count && task._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{task._count.comments}</span>
            </div>
          )}

          {/* 附件数量 */}
          {task._count && task._count.attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task._count.attachments}</span>
            </div>
          )}
        </div>

        {/* 标签 */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <TagIcon className="h-3 w-3 text-gray-400" />
            {task.tags.map((taskTag) => (
              <Badge
                key={taskTag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: taskTag.tag.color, color: taskTag.tag.color }}
              >
                {taskTag.tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 操作菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onViewDetails(task)}>
            查看详情
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(task)}>
            编辑任务
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-700"
          >
            删除任务
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
