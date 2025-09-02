import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 获取所有标签
export async function GET(request: NextRequest) {
  try {
    const userId = '1' // TODO: 从认证中获取实际用户ID

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST - 创建新标签
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color = '#6b7280' } = body
    const userId = '1' // TODO: 从认证中获取实际用户ID

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        userId
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}