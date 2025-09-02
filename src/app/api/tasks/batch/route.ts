import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - 批量更新任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, taskIds } = body

    if (!action || !taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const userId = '1' // TODO: 从认证中获取实际用户ID

    switch (action) {
      case 'delete':
        // 批量删除
        await prisma.task.deleteMany({
          where: {
            id: { in: taskIds },
            userId
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: `成功删除 ${taskIds.length} 个任务` 
        })

      case 'complete':
        // 批量标记为完成
        await prisma.task.updateMany({
          where: {
            id: { in: taskIds },
            userId
          },
          data: {
            completed: true,
            status: 'DONE',
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: `成功完成 ${taskIds.length} 个任务` 
        })

      case 'uncomplete':
        // 批量标记为未完成
        await prisma.task.updateMany({
          where: {
            id: { in: taskIds },
            userId
          },
          data: {
            completed: false,
            status: 'TODO',
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: `成功标记 ${taskIds.length} 个任务为未完成` 
        })

      case 'priority':
        // 批量更新优先级
        const { priority } = body
        if (!priority) {
          return NextResponse.json(
            { error: 'Priority is required for this action' },
            { status: 400 }
          )
        }
        await prisma.task.updateMany({
          where: {
            id: { in: taskIds },
            userId
          },
          data: {
            priority,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: `成功更新 ${taskIds.length} 个任务的优先级` 
        })

      case 'project':
        // 批量移动到项目
        const { projectId } = body
        await prisma.task.updateMany({
          where: {
            id: { in: taskIds },
            userId
          },
          data: {
            projectId: projectId || null,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ 
          success: true, 
          message: `成功移动 ${taskIds.length} 个任务到项目` 
        })

      case 'tags':
        // 批量添加标签
        const { tagIds, operation = 'add' } = body
        if (!tagIds || !Array.isArray(tagIds)) {
          return NextResponse.json(
            { error: 'Tag IDs are required for this action' },
            { status: 400 }
          )
        }

        if (operation === 'add') {
          // 批量添加标签
          const taskTagData = taskIds.flatMap(taskId =>
            tagIds.map(tagId => ({
              taskId,
              tagId
            }))
          )
          await prisma.taskTag.createMany({
            data: taskTagData,
            skipDuplicates: true
          })
        } else if (operation === 'remove') {
          // 批量移除标签
          await prisma.taskTag.deleteMany({
            where: {
              taskId: { in: taskIds },
              tagId: { in: tagIds }
            }
          })
        }

        return NextResponse.json({ 
          success: true, 
          message: `成功${operation === 'add' ? '添加' : '移除'}标签` 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in batch operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform batch operation' },
      { status: 500 }
    )
  }
}