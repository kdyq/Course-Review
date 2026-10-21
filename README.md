# 课评手账 · 学生匿名课程评价系统

一个本地运行的学生匿名课程评价系统。评价对象是“课程 + 学期 + 教师 + 班次”组成的开课班次。前台匿名展示，后台保留必要的一人一评和治理能力。

> 个人练手项目，不做部署。正式数据请只使用手动录入或已授权的 CSV。

## 已实现

- 用户名 + 密码注册、登录、登出、Session 持久化。
- 课程库：搜索课程名、教师、课程代码，按学院、类型、学期筛选，排序和分页。
- 课程详情：跨班次聚合、评分分布、班次列表、最新评价。
- 班次详情：评分汇总、分布、标签、评价列表，按最有用、最新、最高分、最低分排序。
- 写评价：三项必填评分、两项可选评分、考核方式多选、最多 5 个预设标签、正文 10 到 2000 字。
- 一人一评：数据库唯一约束兜底；同一班次再次进入写评价会跳到编辑。
- 编辑与删除：发布后 7 天内可编辑，软删除；我的评价页显示状态。
- 匿名：公开页面只显示“匿名同学”和学期，不显示用户名、邮箱或精确时间。
- 有用投票：一人一评一票，不能给自己投票。
- 举报：固定原因，同一用户对同一评价只能有一条未处理举报。
- 排行榜：推荐度、难度、作业量，贝叶斯平均，至少 5 条评价，支持学期筛选。
- 小样本保护：少于 5 条不显示平均分和分布图。
- 后台：数据概览、课程与班次 CRUD、CSV 导入预览与事务导入、评价隐藏/恢复/删除、举报处理、用户角色与封禁、标签管理、审计日志。
- 亮色默认、暗黑手动切换、390/768/1024/1440 响应式。
- 限流：Better Auth 登录/注册限流 + 发评、编辑、投票、举报的内存限流。

## 技术栈

Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4、Radix UI、`@phosphor-icons/react`、GSAP、PostgreSQL 18、Prisma 7（`@prisma/adapter-pg`）、Better Auth、Zod、React Hook Form、Recharts、Vitest、Playwright、Biome。

## 运行要求

- Node.js 24 及以上，npm 11 及以上。
- PostgreSQL 18，默认端口 5432。
- Redis 可选。当前限流使用内存回退，不依赖 Redis。
- Playwright 使用本机 Chrome，不下载 Chromium。

## 安装与启动

1. 启动 PostgreSQL。Windows 服务名通常是 `postgresql-x64-18`：

```bat
net start postgresql-x64-18
```

2. 创建数据库（只需一次）：

```bat
psql -U postgres -c "CREATE DATABASE course_review;"
psql -U postgres -c "CREATE DATABASE course_review_test;"
```

3. 安装依赖：

```bat
npm install
```

4. 配置环境变量。复制 `.env.example` 为 `.env`，填入本机密码；`.env` 已在 `.gitignore` 中，不会提交。

5. 应用迁移和种子数据：

```bat
npm run db:deploy
npm run db:seed
```

6. 启动：

```bat
npm run dev
```

打开 <http://127.0.0.1:3000>。

## 演示账号

| 角色 | 用户名 | 密码 |
|---|---|---|
| 管理员 | `guo` | `123456` |
| 学生 | `student01` | `Student2026` |

管理员 `guo` 由种子脚本直接写入数据库，不受普通用户“用户名至少 5 位”的限制。普通用户通过注册页创建，用户名只允许字母和数字且至少 5 位，密码只允许字母、数字、`@`、`_` 且至少 6 位。

## 邮箱验证码

邮箱验证码使用 QQ 邮箱 SMTP，配置在 `.env` 中：

```env
QQ_SMTP_HOST="smtp.qq.com"
QQ_SMTP_PORT="465"
QQ_SMTP_SECURE="true"
QQ_SMTP_USER="你的 QQ 邮箱"
QQ_SMTP_PASS="QQ 邮箱授权码"
EMAIL_FROM="你的 QQ 邮箱"
EMAIL_DELIVERY_MODE="smtp"
EMAIL_VERIFICATION_ENABLED="false"
```

- 默认 `EMAIL_DELIVERY_MODE=smtp`，验证码会通过 QQ SMTP 真实发送到用户邮箱。
- 注册后可以在个人中心按需发送验证码。只有点击发送时才会生成验证码。
- 如果暂时不想真实发信，把 `EMAIL_DELIVERY_MODE` 改为 `log`，验证码只写入服务端日志。不要频繁发送，避免 QQ 邮箱触发风控。
- 不要把 `.env` 提交到仓库。

## 常用脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产构建 |
| `npm run check` | TypeScript + Biome + Vitest |
| `npm run test:e2e` | Playwright E2E，使用本机 Chrome |
| `npm run db:migrate` | 创建/应用开发迁移 |
| `npm run db:deploy` | 应用已有迁移 |
| `npm run db:seed` | 清空并重建种子数据 |
| `npm run db:test:reset` | 迁移并清空测试数据库 |
| `npm run db:studio` | Prisma Studio |
| `npm run prototype` | 预览 `design/` 下的静态原型，端口 4173 |
| `npm run capture` | 重新生成静态原型截图 |
| `npm run screenshot` | 截取正式应用的公开页面 |

## 测试

```bat
npm run db:test:reset
npm run check
```

`npm run check` 会运行单元测试和集成测试。集成测试使用独立的 `course_review_test` 数据库，不会影响开发数据。

E2E 测试会写入 `course_review` 开发数据库：

```bat
npm run db:seed
npm run test:e2e
npm run db:seed
```

覆盖注册、登录、搜索、写评价、匿名展示、有用投票、举报、后台隐藏、主题持久化、390px 移动端写评价、匿名泄露、小样本、键盘登录、星级方向键、Dialog Esc 和减少动态。

## 目录

```text
src/
  app/                 路由、布局、Server Actions 入口
  components/          zine 组件、课程、评价、后台组件
  lib/                 常量、格式化、匿名 DTO、校验、限流、CSV
  server/
    actions/           写操作
    queries/           只被 Server Components 调用的查询
  styles/              设计 token 和校园手账样式
prisma/
  schema.prisma        数据模型
  migrations/          迁移，含 pg_trgm 和举报部分唯一索引
  seed.ts              种子数据
tests/
  unit/                单元测试
  integration/         独立测试数据库的约束测试
  e2e/                 Playwright
design/                最初的三套静态视觉原型，保留作参考
docs/
  DEVELOPMENT.md       需求和设计文档
  IMPLEMENTATION.md    实际实现说明、偏差和已知限制
```

## 实现说明与偏差

详细的实现状态、路由、认证模型、测试覆盖和已知限制见 [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)。

要点：

- 登录使用用户名，不使用邮箱作为登录名。
- 邮箱验证码在注册后按需发送，默认通过 QQ SMTP 真实发送。
- `REVIEW_MODERATION_ENABLED=false` 时，本地新账号发评直接发布；设为 `true` 后会启用注册冷却和前 3 条评价 PENDING。
- 难度和作业量榜单按升序排列（越轻松、作业越少越靠前），推荐度按降序排列。
- 收藏、站内通知、教师详情、教师回应、课程对比属于 P1，尚未实现。
- 这是本地项目。管理员密码和邮箱授权码只适合本地开发，不要用于公网部署。
