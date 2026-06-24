import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const parseDate = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// GET - 获取所有任务
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const completed = searchParams.get('completed')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const tagId = searchParams.get('tagId')
    const search = searchParams.get('search')?.trim()
    const dueDateFrom = parseDate(searchParams.get('dueDateFrom'))
    const dueDateTo = parseDate(searchParams.get('dueDateTo'))
    const userId = '1' // TODO: 从认证中获取实际用户ID

    const where: any = {
      userId,
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (completed !== null) {
      where.completed = completed === 'true'
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { project: { name: { contains: search } } },
        { tags: { some: { tag: { name: { contains: search } } } } }
      ]
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {}
      if (dueDateFrom) where.dueDate.gte = dueDateFrom
      if (dueDateTo) where.dueDate.lte = dueDateTo
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: true,
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: [
        { completed: 'asc' },
        { order: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      priority = 'MEDIUM',
      status = 'TODO',
      dueDate,
      reminderAt,
      projectId,
      parentId,
      repeatType = 'NONE',
      repeatValue,
      estimatedTime,
      tagIds = []
    } = body

    const userId = '1' // TODO: 从认证中获取实际用户ID

    // 创建任务
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        projectId,
        parentId,
        repeatType,
        repeatValue,
        estimatedTime,
        userId,
        tags: {
          create: tagIds.map((tagId: string) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      },
      include: {
        project: true,
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: true,
        parent: true,
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}