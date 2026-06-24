import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const startOfDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const endOfDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

// GET - 获取任务仪表盘统计
export async function GET() {
  try {
    const userId = '1' // TODO: 从认证中获取实际用户ID
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const baseWhere = { userId }
    const openWhere = { userId, completed: false }

    const [
      total,
      completed,
      inProgress,
      overdue,
      dueToday,
      upcoming,
      urgentOpen,
      highOpen,
      projectCount,
      tagCount,
      timeTotals,
    ] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, completed: true } }),
      prisma.task.count({ where: { ...baseWhere, status: 'IN_PROGRESS', completed: false } }),
      prisma.task.count({ where: { ...openWhere, dueDate: { lt: todayStart } } }),
      prisma.task.count({ where: { ...openWhere, dueDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.task.count({ where: { ...openWhere, dueDate: { gt: todayEnd } } }),
      prisma.task.count({ where: { ...openWhere, priority: 'URGENT' } }),
      prisma.task.count({ where: { ...openWhere, priority: 'HIGH' } }),
      prisma.project.count({ where: { userId, archived: false } }),
      prisma.tag.count({ where: { userId } }),
      prisma.task.aggregate({
        where: baseWhere,
        _sum: {
          estimatedTime: true,
          actualTime: true,
        },
      }),
    ])

    const active = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      total,
      completed,
      active,
      inProgress,
      overdue,
      dueToday,
      upcoming,
      completionRate,
      totalEstimatedMinutes: timeTotals._sum.estimatedTime ?? 0,
      totalActualMinutes: timeTotals._sum.actualTime ?? 0,
      projectCount,
      tagCount,
      urgentOpen,
      highOpen,
    })
  } catch (error) {
    console.error('Error fetching task stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task stats' },
      { status: 500 }
    )
  }
}
