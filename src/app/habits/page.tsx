'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Square, Plus, Edit, Trash2, CheckCircle, ArrowLeft } from 'lucide-react'
import { CreateHabitData, CreateHabitCheckInData, HABIT_FREQUENCY_LABELS } from '@/types'
import { useRouter } from 'next/navigation'

// 临时使用any类型来解决Prisma类型导入问题
type HabitWithCheckIns = any
type HabitFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

const HABIT_COLORS = [
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'green', label: '绿色', class: 'bg-green-500' },
  { value: 'red', label: '红色', class: 'bg-red-500' },
  { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
  { value: 'pink', label: '粉色', class: 'bg-pink-500' },
  { value: 'indigo', label: '靛蓝', class: 'bg-indigo-500' },
  { value: 'gray', label: '灰色', class: 'bg-gray-500' }
]

const HABIT_FREQUENCIES = [
  { value: 'DAILY' as HabitFrequency, label: '每日' },
  { value: 'WEEKLY' as HabitFrequency, label: '每周' },
  { value: 'MONTHLY' as HabitFrequency, label: '每月' },
  { value: 'YEARLY' as HabitFrequency, label: '每年' }
]

export default function HabitsPage() {
  const router = useRouter()
  const [habits, setHabits] = useState<HabitWithCheckIns[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithCheckIns | null>(null)
  const [timers, setTimers] = useState<{ [key: string]: number }>({})
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: NodeJS.Timeout }>({})

  // 表单状态
  const [formData, setFormData] = useState<CreateHabitData>({
    name: '',
    description: '',
    color: 'blue',
    frequency: 'DAILY',
    targetCount: 1,
    estimatedTime: 30
  })

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const result = await response.json()
        // API返回格式是 { success: true, data: habits }
        const data = result.success ? result.data : result
        setHabits(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('获取习惯列表失败:', error)
      setHabits([]) // 出错时设置为空数组
    } finally {
      setLoading(false)
    }
  }

  const handleAddHabit = async () => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchHabits()
        setShowAddDialog(false)
        resetForm()
      }
    } catch (error) {
      console.error('添加习惯失败:', error)
    }
  }

  const handleEditHabit = async () => {
    if (!editingHabit) return

    try {
      const response = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchHabits()
        setEditingHabit(null)
        resetForm()
      }
    } catch (error) {
      console.error('编辑习惯失败:', error)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('确定要删除这个习惯吗？')) return

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchHabits()
      }
    } catch (error) {
      console.error('删除习惯失败:', error)
    }
  }

  const handleQuickCheckIn = async (habitId: string) => {
    try {
      const checkInData: CreateHabitCheckInData = {
        habitId,
        duration: 0,
        note: '快速打卡'
      }

      const response = await fetch(`/api/habits/${habitId}/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData),
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
          const checkInData: CreateHabitCheckInData = {
            habitId,
            duration: Math.floor(duration / 60), // 转换为分钟
            note: `计时打卡 ${Math.floor(duration / 60)} 分钟`
          }

          const response = await fetch(`/api/habits/${habitId}/checkins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkInData),
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      frequency: 'DAILY',
      targetCount: 1,
      estimatedTime: 30
    })
  }

  const openEditDialog = (habit: HabitWithCheckIns) => {
    setEditingHabit(habit)
    setFormData({
      name: habit.name,
      description: habit.description || '',
      color: habit.color || 'blue',
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      estimatedTime: habit.estimatedTime
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTodayCheckIns = (habit: HabitWithCheckIns) => {
    const today = new Date().toDateString()
    return habit.checkIns?.filter(checkIn => 
      new Date(checkIn.date).toDateString() === today
    ).length || 0
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务列表
          </Button>
          <h1 className="text-3xl font-bold">习惯管理</h1>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              添加习惯
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新习惯</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">习惯名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入习惯名称"
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入习惯描述"
                />
              </div>
              <div>
                <Label htmlFor="color">颜色</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${color.class} mr-2`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">频率</Label>
                <Select value={formData.frequency} onValueChange={(value: HabitFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetCount">目标次数</Label>
                <Input
                  id="targetCount"
                  type="number"
                  value={formData.targetCount || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="estimatedTime">预估时间（分钟）</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  value={formData.estimatedTime || 30}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                  min="1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAddHabit}>
                  添加
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑习惯</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">习惯名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入习惯名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入习惯描述"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">颜色</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_COLORS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${color.class} mr-2`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-frequency">频率</Label>
              <Select value={formData.frequency} onValueChange={(value: HabitFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_FREQUENCIES.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="edit-targetCount">目标次数</Label>
              <Input
                id="edit-targetCount"
                type="number"
                value={formData.targetCount || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="edit-estimatedTime">预估时间（分钟）</Label>
              <Input
                id="edit-estimatedTime"
                type="number"
                value={formData.estimatedTime || 30}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingHabit(null)}>
                取消
              </Button>
              <Button onClick={handleEditHabit}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 习惯列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => {
          const todayCheckIns = getTodayCheckIns(habit)
          const isCompleted = todayCheckIns >= habit.targetCount
          const isTimerActive = !!activeTimers[habit.id]
          const currentTime = timers[habit.id] || 0
          const colorClass = HABIT_COLORS.find(c => c.value === habit.color)?.class || 'bg-blue-500'

          return (
            <Card key={habit.id} className={`${isCompleted ? 'border-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(habit)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHabit(habit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {habit.description && (
                  <p className="text-sm text-gray-600">{habit.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">今日进度:</span>
                    <Badge variant={isCompleted ? "default" : "secondary"}>
                      {todayCheckIns}/{habit.targetCount}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">频率:</span>
                    <span className="text-sm">{HABIT_FREQUENCY_LABELS[habit.frequency]}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">预估时间:</span>
                    <span className="text-sm">{habit.estimatedTime}分钟</span>
                  </div>

                  {isTimerActive && (
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold text-blue-600">
                        {formatTime(currentTime)}
                      </div>
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
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">还没有添加任何习惯</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加第一个习惯
          </Button>
        </div>
      )}
    </div>
  )
}
