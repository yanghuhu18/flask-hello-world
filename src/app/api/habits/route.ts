import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CreateHabitData } from '@/types'

// 获取习惯列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')
    
    const habits = await db.habit.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === 'true' })
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 10 // 最近10次打卡记录
        },
        _count: {
          select: { checkIns: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: habits
    })
  } catch (error) {
    console.error('获取习惯列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取习惯列表失败' },
      { status: 500 }
    )
  }
}

// 创建新习惯
export async function POST(request: NextRequest) {
  try {
    const body: CreateHabitData = await request.json()
    
    // 确保默认用户存在
    const defaultUser = await db.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        email: 'default@example.com',
        name: '默认用户'
      }
    })
    
    const habit = await db.habit.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color || '#8b5cf6',
        frequency: body.frequency || 'DAILY',
        targetCount: body.targetCount || 1,
        estimatedTime: body.estimatedTime,
        userId: defaultUser.id
      },
      include: {
        checkIns: true,
        _count: {
          select: { checkIns: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: habit
    })
  } catch (error) {
    console.error('创建习惯失败:', error)
    return NextResponse.json(
      { success: false, error: '创建习惯失败' },
      { status: 500 }
    )
  }
}
