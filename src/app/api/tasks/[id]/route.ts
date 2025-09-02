import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 获取特定任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        parent: true,
        subtasks: {
          orderBy: { order: 'asc' }
        },
        tags: {
          include: {
            tag: true
          }
        },
        comments: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      completed,
      priority,
      status,
      dueDate,
      reminderAt,
      projectId,
      order,
      repeatType,
      repeatValue,
      tagIds,
      estimatedTime,
      actualTime
    } = body

    // 处理优先级枚举转换
    let normalizedPriority = priority
    if (priority && typeof priority === 'string') {
      normalizedPriority = priority.toUpperCase()
    }

    // 更新任务基本信息
    const updateData: any = {
      title,
      description,
      priority: normalizedPriority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      projectId,
      order,
      repeatType,
      repeatValue,
      updatedAt: new Date()
    }

    if (completed !== undefined) {
      updateData.completed = completed
    }

    // 添加时间字段处理
    if (estimatedTime !== undefined) {
      updateData.estimatedTime = estimatedTime
    }

    if (actualTime !== undefined) {
      updateData.actualTime = actualTime
    }

    // 如果提供了标签ID，先删除现有关联再创建新关联
    if (tagIds !== undefined) {
      await prisma.taskTag.deleteMany({
        where: { taskId: id }
      })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        ...(tagIds !== undefined && {
          tags: {
            create: tagIds.map((tagId: string) => ({
              tag: {
                connect: { id: tagId }
              }
            }))
          }
        })
      },
      include: {
        project: true,
        parent: true,
        subtasks: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
