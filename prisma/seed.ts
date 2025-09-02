import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建种子数据...')

  // 创建默认用户
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: '1',
      email: 'user@example.com',
      name: '默认用户',
      avatar: null
    }
  })

  console.log('创建用户:', user.email)

  // 创建示例项目
  const personalProject = await prisma.project.create({
    data: {
      name: '个人项目',
      description: '个人任务和计划',
      color: '#10b981',
      userId: user.id
    }
  })

  const workProject = await prisma.project.create({
    data: {
      name: '工作项目',
      description: '工作相关的任务',
      color: '#3b82f6',
      userId: user.id
    }
  })

  console.log('创建项目:', [personalProject.name, workProject.name])

  // 创建示例标签
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: '重要',
        color: '#ef4444',
        userId: user.id
      }
    }),
    prisma.tag.create({
      data: {
        name: '紧急',
        color: '#f59e0b',
        userId: user.id
      }
    }),
    prisma.tag.create({
      data: {
        name: '学习',
        color: '#8b5cf6',
        userId: user.id
      }
    }),
    prisma.tag.create({
      data: {
        name: '生活',
        color: '#ec4899',
        userId: user.id
      }
    })
  ])

  console.log('创建标签:', tags.map(t => t.name))

  // 创建示例任务
  const tasks = await Promise.all([
    // 个人项目任务
    prisma.task.create({
      data: {
        title: '学习 Next.js 15 新特性',
        description: '了解 Next.js 15 的新功能和改进',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一周后
        userId: user.id,
        projectId: personalProject.id,
        tags: {
          create: [
            { tagId: tags[2].id } // 学习标签
          ]
        }
      }
    }),
    prisma.task.create({
      data: {
        title: '整理房间',
        description: '清理和整理工作空间',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 两天后
        userId: user.id,
        projectId: personalProject.id,
        tags: {
          create: [
            { tagId: tags[3].id } // 生活标签
          ]
        }
      }
    }),
    
    // 工作项目任务
    prisma.task.create({
      data: {
        title: '完成项目报告',
        description: '准备季度项目总结报告',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 明天
        reminderAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20小时后提醒
        userId: user.id,
        projectId: workProject.id,
        tags: {
          create: [
            { tagId: tags[0].id }, // 重要标签
            { tagId: tags[1].id }  // 紧急标签
          ]
        }
      }
    }),
    prisma.task.create({
      data: {
        title: '代码审查',
        description: '审查团队成员提交的PR',
        priority: 'HIGH',
        status: 'TODO',
        repeatType: 'WEEKLY',
        userId: user.id,
        projectId: workProject.id
      }
    }),
    
    // 已完成的任务
    prisma.task.create({
      data: {
        title: '部署新版本到生产环境',
        description: '完成 v2.0 版本的部署',
        priority: 'HIGH',
        status: 'DONE',
        completed: true,
        userId: user.id,
        projectId: workProject.id
      }
    })
  ])

  console.log('创建任务:', tasks.map(t => t.title))

  // 创建带子任务的任务
  const parentTask = await prisma.task.create({
    data: {
      title: '开发新功能模块',
      description: '实现用户管理功能',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 两周后
      userId: user.id,
      projectId: workProject.id
    }
  })

  // 创建子任务
  const subtasks = await Promise.all([
    prisma.task.create({
      data: {
        title: '设计数据库模型',
        priority: 'HIGH',
        status: 'DONE',
        completed: true,
        userId: user.id,
        parentId: parentTask.id
      }
    }),
    prisma.task.create({
      data: {
        title: '实现后端API',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        userId: user.id,
        parentId: parentTask.id
      }
    }),
    prisma.task.create({
      data: {
        title: '开发前端界面',
        priority: 'MEDIUM',
        status: 'TODO',
        userId: user.id,
        parentId: parentTask.id
      }
    })
  ])

  console.log('创建子任务:', subtasks.map(t => t.title))

  // 添加示例评论
  await prisma.comment.create({
    data: {
      content: '这个任务需要优先完成，客户在等待',
      taskId: tasks[2].id,
      userId: user.id
    }
  })

  console.log('种子数据创建完成！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })