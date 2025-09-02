import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - 批量更新任务顺序
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body // Array of { id: string, order: number }

    // 使用事务批量更新
    const result = await prisma.$transaction(
      updates.map((update: { id: string; order: number }) =>
        prisma.task.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    )

    return NextResponse.json({ success: true, updated: result.length })
  } catch (error) {
    console.error('Error updating task order:', error)
    return NextResponse.json(
      { error: 'Failed to update task order' },
      { status: 500 }
    )
  }
}