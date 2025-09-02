import axios from 'axios'
import type {
  TaskWithRelations,
  CreateTaskData,
  UpdateTaskData,
  ProjectWithCount,
  CreateProjectData,
  TagWithCount,
  CreateTagData,
  CreateCommentData,
  TaskFilters,
  ApiResponse
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 任务相关API
export const taskApi = {
  // 获取任务列表
  getTasks: async (filters?: TaskFilters): Promise<TaskWithRelations[]> => {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.completed !== undefined) params.append('completed', String(filters.completed))
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.tagId) params.append('tagId', filters.tagId)

    const { data } = await api.get(`/tasks?${params.toString()}`)
    return data
  },

  // 获取单个任务
  getTask: async (id: string): Promise<TaskWithRelations> => {
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },

  // 创建任务
  createTask: async (taskData: CreateTaskData): Promise<TaskWithRelations> => {
    const { data } = await api.post('/tasks', taskData)
    return data
  },

  // 更新任务
  updateTask: async (id: string, taskData: UpdateTaskData): Promise<TaskWithRelations> => {
    const { data } = await api.put(`/tasks/${id}`, taskData)
    return data
  },

  // 删除任务
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`)
  },

  // 批量更新任务顺序
  reorderTasks: async (updates: { id: string; order: number }[]): Promise<void> => {
    await api.post('/tasks/reorder', { updates })
  },

  // 切换任务完成状态
  toggleComplete: async (id: string, completed: boolean): Promise<TaskWithRelations> => {
    const { data } = await api.put(`/tasks/${id}`, { completed })
    return data
  },

  // 批量操作
  batchOperation: async (action: string, taskIds: string[], options?: any): Promise<any> => {
    const { data } = await api.post('/tasks/batch', {
      action,
      taskIds,
      ...options
    })
    return data
  }
}

// 项目相关API
export const projectApi = {
  // 获取项目列表
  getProjects: async (): Promise<ProjectWithCount[]> => {
    const { data } = await api.get('/projects')
    return data
  },

  // 创建项目
  createProject: async (projectData: CreateProjectData): Promise<ProjectWithCount> => {
    const { data } = await api.post('/projects', projectData)
    return data
  }
}

// 标签相关API
export const tagApi = {
  // 获取标签列表
  getTags: async (): Promise<TagWithCount[]> => {
    const { data } = await api.get('/tags')
    return data
  },

  // 创建标签
  createTag: async (tagData: CreateTagData): Promise<TagWithCount> => {
    const { data } = await api.post('/tags', tagData)
    return data
  }
}

// 评论相关API
export const commentApi = {
  // 获取任务评论
  getComments: async (taskId: string) => {
    const { data } = await api.get(`/tasks/${taskId}/comments`)
    return data
  },

  // 创建评论
  createComment: async (taskId: string, commentData: CreateCommentData) => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, commentData)
    return data
  }
}

export default api