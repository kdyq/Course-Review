# 课程评价系统 · 前端方向提案

这是一个学生匿名课程评价系统的前端视觉提案，包含三套完整可打开的页面原型。三套原型默认都是亮色，右上角可以切换暗黑模式。页面内数据均为示例。

> 已选定方向：**C 校园手账（Course Zine）**。后续开发以 [开发文档](docs/DEVELOPMENT.md) 为准。

## 运行

```bat
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:4173/
```

入口页会展示三套方向的配色和适用场景，点击卡片进入完整原型。

## 三套方向

### A · 学术档案（Course Ledger）

- 关键词：可信、克制、编辑出版物、长期档案
- 暖纸色背景，衬线标题，砖红强调，细线分隔
- 适合把课程评价做成一份认真维护的公开档案
- 文件：`design/style-a/`

### B · 现代工具（ClassRep）

- 关键词：成熟产品、数据感、搜索筛选、信息密度
- 冷白背景，钴蓝强调，16px 数据卡片，胶囊控件
- 适合突出搜索、筛选、排行榜和评分分布
- 文件：`design/style-b/`

### C · 校园手账（Course Zine）

- 关键词：校园感、贴纸拼贴、活泼、容易被记住
- 奶油纸底，粗描边，偏移阴影，手账便签和胶带
- 适合让学生愿意截图分享，评价更像“人写的”
- 文件：`design/style-c/`

## 设计判断

设计读取：面向学生的课程评价产品，需要可信、校园原生、信息可扫读，因此给出三种明确不同的视觉语言，而不是同一套模板换颜色。

三套方向的动效都使用 GSAP + ScrollTrigger：

- 首屏使用时间线编排标题、按钮和视觉卡片
- 内容区使用 ScrollTrigger.batch 做进入动画
- 只动画 transform 和 opacity
- 尊重 `prefers-reduced-motion`
- 没有使用 `window.addEventListener('scroll')`

## 目录

```text
design/
  index.html          三套方向入口
  gallery.css         入口页样式
  assets/             本地校园和手账照片
  style-a/            学术档案
  style-b/            现代工具
  style-c/            校园手账
  screenshots/        浏览器验收截图
server.js             本地静态预览服务
package.json          npm 脚本和依赖
```

## 依赖

- `gsap`：动画和滚动触发
- `@phosphor-icons/web`：图标

两套依赖都通过 npm 安装在本地，不依赖外部 CDN。字体使用系统字体栈，不依赖 Google Fonts。

## 说明

- 这是设计原型，不是最终业务实现。
- 表单提交只做成功/错误状态演示，不会写入数据库。
- 搜索和学院筛选在 B 方向中可交互，用来演示筛选后的布局和空状态。
- 评分星标在 C 方向中可点击，支持键盘左右方向键。
- 正式实现时按 `docs/DEVELOPMENT.md` 执行，技术栈为 Next.js + TypeScript + Tailwind + PostgreSQL + Prisma + Better Auth，使用 npm，不做部署。
