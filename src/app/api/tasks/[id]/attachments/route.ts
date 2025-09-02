import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 获取任务的所有附件
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}