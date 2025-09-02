'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  ArrowLeft, 
  Clock, 
  Timer as TimerIcon,
  CheckCircle,
  Settings,
  Edit3,
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
  ArrowUpDown,
  GripVertical,
  ChevronDown
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  estimatedTime?: number // 预估时间（分钟）
  actualTime?: number // 实际累计时间（分钟）
  priority?: 'low' | 'medium' | 'high' | 'urgent' // 优先级
  dueDate?: string // 截止时间 ISO 字符串
  order?: number // 手动排序顺序
}

// 任务数据将从数据库获取
const initialTasks: Task[] = []

type TimerMode = 'pomodoro' | 'stopwatch'
type CompletionMode = 'auto' | 'manual'
type SortMode = 'manual' | 'priority' | 'dueDate' | 'estimatedTime'

export default function TimerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 检查是否为迷你模式
  const isMiniMode = searchParams.get('mini') === 'true'
  
  // 计时器状态
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0) // 秒数
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch') // 默认正计时
  const [completionMode, setCompletionMode] = useState<CompletionMode>('manual')
  
  // 番茄钟设置
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25分钟
  const [breakTime, setBreakTime] = useState(5 * 60) // 5分钟
  const [isBreak, setIsBreak] = useState(false)
  
  // 任务状态
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  
  // 新增状态
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editEstimatedTime, setEditEstimatedTime] = useState('')
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskPriority, setEditTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent' | 'none' | ''>('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [showEstimateDialog, setShowEstimateDialog] = useState(false)
  const [showTaskEditDialog, setShowTaskEditDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const [lastReminderTime, setLastReminderTime] = useState<number>(0)
  const [completionTimeout, setCompletionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [completionCountdown, setCompletionCountdown] = useState<number>(600) // 10分钟倒计时
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent' | 'none' | ''>('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null)
  const [showFloatingTimer, setShowFloatingTimer] = useState(false)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showHabitDialog, setShowHabitDialog] = useState(false)
  const [showTaskSwitchDialog, setShowTaskSwitchDialog] = useState(false)
  const [pendingTaskIndex, setPendingTaskIndex] = useState<number | null>(null)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const currentTask = tasks[currentTaskIndex]

  // 从数据库获取任务数据
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
          const result = await response.json()
          const tasksData = result.success ? result.data : result
          if (Array.isArray(tasksData)) {
            // 转换数据格式以匹配本地Task接口
            const formattedTasks = tasksData.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              completed: task.completed,
              estimatedTime: task.estimatedTime,
              actualTime: task.actualTime,
              priority: task.priority,
              dueDate: task.dueDate,
              order: task.order
            }))
            setTasks(formattedTasks)
            
            // 设置已完成任务列表
            const completedTaskIds = formattedTasks
              .filter((task: any) => task.completed)
              .map((task: any) => task.id)
            setCompletedTasks(completedTaskIds)
          }
        }
      } catch (error) {
        console.error('获取任务数据失败:', error)
      }
    }

    fetchTasks()
  }, [])

  // 初始化迷你模式参数
  useEffect(() => {
    if (isMiniMode) {
      const taskParam = searchParams.get('task')
      const timeParam = searchParams.get('time')
      const runningParam = searchParams.get('running')
      const modeParam = searchParams.get('mode')
      
      if (taskParam) {
        const taskIndex = tasks.findIndex(task => task.title === decodeURIComponent(taskParam))
        if (taskIndex !== -1) {
          setCurrentTaskIndex(taskIndex)
        }
      }
      
      if (timeParam) {
        setTime(parseInt(timeParam) || 0)
      }
      
      if (runningParam === 'true') {
        setIsRunning(true)
      }
      
      if (modeParam) {
        setTimerMode(modeParam as TimerMode)
      }
    }
  }, [isMiniMode, searchParams])

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 格式化分钟显示
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  }

  // 编辑预估时间
  const handleEditEstimatedTime = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setEditingTaskId(taskId)
      setEditEstimatedTime(task.estimatedTime?.toString() || '')
      setShowEstimateDialog(true)
    }
  }

  // 保存预估时间
  const handleSaveEstimatedTime = async () => {
    if (editingTaskId) {
      const estimatedMinutes = parseInt(editEstimatedTime) || 0
      
      try {
        const response = await fetch(`/api/tasks/${editingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            estimatedTime: estimatedMinutes
          }),
        })

        if (response.ok) {
          setTasks(prev => prev.map(task => 
            task.id === editingTaskId 
              ? { ...task, estimatedTime: estimatedMinutes }
              : task
          ))
        }
      } catch (error) {
        console.error('保存预估时间失败:', error)
      }
      
      setShowEstimateDialog(false)
      setEditingTaskId(null)
      setEditEstimatedTime('')
    }
  }

  // 更新累计时间
  const updateActualTime = async (taskId: string, additionalMinutes: number) => {
    const currentTask = tasks.find(task => task.id === taskId)
    if (!currentTask) return
    
    const newActualTime = (currentTask.actualTime || 0) + additionalMinutes
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actualTime: newActualTime
        }),
      })

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, actualTime: newActualTime }
            : task
        ))
      }
    } catch (error) {
      console.error('更新累计时间失败:', error)
      // 如果API调用失败，仍然更新本地状态
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, actualTime: newActualTime }
          : task
      ))
    }
  }

  // 显示自动完成确认对话框
  const showAutoCompletionDialog = () => {
    setShowCompletionDialog(true)
    setCompletionCountdown(10) // 10秒倒计时
    
    // 设置10秒后自动完成
    const timeout = setTimeout(() => {
      handleAutoComplete()
    }, 10000) // 10秒
    setCompletionTimeout(timeout)
    
    // 开始倒计时更新
    const countdownInterval = setInterval(() => {
      setCompletionCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 处理自动完成
  const handleAutoComplete = () => {
    if (completionTimeout) {
      clearTimeout(completionTimeout)
      setCompletionTimeout(null)
    }
    setShowCompletionDialog(false)
    completeCurrentTask()
    moveToNextTask()
    
    // 自动开始下一个任务计时
    if (completionMode === 'auto') {
      setTimeout(() => {
        setIsRunning(true)
      }, 1000) // 1秒后自动开始
    }
  }

  // 取消自动完成
  const handleCancelAutoComplete = () => {
    if (completionTimeout) {
      clearTimeout(completionTimeout)
      setCompletionTimeout(null)
    }
    setShowCompletionDialog(false)
  }

  // 显示30分钟提醒
  const showThirtyMinuteReminder = () => {
    setShowReminderDialog(true)
    // 10秒后自动关闭提醒
    setTimeout(() => {
      setShowReminderDialog(false)
    }, 10000)
  }

  // 计时器逻辑
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = timerMode === 'pomodoro' 
            ? prevTime - 1 
            : prevTime + 1

          if (timerMode === 'pomodoro') {
            const targetTime = isBreak ? breakTime : pomodoroTime
            
            // 番茄钟倒计时结束
            if (newTime <= 0) {
              setIsRunning(false)
              
              // 更新累计时间
              if (!isBreak && currentTask) {
                const sessionMinutes = Math.floor((pomodoroTime - prevTime) / 60)
                updateActualTime(currentTask.id, sessionMinutes)
              }
              
              if (!isBreak) {
                // 工作时间结束
                if (completionMode === 'auto') {
                  showAutoCompletionDialog()
                } else {
                  setIsBreak(true)
                  setTime(breakTime)
                }
              } else {
                // 休息时间结束
                setIsBreak(false)
                if (completionMode === 'auto') {
                  moveToNextTask()
                } else {
                  setTime(pomodoroTime)
                }
              }
              
              return 0
            }
            return newTime
          } else {
            // 正计时模式
            const currentMinutes = Math.floor(newTime / 60)
            
            // 检查是否达到预估时间
            if (currentTask?.estimatedTime && currentMinutes >= currentTask.estimatedTime) {
              setIsRunning(false)
              
              // 更新累计时间
              updateActualTime(currentTask.id, currentTask.estimatedTime)
              
              if (completionMode === 'auto') {
                showAutoCompletionDialog()
              }
              
              return newTime
            }
            
            // 30分钟提醒（仅在没有预估时间时）
            if (!currentTask?.estimatedTime && currentMinutes > 0 && currentMinutes % 30 === 0) {
              const reminderKey = `${currentTask?.id}-${currentMinutes}`
              if (lastReminderTime !== currentMinutes) {
                setLastReminderTime(currentMinutes)
                showThirtyMinuteReminder()
              }
            }
            
            return newTime
          }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timerMode, isBreak, pomodoroTime, breakTime, completionMode, currentTask, lastReminderTime])

  // 开始/暂停计时
  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  // 停止计时
  const stopTimer = async () => {
    // 在停止计时前，保存已计时的时间
    if (currentTask && time > 0) {
      const elapsedMinutes = Math.floor(time / 60)
      if (elapsedMinutes > 0) {
        await updateActualTime(currentTask.id, elapsedMinutes)
      }
    }
    
    setIsRunning(false)
    if (timerMode === 'pomodoro') {
      setTime(isBreak ? breakTime : pomodoroTime)
    } else {
      setTime(0)
    }
  }

  // 完成当前任务
  const completeCurrentTask = () => {
    if (currentTask) {
      setCompletedTasks(prev => [...prev, currentTask.id])
      setTasks(prev => prev.map(task => 
        task.id === currentTask.id ? { ...task, completed: true } : task
      ))
    }
  }

  // 切换到下一个任务
  const moveToNextTask = () => {
    const nextIncompleteIndex = tasks.findIndex((task, index) => 
      index > currentTaskIndex && !completedTasks.includes(task.id)
    )
    
    if (nextIncompleteIndex !== -1) {
      setCurrentTaskIndex(nextIncompleteIndex)
    } else {
      // 没有更多未完成任务，回到第一个未完成的任务
      const firstIncompleteIndex = tasks.findIndex(task => !completedTasks.includes(task.id))
      if (firstIncompleteIndex !== -1) {
        setCurrentTaskIndex(firstIncompleteIndex)
      }
    }
    
    // 重置计时器
    if (timerMode === 'pomodoro') {
      setTime(pomodoroTime)
      setIsBreak(false)
    } else {
      setTime(0)
    }
  }

  // 手动切换任务
  const switchTask = (taskIndex: number) => {
    // 如果有任务在计时，显示确认对话框
    if (isRunning && taskIndex !== currentTaskIndex) {
      setPendingTaskIndex(taskIndex)
      setShowTaskSwitchDialog(true)
    } else {
      setCurrentTaskIndex(taskIndex)
      stopTimer()
    }
  }

  // 确认切换任务
  const handleConfirmTaskSwitch = () => {
    if (pendingTaskIndex !== null) {
      setCurrentTaskIndex(pendingTaskIndex)
      stopTimer()
      setPendingTaskIndex(null)
    }
    setShowTaskSwitchDialog(false)
  }

  // 取消切换任务
  const handleCancelTaskSwitch = () => {
    setPendingTaskIndex(null)
    setShowTaskSwitchDialog(false)
  }

  // 查看任务详情
  const handleViewTaskDetails = () => {
    if (pendingTaskIndex !== null) {
      const task = tasks[pendingTaskIndex]
      handleEditTaskDetails(task.id)
    }
    setShowTaskSwitchDialog(false)
    setPendingTaskIndex(null)
  }

  // 切换任务完成状态
  const toggleTaskCompletion = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isCompleted = completedTasks.includes(taskId)
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !isCompleted
        }),
      })

      if (response.ok) {
        if (isCompleted) {
          // 取消完成
          setCompletedTasks(prev => prev.filter(id => id !== taskId))
          setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, completed: false } : task
          ))
        } else {
          // 标记完成
          setCompletedTasks(prev => [...prev, taskId])
          setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, completed: true } : task
          ))
        }
      }
    } catch (error) {
      console.error('更新任务完成状态失败:', error)
    }
  }

  // 切换计时模式
  const switchTimerMode = (mode: TimerMode) => {
    setTimerMode(mode)
    setIsRunning(false)
    if (mode === 'pomodoro') {
      setTime(pomodoroTime)
      setIsBreak(false)
    } else {
      setTime(0)
    }
  }

  // 添加新任务
  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      const estimatedMinutes = parseInt(newTaskEstimatedTime) || undefined
      const priority = newTaskPriority === 'none' ? undefined : newTaskPriority || undefined
      const dueDate = newTaskDueDate ? `${newTaskDueDate}T23:59:59` : undefined
      
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim() || undefined,
            completed: false,
            actualTime: 0,
            estimatedTime: estimatedMinutes,
            priority: priority,
            dueDate: dueDate
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const newTask = result.success ? result.data : result
          
          setTasks(prev => [...prev, {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description,
            completed: newTask.completed,
            estimatedTime: newTask.estimatedTime,
            actualTime: newTask.actualTime,
            priority: newTask.priority,
            dueDate: newTask.dueDate,
            order: newTask.order
          }])
        }
      } catch (error) {
        console.error('添加任务失败:', error)
      }
      
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskEstimatedTime('')
      setNewTaskPriority('')
      setNewTaskDueDate('')
      setShowAddTaskDialog(false)
    }
  }

  // 编辑任务详情
  const handleEditTaskDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setEditingTaskId(taskId)
      setEditTaskTitle(task.title)
      setEditTaskDescription(task.description || '')
      setEditEstimatedTime(task.estimatedTime?.toString() || '')
      setEditTaskPriority(task.priority || 'none')
      setEditTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setShowTaskEditDialog(true)
    }
  }

  // 保存任务详情
  const handleSaveTaskDetails = async () => {
    if (editingTaskId) {
      const estimatedMinutes = parseInt(editEstimatedTime) || undefined
      const priority = editTaskPriority === 'none' ? undefined : editTaskPriority || undefined
      const dueDate = editTaskDueDate ? `${editTaskDueDate}T23:59:59` : undefined
      
      try {
        const response = await fetch(`/api/tasks/${editingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editTaskTitle.trim(),
            description: editTaskDescription.trim() || undefined,
            estimatedTime: estimatedMinutes,
            priority: priority,
            dueDate: dueDate
          }),
        })

        if (response.ok) {
          setTasks(prev => prev.map(task => 
            task.id === editingTaskId 
              ? { 
                  ...task, 
                  title: editTaskTitle.trim(),
                  description: editTaskDescription.trim() || undefined,
                  estimatedTime: estimatedMinutes,
                  priority: priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
                  dueDate: dueDate
                }
              : task
          ))
        }
      } catch (error) {
        console.error('保存任务详情失败:', error)
      }
      
      setShowTaskEditDialog(false)
      setEditingTaskId(null)
      setEditTaskTitle('')
      setEditTaskDescription('')
      setEditEstimatedTime('')
      setEditTaskPriority('')
      setEditTaskDueDate('')
    }
  }

  // 排序任务
  const sortTasks = (tasksToSort: Task[], mode: SortMode): Task[] => {
    const sorted = [...tasksToSort]
    
    switch (mode) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return sorted.sort((a, b) => {
          const aPriority = priorityOrder[a.priority || 'low']
          const bPriority = priorityOrder[b.priority || 'low']
          return bPriority - aPriority
        })
      
      case 'dueDate':
        return sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
      
      case 'estimatedTime':
        return sorted.sort((a, b) => {
          const aTime = a.estimatedTime || 0
          const bTime = b.estimatedTime || 0
          return aTime - bTime
        })
      
      case 'manual':
      default:
        return sorted.sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  }

  // DnD Kit 传感器设置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 拖拽结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // 异步更新服务器端顺序
        (async () => {
          try {
            const updates = reorderedItems.map((task, index) => ({
              id: task.id,
              order: index,
            }));

            const response = await fetch('/api/tasks/reorder', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
              // 如果请求失败，回滚到原始状态
              setTasks(items);
            }
          } catch (error) {
            console.error('更新任务顺序失败:', error);
            // 如果请求失败，回滚到原始状态
            setTasks(items);
          }
        })();
        
        setSortMode('manual');
        return reorderedItems;
      });
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  // 获取优先级文本
  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '紧急'
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '无'
    }
  }

  // 格式化截止时间
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return '已过期'
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '明天'
    return `${diffDays}天后`
  }

  // 过滤和排序任务列表
  const filteredAndSortedTasks = sortTasks(
    showCompletedTasks 
      ? tasks 
      : tasks.filter(task => !completedTasks.includes(task.id)),
    sortMode
  )

  // 迷你模式渲染
  if (isMiniMode) {
    return (
      <div className="w-full h-screen bg-white border border-gray-300 shadow-lg">
        <div className="p-2 space-y-2">
          {/* 任务选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowTaskSelector(!showTaskSelector)}
              className="w-full text-left text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors flex items-center justify-between p-1 rounded hover:bg-gray-50"
            >
              <span className="truncate">{currentTask?.title || '选择任务'}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>
            
            {showTaskSelector && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                {tasks.filter(task => !completedTasks.includes(task.id)).map((task, index) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      const originalIndex = tasks.findIndex(t => t.id === task.id)
                      setCurrentTaskIndex(originalIndex)
                      setShowTaskSelector(false)
                      // 切换任务时重置计时器
                      setTime(0)
                      setIsRunning(false)
                    }}
                    className={`w-full text-left text-xs p-2 hover:bg-gray-50 transition-colors ${
                      task.id === currentTask?.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <div className="truncate">{task.title}</div>
                    {task.estimatedTime && (
                      <div className="text-xs text-gray-500">预估 {formatMinutes(task.estimatedTime)}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 计时显示 */}
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-gray-800 mb-1">
              {formatTime(time)}
            </div>
            
            {/* 进度条 */}
            {currentTask?.estimatedTime && timerMode === 'stopwatch' && (
              <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((time / 60 / currentTask.estimatedTime) * 100, 100)}%` 
                  }}
                />
              </div>
            )}
            
            {/* 状态指示 */}
            <div className="flex items-center justify-center gap-1 mb-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-600">
                {isRunning ? '进行中' : '已暂停'}
              </span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={toggleTimer}
              className={`flex-1 h-7 text-xs ${
                isRunning 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  开始
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={stopTimer}
              className="h-7 text-xs px-2"
            >
              <Square className="h-3 w-3" />
            </Button>
          </div>

          {/* 任务信息 */}
          {currentTask && (
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>已记录: {formatMinutes(currentTask.actualTime || 0)}</span>
                <span>预估: {formatMinutes(currentTask.estimatedTime || 0)}</span>
              </div>
              {currentTask.priority && (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(currentTask.priority)}`} />
                  <span>{getPriorityText(currentTask.priority)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  )
}

// 时间统计对话框组件
function TimeStatsDialog({ 
  open, 
  onOpenChange, 
  tasks 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  tasks: Task[]
}) {
  // 计算今日统计数据
  const getTodayStats = () => {
    const today = new Date().toDateString()
    const todayTasks = tasks.filter(task => {
      // 这里可以根据任务的创建时间或更新时间来判断是否为今日任务
      // 暂时使用所有任务进行统计
      return true
    })

    const totalTasks = todayTasks.length
    const completedTasks = todayTasks.filter(task => task.completed).length
    const totalEstimatedTime = todayTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)
    const totalActualTime = todayTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0)
    
    return {
      totalTasks,
      completedTasks,
      totalEstimatedTime,
      totalActualTime,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      timeEfficiency: totalEstimatedTime > 0 ? Math.round((totalActualTime / totalEstimatedTime) * 100) : 0
    }
  }

  // 按优先级分组统计
  const getStatsByPriority = () => {
    const priorityStats: {
      [key: string]: { count: number; completed: number; actualTime: number }
    } = {
      urgent: { count: 0, completed: 0, actualTime: 0 },
      high: { count: 0, completed: 0, actualTime: 0 },
      medium: { count: 0, completed: 0, actualTime: 0 },
      low: { count: 0, completed: 0, actualTime: 0 },
      none: { count: 0, completed: 0, actualTime: 0 }
    }

    tasks.forEach(task => {
      const priority = task.priority || 'none'
      if (priorityStats[priority]) {
        priorityStats[priority].count++
        if (task.completed) {
          priorityStats[priority].completed++
        }
        priorityStats[priority].actualTime += task.actualTime || 0
      }
    })

    return priorityStats
  }

  // 获取时间分布数据
  const getTimeDistribution = () => {
    const distribution = tasks
      .filter(task => task.actualTime && task.actualTime > 0)
      .map(task => ({
        title: task.title,
        actualTime: task.actualTime || 0,
        estimatedTime: task.estimatedTime || 0,
        priority: task.priority,
        completed: task.completed
      }))
      .sort((a, b) => b.actualTime - a.actualTime)
      .slice(0, 10) // 只显示前10个任务

    return distribution
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '紧急'
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '无'
    }
  }

  const todayStats = getTodayStats()
  const priorityStats = getStatsByPriority()
  const timeDistribution = getTimeDistribution()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            时间统计分析
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 总体统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{todayStats.totalTasks}</div>
                <div className="text-sm text-gray-500">总任务数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{todayStats.completedTasks}</div>
                <div className="text-sm text-gray-500">已完成</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{todayStats.completionRate}%</div>
                <div className="text-sm text-gray-500">完成率</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{todayStats.timeEfficiency}%</div>
                <div className="text-sm text-gray-500">时间效率</div>
              </CardContent>
            </Card>
          </div>

          {/* 时间统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">时间统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">预估总时间</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {formatMinutes(todayStats.totalEstimatedTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">实际总时间</div>
                  <div className="text-xl font-semibold text-green-600">
                    {formatMinutes(todayStats.totalActualTime)}
                  </div>
                </div>
              </div>
              
              {/* 时间效率进度条 */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>时间效率</span>
                  <span>{todayStats.timeEfficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      todayStats.timeEfficiency <= 80 ? 'bg-green-500' :
                      todayStats.timeEfficiency <= 120 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(todayStats.timeEfficiency, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {todayStats.timeEfficiency <= 80 ? '时间控制良好' :
                   todayStats.timeEfficiency <= 120 ? '时间略有超出' : '时间严重超出'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 优先级分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">优先级分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(priorityStats).map(([priority, stats]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority === 'none' ? undefined : priority)}`} />
                      <span className="text-sm font-medium">{getPriorityText(priority === 'none' ? undefined : priority)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {stats.completed}/{stats.count} 完成
                      </span>
                      <span className="text-blue-600 font-medium">
                        {formatMinutes(stats.actualTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 任务时间分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">任务时间分布 (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeDistribution.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    暂无时间记录数据
                  </div>
                ) : (
                  timeDistribution.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-600">#{index + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${task.completed ? 'text-green-600' : 'text-gray-800'}`}>
                            {task.title}
                            {task.completed && <span className="ml-1">✓</span>}
                          </div>
                          {task.priority && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              <span className="text-xs text-gray-500">{getPriorityText(task.priority)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">
                          {formatMinutes(task.actualTime)}
                        </div>
                        {task.estimatedTime > 0 && (
                          <div className="text-xs text-gray-500">
                            预估: {formatMinutes(task.estimatedTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 效率建议 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">效率建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {todayStats.timeEfficiency > 120 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>实际用时超出预估较多，建议重新评估任务复杂度</span>
                  </div>
                )}
                {todayStats.completionRate < 50 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>任务完成率较低，建议减少任务数量或延长工作时间</span>
                  </div>
                )}
                {todayStats.timeEfficiency <= 80 && todayStats.completionRate >= 80 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>时间控制和完成率都很好，保持当前节奏！</span>
                  </div>
                )}
                {priorityStats.urgent.count > 0 && priorityStats.urgent.completed < priorityStats.urgent.count && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>还有紧急任务未完成，建议优先处理</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航栏 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              返回任务列表
            </Button>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              任务计时器
            </h1>
            
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 主计时器区域 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 当前任务卡片 */}
            {currentTask && (
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <h2 className="text-2xl font-bold text-gray-800">
                        {isRunning ? '正在进行' : '准备开始'}
                      </h2>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl p-6 mb-6">
                      <h3 className="text-xl font-semibold mb-2">{currentTask.title}</h3>
                      {currentTask.description && (
                        <p className="text-blue-100 text-sm">{currentTask.description}</p>
                      )}
                      
                      {/* 任务信息 */}
                      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        {currentTask.priority && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{getPriorityText(currentTask.priority)}</span>
                          </div>
                        )}
                        {currentTask.estimatedTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>预估 {formatMinutes(currentTask.estimatedTime)}</span>
                          </div>
                        )}
                        {currentTask.dueDate && (
                          <div className="flex items-center gap-1">
                            <TimerIcon className="h-4 w-4" />
                            <span>{formatDueDate(currentTask.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 大时钟显示 */}
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => {
                        const timerUrl = `/timer?mini=true&task=${encodeURIComponent(currentTask.title)}&time=${time}&running=${isRunning}&mode=${timerMode}&priority=${currentTask.priority || ''}&estimated=${currentTask.estimatedTime || 0}`
                        window.open(timerUrl, '_blank', 'width=400,height=300,scrollbars=no,resizable=yes')
                      }}
                    >
                      <div className="text-8xl font-mono font-bold text-gray-800 mb-4 group-hover:scale-105 transition-transform">
                        {formatTime(time)}
                      </div>
                      <div className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                        点击在新窗口打开迷你计时器
                      </div>
                    </div>

                    {/* 进度条 */}
                    {currentTask.estimatedTime && timerMode === 'stopwatch' && (
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min((time / 60 / currentTask.estimatedTime) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    )}

                    {/* 控制按钮 */}
                    <div className="flex justify-center gap-4">
                      <Button
                        size="lg"
                        onClick={toggleTimer}
                        className={`px-8 py-4 text-lg font-semibold ${
                          isRunning 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white shadow-lg hover:shadow-xl transition-all`}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            暂停计时
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            开始计时
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={stopTimer}
                        className="px-6 py-4 text-lg border-2 hover:bg-gray-50"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        停止
                      </Button>
                    </div>

                    {/* 任务操作 */}
                    <div className="flex justify-center gap-3 pt-4">
                      <Button
                        onClick={completeCurrentTask}
                        className="bg-green-600 hover:bg-green-700 text-white px-6"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        完成任务
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={moveToNextTask}
                        className="border-2"
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        下一个任务
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setShowHabitDialog(true)}
                        className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <TimerIcon className="h-4 w-4 mr-2" />
                        习惯管理
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setShowStatsDialog(true)}
                        className="border-2 border-green-300 text-green-600 hover:bg-green-50"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        时间统计
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 计时模式切换 */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">计时模式</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={timerMode === 'stopwatch' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => switchTimerMode('stopwatch')}
                      className="rounded-md"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      正计时
                    </Button>
                    <Button
                      variant={timerMode === 'pomodoro' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => switchTimerMode('pomodoro')}
                      className="rounded-md"
                    >
                      <TimerIcon className="h-4 w-4 mr-2" />
                      番茄钟
                    </Button>
                  </div>
                </div>

                {/* 设置选项 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="completion-mode" className="text-sm font-medium">自动完成任务</Label>
                    <Switch
                      id="completion-mode"
                      checked={completionMode === 'auto'}
                      onCheckedChange={(checked) => setCompletionMode(checked ? 'auto' : 'manual')}
                    />
                  </div>

                  {timerMode === 'pomodoro' && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label className="text-sm">工作时间</Label>
                        <Select
                          value={pomodoroTime.toString()}
                          onValueChange={(value) => {
                            const newTime = parseInt(value)
                            setPomodoroTime(newTime)
                            if (!isBreak && !isRunning) setTime(newTime)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="900">15分钟</SelectItem>
                            <SelectItem value="1500">25分钟</SelectItem>
                            <SelectItem value="2700">45分钟</SelectItem>
                            <SelectItem value="3600">60分钟</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">休息时间</Label>
                        <Select
                          value={breakTime.toString()}
                          onValueChange={(value) => {
                            const newTime = parseInt(value)
                            setBreakTime(newTime)
                            if (isBreak && !isRunning) setTime(newTime)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="300">5分钟</SelectItem>
                            <SelectItem value="600">10分钟</SelectItem>
                            <SelectItem value="900">15分钟</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 任务列表侧边栏 */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">任务列表</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                      className="text-xs"
                    >
                      {showCompletedTasks ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddTaskDialog(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3 text-gray-500" />
                  <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">手动排序</SelectItem>
                      <SelectItem value="priority">优先级</SelectItem>
                      <SelectItem value="dueDate">截止时间</SelectItem>
                      <SelectItem value="estimatedTime">预估时间</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortMode === 'manual' ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    >
                      <SortableContext items={filteredAndSortedTasks} strategy={verticalListSortingStrategy}>
                        {filteredAndSortedTasks.map((task, index) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            index={index}
                            currentTaskIndex={currentTaskIndex}
                            completedTasks={completedTasks}
                            onSwitchTask={switchTask}
                            onToggleCompletion={toggleTaskCompletion}
                            onEditTask={handleEditTaskDetails}
                            getPriorityColor={getPriorityColor}
                            getPriorityText={getPriorityText}
                            formatDueDate={formatDueDate}
                            formatMinutes={formatMinutes}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    filteredAndSortedTasks.map((task, index) => (
                      <TaskItemComponent
                        key={task.id}
                        task={task}
                        index={index}
                        currentTaskIndex={currentTaskIndex}
                        completedTasks={completedTasks}
                        onSwitchTask={switchTask}
                        onToggleCompletion={toggleTaskCompletion}
                        onEditTask={handleEditTaskDetails}
                        getPriorityColor={getPriorityColor}
                        getPriorityText={getPriorityText}
                        formatDueDate={formatDueDate}
                        formatMinutes={formatMinutes}
                      />
                    ))
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="text-sm text-gray-500">
                    已完成：{completedTasks.length} / {tasks.length}
                  </div>
                  <Button
                    onClick={() => setShowAddTaskDialog(true)}
                    className="w-full flex items-center gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    添加新任务
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      {/* 预估时间编辑对话框 */}
      <Dialog open={showEstimateDialog} onOpenChange={setShowEstimateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置预估时间</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="estimated-time">预估时间（分钟）</Label>
              <Input
                id="estimated-time"
                type="number"
                value={editEstimatedTime}
                onChange={(e) => setEditEstimatedTime(e.target.value)}
                placeholder="输入预估时间"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEstimateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEstimatedTime}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自动完成确认对话框 */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              任务即将自动完成
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              计时已结束，系统将在 <span className="font-bold text-orange-600">{formatTime(completionCountdown)}</span> 后自动完成当前任务并切换到下一个任务。
            </p>
            <p className="text-sm text-gray-500">
              如果不需要自动完成，请点击"取消"按钮。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAutoComplete}>
              取消
            </Button>
            <Button onClick={handleAutoComplete} className="bg-green-600 hover:bg-green-700">
              立即完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 30分钟提醒对话框 */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              计时提醒
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              您已经连续工作30分钟了！
            </p>
            <p className="text-sm text-gray-500">
              建议适当休息一下，保护您的健康。此提醒将在10秒后自动关闭。
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReminderDialog(false)}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加新任务对话框 */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-task-title">任务标题</Label>
              <Input
                id="new-task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="输入任务标题"
              />
            </div>
            <div>
              <Label htmlFor="new-task-description">任务描述（可选）</Label>
              <Textarea
                id="new-task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="输入任务描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-task-estimated-time">预估时间（分钟）</Label>
                <Input
                  id="new-task-estimated-time"
                  type="number"
                  value={newTaskEstimatedTime}
                  onChange={(e) => setNewTaskEstimatedTime(e.target.value)}
                  placeholder="输入预估时间"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="new-task-priority">优先级</Label>
                <Select value={newTaskPriority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent' | '') => setNewTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="new-task-due-date">截止日期</Label>
              <Input
                id="new-task-due-date"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              添加任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情编辑对话框 */}
      <Dialog open={showTaskEditDialog} onOpenChange={setShowTaskEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑任务详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-task-title">任务标题</Label>
              <Input
                id="edit-task-title"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="输入任务标题"
              />
            </div>
            <div>
              <Label htmlFor="edit-task-description">任务描述</Label>
              <Textarea
                id="edit-task-description"
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                placeholder="输入任务描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-estimated-time">预估时间（分钟）</Label>
                <Input
                  id="edit-estimated-time"
                  type="number"
                  value={editEstimatedTime}
                  onChange={(e) => setEditEstimatedTime(e.target.value)}
                  placeholder="输入预估时间"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="edit-task-priority">优先级</Label>
                <Select value={editTaskPriority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent' | '') => setEditTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-task-due-date">截止日期</Label>
              <Input
                id="edit-task-due-date"
                type="date"
                value={editTaskDueDate}
                onChange={(e) => setEditTaskDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveTaskDetails} disabled={!editTaskTitle.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务切换确认对话框 */}
      <Dialog open={showTaskSwitchDialog} onOpenChange={setShowTaskSwitchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              切换任务确认
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              当前任务正在计时中，确定要切换到其他任务吗？
            </p>
            <p className="text-sm text-gray-500">
              切换任务将停止当前计时。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelTaskSwitch}>
              取消
            </Button>
            <Button variant="outline" onClick={handleViewTaskDetails}>
              查看任务详情
            </Button>
            <Button onClick={handleConfirmTaskSwitch} className="bg-orange-600 hover:bg-orange-700">
              确认切换
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 习惯管理对话框 */}
      <HabitManagementDialog 
        open={showHabitDialog} 
        onOpenChange={setShowHabitDialog}
      />

      {/* 时间统计对话框 */}
      <TimeStatsDialog 
        open={showStatsDialog} 
        onOpenChange={setShowStatsDialog}
        tasks={tasks}
      />

    </div>
  )
}

// 可排序任务项组件
function SortableTaskItem({ 
  task, 
  index, 
  currentTaskIndex, 
  completedTasks, 
  onSwitchTask, 
  onToggleCompletion, 
  onEditTask, 
  getPriorityColor, 
  getPriorityText, 
  formatDueDate, 
  formatMinutes 
}: {
  task: Task
  index: number
  currentTaskIndex: number
  completedTasks: string[]
  onSwitchTask: (index: number) => void
  onToggleCompletion: (taskId: string, e: React.MouseEvent) => void
  onEditTask: (taskId: string) => void
  getPriorityColor: (priority?: string) => string
  getPriorityText: (priority?: string) => string
  formatDueDate: (dueDate?: string) => string | null
  formatMinutes: (minutes: number) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
        index === currentTaskIndex
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : completedTasks.includes(task.id)
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSwitchTask(index)}
    >
      {index === currentTaskIndex && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div {...listeners} className="cursor-grab touch-none">
            <GripVertical className="h-4 w-4 text-gray-400 mt-0.5" />
          </div>
          
          {/* 复选框 */}
          <button
            onClick={(e) => onToggleCompletion(task.id, e)}
            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              completedTasks.includes(task.id)
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {completedTasks.includes(task.id) && (
              <CheckCircle className="h-3 w-3" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm truncate ${
              completedTasks.includes(task.id) ? 'line-through text-gray-500' : 'text-gray-800'
            }`}>
              {task.title}
            </h4>
          
            <div className="flex items-center gap-1 mt-1">
              {task.priority && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1 py-0 text-white ${getPriorityColor(task.priority)}`}
                >
                  {getPriorityText(task.priority)}
                </Badge>
              )}
              {task.dueDate && (
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${
                    formatDueDate(task.dueDate) === '已过期' 
                      ? 'border-red-500 text-red-600' 
                      : formatDueDate(task.dueDate) === '今天'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-gray-400 text-gray-600'
                  }`}
                >
                  {formatDueDate(task.dueDate)}
                </Badge>
              )}
            </div>
            
            {/* 时间信息显示 */}
            <div className="text-xs text-gray-500 mt-1">
              已记录: {formatMinutes(task.actualTime || 0)} / 预估: {formatMinutes(task.estimatedTime || 0)}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onEditTask(task.id)
          }}
          className="h-6 w-6 p-0 z-10 relative"
          style={{ pointerEvents: 'auto' }}
        >
          <Edit3 className="h-3 w-3" />
        </Button>
        
        {completedTasks.includes(task.id) && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
      </div>
    </div>
  )
}

// 普通任务项组件
function TaskItemComponent({ 
  task, 
  index, 
  currentTaskIndex, 
  completedTasks, 
  onSwitchTask, 
  onToggleCompletion, 
  onEditTask, 
  getPriorityColor, 
  getPriorityText, 
  formatDueDate, 
  formatMinutes 
}: {
  task: Task
  index: number
  currentTaskIndex: number
  completedTasks: string[]
  onSwitchTask: (index: number) => void
  onToggleCompletion: (taskId: string, e: React.MouseEvent) => void
  onEditTask: (taskId: string) => void
  getPriorityColor: (priority?: string) => string
  getPriorityText: (priority?: string) => string
  formatDueDate: (dueDate?: string) => string | null
  formatMinutes: (minutes: number) => string
}) {
  return (
    <div
      className={`relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
        index === currentTaskIndex
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : completedTasks.includes(task.id)
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSwitchTask(index)}
    >
      {index === currentTaskIndex && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* 复选框 */}
          <button
            onClick={(e) => onToggleCompletion(task.id, e)}
            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              completedTasks.includes(task.id)
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {completedTasks.includes(task.id) && (
              <CheckCircle className="h-3 w-3" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm truncate ${
              completedTasks.includes(task.id) ? 'line-through text-gray-500' : 'text-gray-800'
            }`}>
              {task.title}
            </h4>
          
            <div className="flex items-center gap-1 mt-1">
              {task.priority && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1 py-0 text-white ${getPriorityColor(task.priority)}`}
                >
                  {getPriorityText(task.priority)}
                </Badge>
              )}
              {task.dueDate && (
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${
                    formatDueDate(task.dueDate) === '已过期' 
                      ? 'border-red-500 text-red-600' 
                      : formatDueDate(task.dueDate) === '今天'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-gray-400 text-gray-600'
                  }`}
                >
                  {formatDueDate(task.dueDate)}
                </Badge>
              )}
            </div>
            
            {/* 时间信息显示 */}
            <div className="text-xs text-gray-500 mt-1">
              已记录: {formatMinutes(task.actualTime || 0)} / 预估: {formatMinutes(task.estimatedTime || 0)}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEditTask(task.id)
          }}
          className="h-6 w-6 p-0"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
        
        {completedTasks.includes(task.id) && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
      </div>
    </div>
  )
}

// 习惯管理对话框组件
function HabitManagementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [habits, setHabits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timers, setTimers] = useState<{ [key: string]: number }>({})
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: NodeJS.Timeout }>({})

  useEffect(() => {
    if (open) {
      fetchHabits()
    }
  }, [open])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const result = await response.json()
        const data = result.success ? result.data : result
        setHabits(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('获取习惯列表失败:', error)
      setHabits([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCheckIn = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: 0,
          note: '快速打卡'
        }),
      })

      if (response.ok) {
        await fetchHabits()
      }
    } catch (error) {
      console.error('快速打卡失败:', error)
    }
  }

  const startTimer = (habitId: string) => {
    if (activeTimers[habitId]) return

    const timer = setInterval(() => {
      setTimers(prev => ({
        ...prev,
        [habitId]: (prev[habitId] || 0) + 1
      }))
    }, 1000)

    setActiveTimers(prev => ({
      ...prev,
      [habitId]: timer
    }))
  }

  const stopTimer = async (habitId: string) => {
    const timer = activeTimers[habitId]
    const duration = timers[habitId] || 0
    const habit = habits.find(h => h.id === habitId)

    if (timer) {
      clearInterval(timer)
      setActiveTimers(prev => {
        const newTimers = { ...prev }
        delete newTimers[habitId]
        return newTimers
      })

      // 保存打卡记录
      if (duration > 0) {
        try {
          const response = await fetch(`/api/habits/${habitId}/checkins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              duration: Math.floor(duration / 60),
              note: `计时打卡 ${Math.floor(duration / 60)} 分钟`
            }),
          })

          if (response.ok) {
            await fetchHabits()
          }
        } catch (error) {
          console.error('保存计时记录失败:', error)
        }
      }

      setTimers(prev => {
        const newTimers = { ...prev }
        delete newTimers[habitId]
        return newTimers
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTodayCheckIns = (habit: any) => {
    const today = new Date().toDateString()
    return habit.checkIns?.filter((checkIn: any) => 
      new Date(checkIn.date).toDateString() === today
    ).length || 0
  }

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      gray: 'bg-gray-500'
    }
    return colorMap[color] || 'bg-blue-500'
  }

  // 检查预估时间自动结束
  useEffect(() => {
    Object.keys(activeTimers).forEach(habitId => {
      const habit = habits.find(h => h.id === habitId)
      const currentTime = timers[habitId] || 0
      
      if (habit?.estimatedTime && currentTime >= habit.estimatedTime * 60) {
        stopTimer(habitId)
      }
    })
  }, [timers, habits, activeTimers])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>习惯管理</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                router.push('/habits')
              }}
              className="text-xs"
            >
              进入完整页面
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">还没有添加任何习惯</p>
            <Button onClick={() => router.push('/habits')}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个习惯
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const todayCheckIns = getTodayCheckIns(habit)
              const isCompleted = todayCheckIns >= habit.targetCount
              const isTimerActive = !!activeTimers[habit.id]
              const currentTime = timers[habit.id] || 0
              const colorClass = getColorClass(habit.color)

              return (
                <Card key={habit.id} className={`${isCompleted ? 'border-green-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                        <h4 className="font-medium">{habit.name}</h4>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        {todayCheckIns}/{habit.targetCount}
                      </Badge>
                    </div>
                    
                    {habit.description && (
                      <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                    )}

                    {isTimerActive && (
                      <div className="text-center mb-3">
                        <div className="text-xl font-mono font-bold text-blue-600">
                          {formatTime(currentTime)}
                        </div>
                        {habit.estimatedTime && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${Math.min((currentTime / (habit.estimatedTime * 60)) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        variant={isTimerActive ? "destructive" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => isTimerActive ? stopTimer(habit.id) : startTimer(habit.id)}
                      >
                        {isTimerActive ? (
                          <>
                            <Square className="w-4 h-4 mr-1" />
                            停止
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            开始
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleQuickCheckIn(habit.id)}
                        disabled={isCompleted}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        快速打卡
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
