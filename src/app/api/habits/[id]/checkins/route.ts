import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CreateHabitCheckInData } from '@/types'

// 获取习惯的打卡记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const checkIns = await db.habitCheckIn.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      success: true,
      data: checkIns
    })
  } catch (error) {
    console.error('获取打卡记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取打卡记录失败' },
      { status: 500 }
    )
  }
}

// 创建新的打卡记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params
    const body: Omit<CreateHabitCheckInData, 'habitId'> = await request.json()

    const checkIn = await db.habitCheckIn.create({
      data: {
        habitId,
        duration: body.duration,
        note: body.note
      }
    })

    return NextResponse.json({
      success: true,
      data: checkIn
    })
  } catch (error) {
    console.error('创建打卡记录失败:', error)
    return NextResponse.json(
      { success: false, error: '创建打卡记录失败' },
      { status: 500 }
    )
  }
}
