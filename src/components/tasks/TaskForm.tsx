'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  TaskWithRelations,
  CreateTaskData,
  UpdateTaskData,
  Priority,
  TaskStatus,
  RepeatType,
  ProjectWithCount,
  TagWithCount
} from '@/types'
import { taskApi, projectApi, tagApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Calendar as CalendarIcon,
  Clock,
  Tag as TagIcon,
  FolderOpen,
  AlertCircle,
  Repeat,
  Plus,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// 表单验证模式
const taskSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  description: z.string().max(1000, '描述不能超过1000个字符').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  projectId: z.string().optional(),
  dueDate: z.date().optional(),
  reminderAt: z.date().optional(),
  repeatType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  repeatValue: z.number().min(1).max(365).optional(),
  tagIds: z.array(z.string()),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  open: boolean
  onClose: () => void
  task?: TaskWithRelations | null
  onSuccess?: (task: TaskWithRelations) => void
}

export default function TaskForm({ open, onClose, task, onSuccess }: TaskFormProps) {
  const [projects, setProjects] = useState<ProjectWithCount[]>([])
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 表单配置
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      projectId: undefined,
      dueDate: undefined,
      reminderAt: undefined,
      repeatType: 'NONE',
      repeatValue: undefined,
      tagIds: [],
    }
  })

  // 监听表单值
  const watchedValues = watch()

  // 加载项目和标签
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, tagsData] = await Promise.all([
          projectApi.getProjects(),
          tagApi.getTags()
        ])
        setProjects(projectsData)
        setTags(tagsData)
      } catch (error) {
        console.error('Failed to load form data:', error)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // 当任务变化时重置表单
  useEffect(() => {
    if (open) {
      if (task) {
        // 编辑模式 - 填充现有数据
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          status: task.status,
          projectId: task.projectId || undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          reminderAt: task.reminderAt ? new Date(task.reminderAt) : undefined,
          repeatType: task.repeatType,
          repeatValue: task.repeatValue || undefined,
          tagIds: task.tags?.map(t => t.tagId) || [],
        })
        // 如果有高级选项，展开面板
        if (task.dueDate || task.reminderAt || task.repeatType !== 'NONE' || task.tags?.length) {
          setShowAdvanced(true)
        }
      } else {
        // 创建模式 - 重置为默认值
        reset({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'TODO',
          projectId: undefined,
          dueDate: undefined,
          reminderAt: undefined,
          repeatType: 'NONE',
          repeatValue: undefined,
          tagIds: [],
        })
        setShowAdvanced(false)
      }
    }
  }, [open, task, reset])

  // 处理标签选择
  const handleTagToggle = (tagId: string) => {
    const currentTagIds = watchedValues.tagIds || []
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter(id => id !== tagId)
      : [...currentTagIds, tagId]
    setValue('tagIds', newTagIds, { shouldDirty: true })
  }

  // 表单提交处理
  const onSubmit = async (data: TaskFormData) => {
    try {
      setLoading(true)

      const taskData: CreateTaskData | UpdateTaskData = {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        status: data.status,
        projectId: data.projectId || null,
        dueDate: data.dueDate?.toISOString() || null,
        reminderAt: data.reminderAt?.toISOString() || null,
        repeatType: data.repeatType,
        repeatValue: data.repeatValue || null,
        tagIds: data.tagIds,
      }

      let result: TaskWithRelations

      if (task) {
        // 更新任务
        result = await taskApi.updateTask(task.id, taskData)
        toast.success('任务更新成功')
      } else {
        // 创建任务
        result = await taskApi.createTask(taskData)
        toast.success('任务创建成功')
      }

      onSuccess?.(result)
      onClose()
    } catch (error) {
      console.error('Failed to save task:', error)
      toast.error(task ? '更新任务失败' : '创建任务失败')
    } finally {
      setLoading(false)
    }
  }

  // 关闭时检查未保存更改
  const handleClose = () => {
    if (isDirty) {
      if (confirm('你有未保存的更改，确定要关闭吗？')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? '编辑任务' : '创建新任务'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            {/* 标题 */}
            <div>
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="输入任务标题..."
                className={cn(errors.title && 'border-red-500')}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="输入任务描述..."
                className="min-h-[80px]"
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* 优先级和状态 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>优先级</Label>
                <Select
                  value={watchedValues.priority}
                  onValueChange={(value: Priority) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">🟢 低</SelectItem>
                    <SelectItem value="MEDIUM">🟡 中</SelectItem>
                    <SelectItem value="HIGH">🟠 高</SelectItem>
                    <SelectItem value="URGENT">🔴 紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>状态</Label>
                <Select
                  value={watchedValues.status}
                  onValueChange={(value: TaskStatus) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">待办</SelectItem>
                    <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                    <SelectItem value="DONE">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 项目选择 */}
            <div>
              <Label>项目</Label>
              <Select
                value={watchedValues.projectId || ''}
                onValueChange={(value) => setValue('projectId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无项目</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 高级选项切换 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '收起' : '展开'} 高级选项
            </Button>
          </div>

          {/* 高级选项 */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              {/* 截止日期和提醒时间 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>截止日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !watchedValues.dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedValues.dueDate ? (
                          format(watchedValues.dueDate, 'PPP', { locale: zhCN })
                        ) : (
                          '选择日期'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchedValues.dueDate}
                        onSelect={(date) => setValue('dueDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>提醒时间</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !watchedValues.reminderAt && 'text-muted-foreground'
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {watchedValues.reminderAt ? (
                          format(watchedValues.reminderAt, 'PPP p', { locale: zhCN })
                        ) : (
                          '选择时间'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchedValues.reminderAt}
                        onSelect={(date) => setValue('reminderAt', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* 重复设置 */}
              <div>
                <Label>重复</Label>
                <div className="flex gap-2">
                  <Select
                    value={watchedValues.repeatType}
                    onValueChange={(value: RepeatType) => setValue('repeatType', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">不重复</SelectItem>
                      <SelectItem value="DAILY">每日</SelectItem>
                      <SelectItem value="WEEKLY">每周</SelectItem>
                      <SelectItem value="MONTHLY">每月</SelectItem>
                      <SelectItem value="YEARLY">每年</SelectItem>
                    </SelectContent>
                  </Select>

                  {watchedValues.repeatType !== 'NONE' && (
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="间隔"
                      className="w-20"
                      {...register('repeatValue', { valueAsNumber: true })}
                    />
                  )}
                </div>
              </div>

              {/* 标签选择 */}
              <div>
                <Label>标签</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => {
                    const isSelected = watchedValues.tagIds?.includes(tag.id) || false
                    return (
                      <Button
                        key={tag.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTagToggle(tag.id)}
                        className="flex items-center gap-1"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                        {isSelected && <X className="h-3 w-3 ml-1" />}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : (task ? '更新任务' : '创建任务')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}