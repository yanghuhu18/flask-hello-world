# Next.js Todo 应用

这是一个功能完整的全栈Todo应用，使用现代技术栈构建。

## 技术栈

- **Next.js 15** - React框架，使用App Router
- **TypeScript 5** - 类型安全
- **Prisma ORM** - 数据库操作
- **SQLite** - 数据库
- **shadcn/ui** - UI组件库
- **Tailwind CSS 4** - 样式框架
- **Socket.io** - 实时通信
- **React Hook Form** - 表单处理
- **Zustand** - 状态管理

## 功能特性

- ✅ 任务管理（创建、编辑、删除、完成）
- ✅ 项目分组
- ✅ 标签系统
- ✅ 时间跟踪
- ✅ 习惯追踪
- ✅ 实时更新
- ✅ 响应式设计
- ✅ 深色/浅色主题

## 快速开始

### 安装依赖
```bash
npm install
```

### 数据库设置
```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库架构
npm run db:push

# 可选：填充示例数据
npm run db:seed
```

### 开发模式
```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 生产构建
```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API路由
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 首页
├── components/         # React组件
│   ├── tasks/         # 任务相关组件
│   └── ui/            # shadcn/ui组件
├── hooks/             # 自定义Hooks
├── lib/               # 工具函数
└── types/             # TypeScript类型定义

prisma/
├── schema.prisma      # 数据库架构
├── migrations/        # 数据库迁移
└── seed.ts           # 数据填充脚本
```

## 数据库架构

- **Task** - 任务表
- **Project** - 项目表
- **Tag** - 标签表
- **Habit** - 习惯表
- **HabitCheckin** - 习惯打卡表

## API 端点

- `GET/POST /api/tasks` - 任务CRUD
- `GET/POST /api/projects` - 项目CRUD
- `GET/POST /api/tags` - 标签CRUD
- `GET/POST /api/habits` - 习惯CRUD

## 环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./dev.db"
```

## 部署

支持部署到：
- Vercel
- Netlify
- Docker
- 传统服务器

## 许可证

MIT License
