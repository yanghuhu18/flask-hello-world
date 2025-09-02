import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UpdateHabitData } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const habit = await db.habit.findUnique({
      where: { id: params.id },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 100
        },
        _count: {
          select: { checkIns: true }
        }
      }
    })

    if (!habit) {
      return NextResponse.json({ error: '习惯不存在' }, { status: 404 })
    }

    return NextResponse.json(habit)
  } catch (error) {
    console.error('获取习惯详情失败:', error)
    return NextResponse.json({ error: '获取习惯详情失败' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateHabitData = await request.json()

    const habit = await db.habit.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        frequency: data.frequency,
        targetCount: data.targetCount,
        estimatedTime: data.estimatedTime,
        isActive: data.isActive
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 100
        },
        _count: {
          select: { checkIns: true }
        }
      }
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('更新习惯失败:', error)
    return NextResponse.json({ error: '更新习惯失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.habit.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除习惯失败:', error)
    return NextResponse.json({ error: '删除习惯失败' }, { status: 500 })
  }
}
