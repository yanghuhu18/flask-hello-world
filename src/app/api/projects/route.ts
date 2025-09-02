import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 获取所有项目
export async function GET(request: NextRequest) {
  try {
    const userId = '1' // TODO: 从认证中获取实际用户ID

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color = '#3b82f6' } = body
    const userId = '1' // TODO: 从认证中获取实际用户ID

    const project = await prisma.project.create({
      data: {
        name,
        description,
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

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}