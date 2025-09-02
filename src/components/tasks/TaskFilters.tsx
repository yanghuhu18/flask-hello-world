'use client'

import React, { useState, useEffect } from 'react'
import { TaskFilters, Priority, ProjectWithCount, TagWithCount } from '@/types'
import { projectApi, tagApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Search,
  Tag as TagIcon,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

export default function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [projects, setProjects] = useState<ProjectWithCount[]>([])
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // 加载项目和标签列表
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
        console.error('Failed to load filter data:', error)
      }
    }

    loadData()
  }, [])

  // 处理搜索
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onFiltersChange({ ...filters, search: value || undefined })
  }

  // 处理筛选器变化
  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  // 清除单个筛选器
  const clearFilter = (key: keyof TaskFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  // 清除所有筛选器
  const clearAllFilters = () => {
    onFiltersChange({})
    setSearchValue('')
  }

  // 计算活跃筛选器数量
  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof TaskFilters] !== undefined && key !== 'search'
  ).length

  const hasActiveFilters = activeFiltersCount > 0 || filters.search

  return (
    <div className="space-y-3">
      {/* 搜索栏和筛选器切换 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索任务..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0"
        >
          <Filter className="h-4 w-4 mr-2" />
          筛选
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500"
          >
            清除
          </Button>
        )}
      </div>

      {/* 筛选器面板 */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
          {/* 项目筛选 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              项目
            </label>
            <Select
              value={filters.projectId || ''}
              onValueChange={(value) => 
                handleFilterChange('projectId', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有项目</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span>{project.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {project._count.tasks}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 完成状态筛选 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              状态
            </label>
            <Select
              value={
                filters.completed === undefined 
                  ? 'all' 
                  : filters.completed 
                    ? 'completed' 
                    : 'pending'
              }
              onValueChange={(value) => {
                if (value === 'all') {
                  handleFilterChange('completed', undefined)
                } else {
                  handleFilterChange('completed', value === 'completed')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待完成</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 优先级筛选 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              优先级
            </label>
            <Select
              value={filters.priority || ''}
              onValueChange={(value) => 
                handleFilterChange('priority', value === 'all' ? undefined : value as Priority)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="URGENT">🔴 紧急</SelectItem>
                <SelectItem value="HIGH">🟠 高</SelectItem>
                <SelectItem value="MEDIUM">🟡 中</SelectItem>
                <SelectItem value="LOW">🟢 低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 标签筛选 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              标签
            </label>
            <Select
              value={filters.tagId || ''}
              onValueChange={(value) => 
                handleFilterChange('tagId', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tag._count.tasks}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 活跃筛选器展示 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">筛选条件:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              搜索: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => clearFilter('search')}
              />
            </Badge>
          )}

          {filters.projectId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              项目: {projects.find(p => p.id === filters.projectId)?.name}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => clearFilter('projectId')}
              />
            </Badge>
          )}

          {filters.completed !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1">
              状态: {filters.completed ? '已完成' : '待完成'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => clearFilter('completed')}
              />
            </Badge>
          )}

          {filters.priority && (
            <Badge variant="secondary" className="flex items-center gap-1">
              优先级: {filters.priority}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => clearFilter('priority')}
              />
            </Badge>
          )}

          {filters.tagId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <TagIcon className="h-3 w-3" />
              标签: {tags.find(t => t.id === filters.tagId)?.name}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => clearFilter('tagId')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}