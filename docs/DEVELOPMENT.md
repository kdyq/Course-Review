# 学生课程评价系统开发文档

> 版本：v1.0  
> 日期：2026-10-19  
> 状态：M0-M6 已完成，实现说明见 `docs/IMPLEMENTATION.md`  
> 视觉基准：`design/style-c/` 校园手账  
> 适用项目：个人练手项目，本地运行，不做部署  
> 认证说明：实际使用用户名 + 密码登录；管理员 `guo` 直接种子；邮箱验证码在注册后按需发送

---

## 0. 结论与已确认事项

### 0.1 已确认

| 项目 | 决定 |
|---|---|
| 视觉方向 | C 校园手账（Course Zine） |
| 默认主题 | 亮色。暗黑模式通过右上角按钮手动切换，不跟随系统默认暗色 |
| 包管理器 | npm，不使用 pnpm |
| 部署 | 不做部署，本地开发和本地生产构建验证 |
| 数据库 | PostgreSQL 18.6，本机已安装，服务需要手动启动 |
| 缓存/限流 | Redis 8.8.0 已在本机运行，可选使用 |
| Docker | 不使用 |
| 评价对象 | 课程 + 教师 + 学期组成的开课班次（Offering） |
| 匿名策略 | 前台匿名、后台可追责；一人对同一班次只能评价一次 |
| 登录方式 | 邮箱 + 密码，本地开发不要求邮箱验证 |

### 0.2 视觉基准

开发时以以下文件为视觉和交互的最终参考：

- `design/style-c/index.html`
- `design/style-c/styles.css`
- `design/style-c/script.js`
- `design/screenshots/style-c-hero-light.png`
- `design/screenshots/style-c-light.png`
- `design/screenshots/style-c-dark.png`

原型中的文案、数据和图片都属于演示内容，正式开发时替换为数据库数据和真实业务文案，但保留视觉语言、组件形态和交互节奏。

### 0.3 技术栈

| 层次 | 选型 | 版本基准 |
|---|---|---|
| 运行时 | Node.js | 24.16.0 |
| 包管理 | npm | 11.13.0 |
| 框架 | Next.js App Router | 16.4.2 |
| UI 运行时 | React | 19.3.1 |
| 语言 | TypeScript | 最新稳定版 |
| 样式 | Tailwind CSS + CSS 变量 | 4.3.3 |
| 无样式原语 | Radix UI Primitives | 最新稳定版 |
| 图标 | `@phosphor-icons/react` | 最新稳定版 |
| 动画 | GSAP + `@gsap/react` | 3.15.0 |
| ORM | Prisma + `@prisma/adapter-pg` | 7.10.1 |
| 数据库 | PostgreSQL | 18.6 |
| 认证 | Better Auth | 1.7.11 |
| 校验 | Zod | 4.6.7 |
| 表单 | React Hook Form + `@hookform/resolvers` | 最新稳定版 |
| 图表 | Recharts | 3.10.1 |
| 表格 | TanStack Table | 最新稳定版 |
| 测试 | Vitest + Playwright | 最新稳定版 |
| 代码检查 | Biome | 最新稳定版 |

说明：

- 不使用 shadcn/ui 的默认主题。需要 Dialog、Tabs、Dropdown、Toast、Popover 等可访问性原语时，直接使用 Radix UI，再套上校园手账样式。
- 不引入外部字体 CDN。继续使用系统字体栈，避免网络依赖。
- 不引入 Meilisearch、Typesense、Elasticsearch。第一版使用 PostgreSQL 的 `pg_trgm`。
- 不引入 Docker。PostgreSQL 和 Redis 都使用本机已安装的服务。

---

## 1. 产品目标与非目标

### 1.1 产品目标

1. 让学生匿名记录课程真实体验，帮助下一届学生选课。
2. 评价结构化为难度、作业量、推荐度、考核方式等维度，方便搜索和比较。
3. 通过课程、教师、学期三个维度聚合评价，形成可读的课程档案。
4. 通过登录、一人一评、点赞去重、举报和后台审核，保证匿名但不失控。
5. 作为个人练手项目，覆盖认证、数据库、搜索、聚合、权限、审核、测试和动效的完整链路。

### 1.2 非目标

第一版明确不做：

- 部署到公网、域名、HTTPS、备案。
- 多学校、多租户。
- 私信、关注、用户主页、社交关系。
- 评价下的嵌套评论。
- 图片上传、附件、音视频。
- 实时聊天、实时通知推送。
- 复杂推荐算法、协同过滤。
- AI 自动总结评价。
- 原生移动端 App。
- 爬取学校教务系统数据。
- 管理员查看评价作者身份的去匿名化功能。

---

## 2. 用户角色与核心场景

### 2.1 角色

| 角色 | 说明 | 主要能力 |
|---|---|---|
| 游客 | 未登录用户 | 浏览课程、搜索、看评价和榜单 |
| 学生 | 已登录普通用户 | 写评价、编辑自己的评价、点有用、举报、收藏 |
| 教师 | 已认证教师 | 查看与自己相关的课程评价，回应评价（P1） |
| 审核员 | 社区管理员 | 处理举报、隐藏或恢复评价 |
| 管理员 | 系统管理员 | 课程数据、班次数据、用户、标签、审计日志 |

个人项目第一版可以只建两个账号角色：`STUDENT` 和 `ADMIN`。`INSTRUCTOR` 和 `MODERATOR` 在 P1 引入。数据库枚举先预留，避免后续迁移。

### 2.2 核心场景

1. 学生想选一门选修课，搜索课程名，看到推荐度、难度、作业量和匿名评价，决定是否选。
2. 学生上完一学期课程，找到对应班次，填写三个评分、考核方式和文字评价，匿名发布。
3. 学生发现一条评价泄露了教师个人隐私，提交举报，管理员在后台处理。
4. 学生想看“这学期最推荐的课”，进入排行榜，按推荐度排序，并只看 2025 秋。
5. 管理员导入新学期课程和班次，审核新用户的前几条评价，查看审计日志。

---

## 3. 信息架构与路由

### 3.1 路由表

| 路由 | 页面 | 是否需要登录 | 说明 |
|---|---|---|---|
| `/` | 首页 | 否 | 搜索入口、最新评价、榜单预览、写评价入口 |
| `/courses` | 课程库 | 否 | 搜索、学院筛选、课程类型筛选、排序、分页 |
| `/courses/[courseId]` | 课程详情 | 否 | 课程信息、跨班次聚合、班次列表、评价概览 |
| `/offerings/[offeringId]` | 班次详情 | 否 | 具体学期和教师的评价列表、评分分布、写评价入口 |
| `/instructors/[instructorId]` | 教师详情 | 否 | 教师信息、所授课程、聚合评价（P1） |
| `/leaderboards` | 排行榜 | 否 | 推荐度、难度、作业量、热门 |
| `/write/[offeringId]` | 写评价 | 是 | 新建评价，已有评价时跳转编辑 |
| `/write/[offeringId]?edit=[reviewId]` | 编辑评价 | 是 | 仅作者本人，限定时间内可编辑 |
| `/me` | 个人中心 | 是 | 我的评价、收藏、通知概览 |
| `/me/reviews` | 我的评价 | 是 | 状态、编辑、删除 |
| `/me/bookmarks` | 我的收藏 | 是 | 收藏的课程 |
| `/me/notifications` | 通知 | 是 | 审核结果、举报结果、教师回应 |
| `/login` | 登录 | 否 | 邮箱密码登录 |
| `/register` | 注册 | 否 | 邮箱密码注册 |
| `/about/rules` | 评价规范 | 否 | 社区规则、匿名说明 |
| `/about/privacy` | 隐私说明 | 否 | 数据收集和使用说明 |
| `/admin` | 后台首页 | 管理员 | 数据概览 |
| `/admin/courses` | 课程管理 | 管理员 | 课程和班次 CRUD、CSV 导入 |
| `/admin/reviews` | 评价审核 | 审核员/管理员 | 待审核、已隐藏、已删除 |
| `/admin/reports` | 举报处理 | 审核员/管理员 | 举报队列 |
| `/admin/tags` | 标签管理 | 管理员 | 标签增删改 |
| `/admin/users` | 用户管理 | 管理员 | 角色、封禁、解封 |
| `/admin/audit` | 审计日志 | 管理员 | 管理操作记录 |

### 3.2 导航结构

桌面端主导航：

- 翻课程
- 榜单
- 写一页
- 搜索框
- 登录/账号菜单
- 主题切换

移动端主导航：

- 底部或顶部简化为：课程、榜单、写评价、我的
- 搜索框放在课程页顶部
- 主题切换保留在右上角

原型里的“翻课程、榜单、写一页”三个导航文案可以保留，符合校园手账的语气。

---

## 4. 功能范围

### 4.1 P0：第一版必须完成

| 模块 | 功能 | 验收要点 |
|---|---|---|
| 认证 | 注册、登录、登出、Session | 邮箱密码可用，页面刷新后保持登录 |
| 角色 | STUDENT、ADMIN | 后台路由和操作有权限校验 |
| 课程库 | 课程、教师、学期、班次 | 可以创建和查看关联数据 |
| 搜索 | 课程名、教师名、课程代码 | 中文关键词可搜索，结果分页 |
| 筛选 | 学院、课程类型、学期 | 筛选条件进入 URL，可分享和刷新 |
| 课程详情 | 跨班次聚合、班次列表 | 平均分、样本数、分布正确 |
| 班次详情 | 评价列表、评分分布、写评价入口 | 可按最新或最有用排序 |
| 写评价 | 难度、作业量、推荐度、考核方式、文字 | 校验完整，成功后可看到评价 |
| 一人一评 | 同一用户对同一班次只能一条评价 | 数据库唯一约束兜底 |
| 匿名 | 公开页不显示作者身份 | 公开 DTO 不含 userId |
| 我的评价 | 查看、编辑、删除 | 只能操作自己的评价 |
| 有用投票 | 一人一条评价一票 | 不能给自己投票 |
| 举报 | 分类原因、处理状态 | 管理员可处理 |
| 排行榜 | 推荐度、难度、作业量 | 贝叶斯平均，最少 5 条 |
| 小样本保护 | 少于 5 条不显示平均分 | 页面显示“样本不足” |
| 后台审核 | 隐藏、恢复评价 | 隐藏后不参与聚合 |
| 主题 | 亮色默认，暗黑切换 | 刷新后记住选择 |
| 响应式 | 390、768、1024、1440 宽度 | 无横向滚动 |

### 4.2 P1：第一版之后

- 课程收藏。
- 课程对比，最多 3 门。
- 标签系统，预设标签，每条评价最多 5 个。
- 教师认领与回应。
- 按学期趋势图和分数分布图。
- 站内通知。
- CSV 批量导入课程和班次。
- 审计日志。
- 敏感词基础过滤。
- 优质评价标记。

### 4.3 P2：远期

- 申诉流程。
- 贡献者等级和徽章。
- 多学校。
- 学校 SSO 或学号认证。
- AI 评价摘要。
- 个性化推荐。
- 公开只读 API。
- PWA。

### 4.4 明确不做

- 嵌套评论。
- 私信。
- 图片上传。
- 评价点踩。
- 匿名昵称。
- 管理员查看评价作者。
- 实时聊天。
- 复杂推荐算法。

---

## 5. 设计系统：校园手账

### 5.1 设计读取与基调

设计读取：面向学生的课程评价产品，校园原生、轻松、愿意被分享，采用手账和拼贴的视觉语言，以珊瑚色为主强调，奶油纸色和薄荷、天蓝、奶油黄作为纸张色块。

三档参数：

- `DESIGN_VARIANCE: 9`，不对称、贴纸、拼贴、便签式布局。
- `MOTION_INTENSITY: 7`，首屏编排、滚动进入、贴纸弹入，但不做无限循环和滚动劫持。
- `VISUAL_DENSITY: 3`，页面偏宽松，信息用卡片和分隔线组织，不做密集表格。

正式功能页要遵守一个原则：装饰服务于阅读。首页、课程卡片和评价卡片可以保留手账感；表单、后台、表格和筛选器要收敛，不能影响可读性和操作效率。

### 5.2 颜色 Token

亮色：

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#FFFDF5` | 页面背景 |
| `--paper-2` | `#F6F0DF` | 次级背景、页脚 |
| `--sheet` | `#FFFDF5` | 卡片、纸张 |
| `--ink` | `#20201D` | 主文字、边框、偏移阴影 |
| `--muted` | `#5E5C53` | 次级文字 |
| `--line` | `#20201D` | 粗边框 |
| `--rule-soft` | `#C9C2B0` | 虚线和弱分隔 |
| `--coral` | `#FF7A59` | 主强调、主按钮、选中态 |
| `--coral-deep` | `#D95232` | 主按钮 hover |
| `--coral-soft` | `#FFE0D6` | 错误提示、浅强调 |
| `--butter` | `#FFE59A` | 便签纸、提示卡 |
| `--mint` | `#B9E7D0` | 便签纸、成功状态 |
| `--sky` | `#BFD8FF` | 便签纸 |
| `--pink` | `#FFC9D8` | 便签纸、错误状态 |
| `--tape` | `#F3E6B8` | 胶带 |

暗黑：

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#1B1B19` | 页面背景 |
| `--paper-2` | `#23231F` | 次级背景、页脚 |
| `--sheet` | `#24241F` | 卡片、纸张 |
| `--ink` | `#F4EFE3` | 主文字、边框、偏移阴影 |
| `--muted` | `#B7B1A3` | 次级文字 |
| `--line` | `#F4EFE3` | 粗边框 |
| `--rule-soft` | `#4A463D` | 虚线和弱分隔 |
| `--coral` | `#FF8F6E` | 主强调、主按钮、选中态 |
| `--coral-deep` | `#FFB09A` | 主按钮 hover |
| `--coral-soft` | `#4A2219` | 错误提示、浅强调 |
| `--butter` | `#5C4A1C` | 便签纸、提示卡 |
| `--mint` | `#234A3A` | 便签纸、成功状态 |
| `--sky` | `#233A5C` | 便签纸 |
| `--pink` | `#5A2A36` | 便签纸、错误状态 |
| `--tape` | `#6B5A2C` | 胶带 |

规则：

- 珊瑚色是唯一主强调色，其他彩色只作为纸张底色和状态色，不能变成第二个主按钮色。
- 不使用纯黑 `#000000` 和纯白 `#FFFFFF`。
- 暗黑模式不做简单反色，保持纸张层次和珊瑚色的品牌识别。
- 状态不能只靠颜色表达，必须同时有文字或图标。

### 5.3 字体

```css
--font-display: "Arial Rounded MT Bold", "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
--font-body: "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
--font-mono: "Cascadia Mono", "Consolas", monospace;
```

使用规则：

- 页面标题、课程名、评分数字、榜单名次使用 `--font-display`，字重 800 或 900。
- 正文、表单、按钮使用 `--font-body`。
- 课程代码、时间、计数等小元数据使用 `--font-mono`。
- 不下载外部字体。如果 `Arial Rounded MT Bold` 不存在，回退到 `Segoe UI` 并保持 900 字重。
- 中文标题不使用负字距过度压缩，保持可读性。

字号建议：

| 场景 | 字号 |
|---|---|
| 首页主标题 | `clamp(2.5rem, 4.4vw, 4.4rem)` |
| 页面标题 | `clamp(1.9rem, 2.9vw, 2.5rem)` |
| 卡片标题 | `1.25rem` 到 `2rem` |
| 正文 | `13px` 到 `16px` |
| 元数据 | `9px` 到 `11px` |

### 5.4 形状与装饰

- 卡片圆角：18px 到 22px。
- 小卡片和标签：胶囊形。
- 边框：2px 实线 `--ink`。
- 偏移阴影：`6px 6px 0 var(--ink)`，小元素用 3px 到 4px。
- 胶带：半透明 `--tape`，用伪元素实现，宽度 70px 到 90px，轻微旋转。
- 旋转：首页便签卡片可以使用 -3deg 到 3deg。表单、后台、表格、筛选器禁止旋转。
- 背景：奶油纸底加 24px 点阵纹理，点阵透明度要低，不能干扰阅读。
- 按钮：胶囊形，2px 边框，4px 偏移阴影。hover 上移 2px，active 下压 2px。
- 不使用大面积的渐变、玻璃拟态、发光和霓虹。

### 5.5 组件清单

基础组件：

- `ZineButton`：primary、secondary、ghost、danger 四种变体。
- `ZineCard`：paper、butter、mint、sky、pink 五种纸张色。
- `Sticker`：小标签，可旋转。
- `Tag` 和 `TagList`。
- `Tape`：胶带装饰。
- `SectionTitle`。
- `EmptyState`。
- `Skeleton`。
- `Toast`。
- `ConfirmDialog`。
- `ThemeToggle`。
- `StarRating`：展示和输入两种模式。
- `RatingSummary`：平均分、样本数、分布图。
- `PillTabs`：榜单维度切换。
- `SearchInput`。
- `FilterPills`。
- `Pagination`。

业务组件：

- `CourseCard`：课程名、教师、评分、标签、样本数。
- `CourseHeader`：课程代码、学院、学分、课程类型。
- `OfferingCard`：学期、教师、班次、评分、样本数。
- `ReviewCard`：匿名标识、评分、考核方式、正文、标签、有用、举报。
- `ReviewForm`：三个必填评分、两个可选评分、考核方式多选、正文、隐私提示。
- `Leaderboard`：名次、课程、评分、样本数、维度切换。
- `ReviewStatusBadge`。
- `ReportDialog`。
- `BookmarkButton`。
- `SortSelect`。

后台组件：

- `AdminShell`：侧边导航、顶部栏、面包屑。
- `DataTable`：基于 TanStack Table，支持分页、排序、筛选。
- `ImportWizard`：CSV 上传、预览、校验、提交。
- `ModerationQueue`。
- `ReportQueue`。
- `AuditLogTable`。
- `UserRoleSelect`。

### 5.6 动效规范

使用 GSAP 和 ScrollTrigger，React 中通过 `@gsap/react` 的 `useGSAP()` 使用，并在组件卸载时自动清理。

允许的动效：

- 首屏标题逐行上移。
- 首屏按钮和卡片错峰进入。
- 便签卡片弹入，使用 `back.out(1.4)`。
- 滚动进入时轻微上移和淡入。
- 主题切换的图标状态变化。
- 悬停和按下的位移反馈。
- 榜单切换时的分数淡入。

禁止：

- `window.addEventListener("scroll")`。
- 无限循环的背景动画。
- 动画 `width`、`height`、`top`、`left`。
- 滚动劫持和全屏 pin，除非某个页面确实需要。
- 在表单和后台表格上使用旋转、弹跳和胶带。

减少动态：

```css
@media (prefers-reduced-motion: reduce) {
  /* 关闭动画和过渡，保留静态布局 */
}
```

所有 GSAP 动画必须放在 `prefers-reduced-motion: no-preference` 的分支内，或者使用 `gsap.matchMedia()`。

### 5.7 暗黑模式实现

- `<html data-theme="light" suppressHydrationWarning>`。
- 在 `app/layout.tsx` 的 `<head>` 中放一段内联脚本，在首次绘制前读取 `localStorage.getItem("course-review-theme")`，只接受 `light` 和 `dark` 两个值。
- 默认亮色，不读取 `prefers-color-scheme`。
- 切换按钮使用 `aria-pressed` 和 `aria-label`。
- 主题状态放在客户端组件 `ThemeProvider` 中，避免整页重渲染。
- 所有颜色通过 CSS 变量切换，不在组件里写死十六进制色值。

### 5.8 响应式

断点：

- `1440px`：桌面主视图。
- `1024px`：双栏变单栏，侧边装饰减少。
- `768px`：导航折叠，卡片单列或双列。
- `390px`：移动端，单列，去掉旋转，按钮最小高度 44px。

明确规则：

- 首页拼贴区域在 640px 以下改为静态网格，去掉绝对定位和旋转。
- 课程卡片在 768px 以下单列。
- 榜单在移动端隐藏星标，只保留分数和课程名。
- 表单的评分行在移动端压缩为 64px 标签列。
- 后台表格在移动端改为卡片列表，或者只保证桌面使用。

### 5.9 可访问性

- 正文对比度达到 WCAG AA，标题尽量达到 AAA。
- 所有输入有可见 label，不使用 placeholder 当 label。
- 星级评分使用 `role="radiogroup"`，支持左右方向键。
- 表单错误信息用 `aria-live="polite"`，并关联到字段。
- Dialog 使用 Radix，焦点锁定和 Esc 关闭由原语处理。
- 所有图标按钮有 `aria-label`。
- 键盘 Tab 顺序符合视觉顺序。
- 图片有 alt，装饰图片 alt 为空。
- 焦点样式使用 2px 或 3px 珊瑚色外框，不能只靠浏览器默认。
- 页面标题层级正确，每页一个 h1。
- 不使用仅靠颜色表达的状态。

### 5.10 文案规范

- 语气：校园、具体、克制，不卖萌。
- 不使用 emoji。
- 不使用 em dash 或 en dash 作为排版符号，统一使用普通连字符或中文标点。
- 不使用“赋能、闭环、打通、极致、颠覆”等空泛词。
- 评分语义写清楚：
  - 难度：1 很轻松，5 很难。
  - 作业量：1 很少，5 很多。
  - 推荐度：1 不推荐，5 强烈推荐。
- 匿名展示统一写“匿名同学”，不显示昵称、头像、主页。
- 演示数据在页脚标注“设计演示，数据为示例”，正式数据上线后移除。
- 不写虚假精确数字，统计数字必须来自数据库或明确标注为示例。

### 5.11 视觉验收清单

- [ ] 默认亮色，切换暗黑后所有页面层级仍清晰。
- [ ] 珊瑚色是唯一主强调色。
- [ ] 卡片 18px 到 22px 圆角，按钮胶囊形。
- [ ] 卡片有 2px 边框和偏移阴影。
- [ ] 首页保留点阵纸背景和便签拼贴。
- [ ] 表单和后台没有旋转、胶带和弹跳动画。
- [ ] 移动端没有横向滚动。
- [ ] 没有 em dash 和 emoji。
- [ ] 没有纯黑和纯白。
- [ ] 所有交互有 hover、focus、active 状态。
- [ ] 空状态、加载状态、错误状态都存在。
- [ ] 减少动态模式下动画关闭。
- [ ] 键盘可以完成登录、搜索、评分和提交。

---

## 6. 数据模型

### 6.1 建模原则

1. 评价挂在开课班次上，不直接挂在课程上。
2. 评价正文和作者身份分表存储。
3. 公开查询永远不 join 作者映射表。
4. 课程、教师、学期、班次都是显式实体。
5. 聚合统计只统计已发布评价。
6. 删除采用软删除，保留审计和恢复能力。

### 6.2 Prisma Schema 草案

以下为业务模型草案。Better Auth 需要的认证表由 Better Auth CLI 生成后再合并，不要手写认证表。

```prisma
enum UserRole {
  STUDENT
  INSTRUCTOR
  MODERATOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum CourseType {
  REQUIRED
  ELECTIVE
  GENERAL
  PRACTICE
}

enum ReviewStatus {
  PENDING
  PUBLISHED
  HIDDEN
  DELETED
}

enum ReportReason {
  PERSONAL_ATTACK
  PRIVACY
  AD
  FALSE_INFO
  OFF_TOPIC
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  REJECTED
}

model User {
  id            String     @id @default(cuid())
  name          String
  email         String     @unique
  emailVerified Boolean    @default(false)
  image         String?
  role          UserRole   @default(STUDENT)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  reviewsAuthored ReviewAuthor[]
  votes           ReviewVote[]
  reports         Report[]       @relation("Reporter")
  handledReports  Report[]       @relation("Handler")
  bookmarks       Bookmark[]
  notifications   Notification[]
  auditLogs       AuditLog[]     @relation("Actor")
}

model College {
  id          String      @id @default(cuid())
  name        String      @unique
  courses     Course[]
  instructors Instructor[]
}

model Course {
  id          String     @id @default(cuid())
  code        String     @unique
  name        String
  credits     Float?
  type        CourseType @default(ELECTIVE)
  description String?
  collegeId   String?
  college     College?   @relation(fields: [collegeId], references: [id])
  offerings   Offering[]
  bookmarks   Bookmark[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([name])
  @@index([collegeId])
}

model Instructor {
  id          String   @id @default(cuid())
  name        String
  title       String?
  collegeId   String?
  college     College? @relation(fields: [collegeId], references: [id])
  isVerified  Boolean  @default(false)
  offerings   OfferingInstructor[]
  responses   InstructorResponse[]
  createdAt   DateTime @default(now())

  @@index([name])
}

model Term {
  id        String     @id @default(cuid())
  name      String     @unique
  startsOn  DateTime?
  endsOn    DateTime?
  isCurrent Boolean    @default(false)
  offerings Offering[]
}

model Offering {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id])
  termId      String
  term        Term     @relation(fields: [termId], references: [id])
  section     String   @default("01")
  campus      String?
  instructors OfferingInstructor[]
  reviews     Review[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([courseId, termId, section])
  @@index([courseId])
  @@index([termId])
}

model OfferingInstructor {
  offeringId   String
  instructorId String
  role         String?  @default("PRIMARY")
  offering     Offering   @relation(fields: [offeringId], references: [id], onDelete: Cascade)
  instructor   Instructor @relation(fields: [instructorId], references: [id], onDelete: Cascade)

  @@id([offeringId, instructorId])
}

model Review {
  id             String       @id @default(cuid())
  offeringId     String
  offering       Offering     @relation(fields: [offeringId], references: [id])
  difficulty     Int
  workload       Int
  recommendation Int
  grading        Int?
  teaching       Int?
  assessment     String[]
  content        String
  status         ReviewStatus @default(PUBLISHED)
  helpfulCount   Int          @default(0)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  editedAt       DateTime?
  hiddenAt       DateTime?
  hiddenReason   String?

  author       ReviewAuthor?
  votes        ReviewVote[]
  tags         ReviewTag[]
  reports      Report[]
  response     InstructorResponse?

  @@index([offeringId, status, createdAt])
  @@index([status, createdAt])
}

model ReviewAuthor {
  reviewId   String   @id
  userId     String
  offeringId String
  createdAt  DateTime @default(now())
  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, offeringId])
  @@index([offeringId])
}

model ReviewVote {
  reviewId  String
  userId    String
  createdAt DateTime @default(now())
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([reviewId, userId])
  @@index([userId])
}

model Tag {
  id        String      @id @default(cuid())
  name      String      @unique
  slug      String      @unique
  isActive  Boolean     @default(true)
  reviews   ReviewTag[]
  createdAt DateTime    @default(now())
}

model ReviewTag {
  reviewId String
  tagId    String
  review   Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([reviewId, tagId])
  @@index([tagId])
}

model Report {
  id             String       @id @default(cuid())
  reviewId       String
  reporterId     String
  reason         ReportReason
  detail         String?
  status         ReportStatus @default(PENDING)
  handledById    String?
  handledAt      DateTime?
  resolutionNote String?
  createdAt      DateTime     @default(now())

  review    Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  reporter  User   @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  handledBy User?  @relation("Handler", fields: [handledById], references: [id])

  @@index([reviewId])
  @@index([status, createdAt])
}

model Bookmark {
  userId    String
  courseId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@id([userId, courseId])
  @@index([courseId])
}

model InstructorResponse {
  id           String   @id @default(cuid())
  reviewId     String   @unique
  instructorId String
  content      String
  status       ReviewStatus @default(PENDING)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  review     Review     @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  instructor Instructor @relation(fields: [instructorId], references: [id], onDelete: Cascade)

  @@index([instructorId])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  payload   Json?
  readAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt, createdAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  action     String
  targetType String
  targetId   String?
  metadata   Json?
  createdAt  DateTime @default(now())
  actor      User?    @relation("Actor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([actorId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

### 6.3 关键索引与扩展

在第一个 migration 中加入：

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

课程搜索使用 trigram 索引，Prisma schema 不支持直接声明，需要手写 migration：

```sql
CREATE INDEX "Course_name_trgm_idx" ON "Course" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Course_code_trgm_idx" ON "Course" USING GIN ("code" gin_trgm_ops);
CREATE INDEX "Instructor_name_trgm_idx" ON "Instructor" USING GIN ("name" gin_trgm_ops);
```

举报的“同一用户对同一评价只能有一条未处理举报”还需要一个部分唯一索引：

```sql
CREATE UNIQUE INDEX "Report_one_open_per_user_review"
ON "Report" ("reviewId", "reporterId")
WHERE "status" IN ('PENDING', 'REVIEWING');
```

其他必须的索引已经在 schema 中列出。上线前用 `EXPLAIN ANALYZE` 检查搜索和聚合查询。

### 6.4 聚合方式

MVP 直接使用 Prisma 的 `aggregate` 和 `groupBy` 查询：

- 班次平均分：按 `offeringId` 和 `status = PUBLISHED` 聚合。
- 课程平均分：先取课程下所有班次，再按班次汇总，使用加权平均。
- 教师平均分：取教师所有班次。
- 分布：按 1 到 5 分组计数。

如果数据量增长，再增加 `OfferingStats` 表或 PostgreSQL materialized view。第一版不要提前做。

---

## 7. 关键业务规则

### 7.1 一人一评

- 数据库唯一约束：`ReviewAuthor(userId, offeringId)`。
- 服务端创建评价前先检查是否已存在。
- 已存在时，写评价页跳转到编辑页。
- 同一用户重修同一门课但不同学期时，`offeringId` 不同，允许再写一条。
- 同一班次多位教师时，仍然只允许一条评价，评价对象是班次。

### 7.2 编辑与删除

- 发布后 7 天内作者可以编辑。
- 编辑后设置 `editedAt`，页面显示“已编辑”。
- 7 天后不可编辑，页面提示联系管理员。
- 作者可以软删除自己的评价，状态改为 `DELETED`。
- 管理员可以隐藏评价，状态改为 `HIDDEN`。
- 隐藏和删除的评价不参与聚合和排行榜。
- 已删除的账号：保留评价正文，删除 `ReviewAuthor` 映射，用户失去编辑权。这样既保留内容，也避免账号删除导致评价消失。

### 7.3 小样本保护

- 样本数少于 5 条时，不显示平均分、不显示分布图。
- 页面显示“样本不足，暂不显示分数”。
- 单条评价仍然可以展示，但不显示作者、精确时间和任何可推断身份的信息。
- 排行榜只收录样本数大于等于 5 的课程。

### 7.4 评分

- `difficulty`、`workload`、`recommendation` 必填，整数 1 到 5。
- `grading`、`teaching` 可选，整数 1 到 5。
- 展示平均分保留一位小数，星星使用半星表示。
- 评分语义必须在表单和帮助文本中写清楚。

### 7.5 考核方式

预设值：

- 闭卷考试
- 开卷考试
- 课程论文
- 大作业
- 实验实践
- 口试或展示
- 点名或出勤
- 平时分

存储为 `String[]`，服务端使用 Zod 枚举白名单校验。第一版不做考核方式统计，P1 再加。

### 7.6 有用投票

- 只有登录用户可以投票。
- 每条评价每人只能投一次。
- 不能给自己的评价投票。
- 不提供“踩”。
- `Review.helpfulCount` 使用事务更新，或者定期从 `ReviewVote` 重算。
- 排序“最有用”时按 `helpfulCount` 降序，再按时间降序。

### 7.7 举报

- 举报原因使用固定枚举。
- 同一用户对同一评价只能有一条未处理举报。
- 举报人不能举报自己的评价。
- 举报进入队列，状态为 `PENDING`。
- 管理员可以标记为 `REVIEWING`，处理后设为 `RESOLVED` 或 `REJECTED`。
- 处理结果通知举报人（P1）。
- 恶意举报会被限流，严重时暂停账号。

### 7.8 标签

- 第一版使用预设标签，不允许用户自由创建。
- 每条评价最多 5 个标签。
- 标签示例：干货多、作业多、不点名、给分好、论文多、实验多、讨论多、硬核、轻松、考试原题。
- 标签计数按已发布评价统计。
- 标签的增删改由管理员操作。

### 7.9 排行榜

维度：

- 推荐度
- 难度
- 作业量

规则：

- 只统计 `PUBLISHED` 评价。
- 至少 5 条评价才进入榜单。
- 使用贝叶斯平均，避免一条五星刷到第一：

```text
score = (v / (v + m)) * R + (m / (v + m)) * C
```

- `v` 是评价数。
- `R` 是该课程的平均分。
- `C` 是全站同维度平均分，缓存 1 小时。
- `m` 取 10。
- 支持学期筛选。选择学期后，只统计该学期班次的评价。
- 榜单默认显示前 20 名。

### 7.10 课程与班次数据

- 课程代码唯一。
- 同一课程同一学期同一班次唯一。
- 教师按姓名和学院组合去重。
- 管理员可以手动创建，也可以 CSV 导入。
- 不爬取教务系统，不从未授权来源抓取数据。

---

## 8. 匿名与隐私设计

### 8.1 核心原则

前台匿名，后台可追责。

- 公开页面不显示作者身份。
- 系统内部保留评价与账号的映射，用于防重复、权限和治理。
- 管理员默认不提供查看作者身份的入口。
- 第一版不实现去匿名化功能。

### 8.2 技术实现

1. `Review` 表没有 `userId`、`email`、`authorName` 字段。
2. 作者映射放在独立表 `ReviewAuthor`。
3. 公开查询只使用 `select` 白名单，不使用 `include: { author: true }`。
4. 公共 DTO 由 `toPublicReview()` 显式映射，禁止直接返回 Prisma 实体。
5. 公开页面显示“匿名同学”和学期，例如“匿名同学 · 2025 秋”。
6. 不显示具体发布时间，只显示年月。
7. 不显示设备、IP、浏览器、地理位置。
8. 用户主页不展示其评价列表。
9. 评价卡片不链接到用户主页。
10. 管理员审核界面默认只显示评价内容和状态，不显示作者。
11. 日志中不记录评价正文和用户邮箱。
12. 账号注销时删除 `ReviewAuthor` 映射，保留评价正文。

### 8.3 小样本与反推断

- 少于 5 条评价不展示平均分和分布。
- 不展示“同班同学还评了哪些课”。
- 不展示“该用户的其他评价”。
- 不展示精确时间线。
- 评价正文中如果包含教师住址、电话、身份证号等个人信息，审核时隐藏。
- 教师姓名可以展示，但禁止人身攻击和隐私泄露。

### 8.4 管理员与去匿名化

- 第一版不提供去匿名化入口。
- 如果未来因法律或安全原因需要，必须满足：
  - 只有超级管理员可以发起。
  - 需要第二位管理员审批。
  - 必须记录审计日志。
  - 只能查看单条评价的映射，不能批量导出。
  - 申请人必须填写理由。
- 这个流程不在 MVP 范围内。

### 8.5 合规提示

- 公开运营的 UGC 产品通常需要“后台实名、前台匿名”的账号体系。
- 正式公开前需要用户协议、隐私政策、内容审核机制、举报和申诉渠道。
- 如果未来部署到公网，国内环境还涉及 ICP 备案和公安备案。
- 本项目当前只做本地开发，不对外提供服务。

---

## 9. 权限矩阵

| 操作 | 游客 | 学生 | 教师 | 审核员 | 管理员 |
|---|---|---|---|---|---|
| 浏览课程和评价 | 是 | 是 | 是 | 是 | 是 |
| 搜索和筛选 | 是 | 是 | 是 | 是 | 是 |
| 写评价 | 否 | 是 | 是 | 是 | 是 |
| 编辑自己的评价 | 否 | 是 | 是 | 是 | 是 |
| 删除自己的评价 | 否 | 是 | 是 | 是 | 是 |
| 点有用 | 否 | 是 | 是 | 是 | 是 |
| 举报 | 否 | 是 | 是 | 是 | 是 |
| 收藏课程 | 否 | 是 | 是 | 是 | 是 |
| 教师回应 | 否 | 否 | 是 | 否 | 是 |
| 隐藏或恢复评价 | 否 | 否 | 否 | 是 | 是 |
| 处理举报 | 否 | 否 | 否 | 是 | 是 |
| 课程和班次 CRUD | 否 | 否 | 否 | 否 | 是 |
| CSV 导入 | 否 | 否 | 否 | 否 | 是 |
| 标签管理 | 否 | 否 | 否 | 否 | 是 |
| 用户角色和封禁 | 否 | 否 | 否 | 否 | 是 |
| 查看审计日志 | 否 | 否 | 否 | 否 | 是 |
| 查看评价作者 | 否 | 否 | 否 | 否 | 否 |

权限校验位置：

- 页面层：受保护布局中读取 session，未登录跳转登录页。
- Server Action 层：每次写操作重新校验 session 和角色。
- 数据层：查询时带上 `userId` 或角色条件，不能只依赖前端隐藏按钮。

---

## 10. 技术架构

### 10.1 渲染与数据流

- 公开页面使用 Server Components 直接查询数据库。
- 交互组件使用 Client Components，例如主题切换、搜索框、评分输入、榜单切换、弹窗。
- 写操作使用 Server Actions。
- 搜索和筛选使用 URL search params，服务端读取并查询。
- 分页使用 `page` 和 `pageSize`，第一版用 offset 分页即可。
- 使用 `revalidatePath` 在写操作后刷新相关页面。
- 不做复杂的客户端缓存。第一版以正确性优先。

### 10.2 目录结构

```text
src/
  app/
    (public)/
      page.tsx
      courses/
        page.tsx
        [courseId]/page.tsx
      offerings/[offeringId]/page.tsx
      instructors/[instructorId]/page.tsx
      leaderboards/page.tsx
      about/
        rules/page.tsx
        privacy/page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
    (member)/
      me/
        page.tsx
        reviews/page.tsx
        bookmarks/page.tsx
        notifications/page.tsx
      write/[offeringId]/page.tsx
    admin/
      layout.tsx
      page.tsx
      courses/page.tsx
      reviews/page.tsx
      reports/page.tsx
      tags/page.tsx
      users/page.tsx
      audit/page.tsx
    api/
      health/route.ts
      search/suggestions/route.ts
    layout.tsx
    globals.css
    not-found.tsx
    error.tsx
  components/
    layout/
      SiteHeader.tsx
      SiteFooter.tsx
      MobileNav.tsx
      ThemeToggle.tsx
    zine/
      ZineButton.tsx
      ZineCard.tsx
      Sticker.tsx
      Tag.tsx
      Tape.tsx
      StarRating.tsx
      RatingSummary.tsx
      EmptyState.tsx
      Skeleton.tsx
      Toast.tsx
    course/
      CourseCard.tsx
      CourseHeader.tsx
      OfferingCard.tsx
      FilterPills.tsx
      SearchInput.tsx
      Pagination.tsx
    review/
      ReviewCard.tsx
      ReviewForm.tsx
      HelpfulButton.tsx
      ReportDialog.tsx
      ReviewStatusBadge.tsx
    leaderboard/
      Leaderboard.tsx
      LeaderboardTabs.tsx
    admin/
      AdminShell.tsx
      DataTable.tsx
      ImportWizard.tsx
      ModerationQueue.tsx
      ReportQueue.tsx
      AuditLogTable.tsx
  lib/
    auth.ts
    db.ts
    env.ts
    theme.tsx
    permissions.ts
    rate-limit.ts
    ranking.ts
    anonymity.ts
    format.ts
    constants.ts
    validation/
      review.ts
      report.ts
      course.ts
      admin.ts
  server/
    actions/
      auth.ts
      review.ts
      vote.ts
      report.ts
      bookmark.ts
      instructor.ts
      admin.ts
    queries/
      courses.ts
      offerings.ts
      reviews.ts
      leaderboards.ts
      admin.ts
  styles/
    tokens.css
    zine.css
prisma/
  schema.prisma
  seed.ts
  migrations/
public/
  images/
tests/
  unit/
  integration/
  e2e/
scripts/
  reset-test-db.ts
docs/
  DEVELOPMENT.md
```

### 10.3 认证

使用 Better Auth：

- 邮箱密码登录。
- 本地开发关闭邮箱验证。
- Session 存储在数据库。
- `User` 表扩展 `role`、`status`。
- 使用 Better Auth CLI 生成认证模型：

```bat
npx @better-auth/cli@latest generate
```

- 认证配置放在 `src/lib/auth.ts`。
- 服务端读取 session：

```ts
const session = await auth.api.getSession({ headers: await headers() });
```

- 需要登录的布局和 Server Action 都要重新校验。
- 第一版不接第三方登录。
- 第一版不接邮件服务。注册后直接可用。
- 种子数据包含演示账号，密码只用于本地。

### 10.4 环境变量

`.env.example`：

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/course_review?schema=public"
DATABASE_URL_TEST="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/course_review_test?schema=public"
BETTER_AUTH_SECRET="replace-with-a-long-random-string"
BETTER_AUTH_URL="http://127.0.0.1:3000"
REDIS_URL="redis://127.0.0.1:6379"
NODE_ENV="development"
```

`.env.local` 不提交。

### 10.5 数据库连接

Prisma 7 使用 PostgreSQL driver adapter：

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
```

注意：Prisma 7 的生成器、配置文件和客户端输出目录以官方 7.x 文档为准。不要照搬 Prisma 5 或 6 的教程。

### 10.6 校验与错误

- 所有 Server Action 输入使用 Zod 校验。
- 所有数据库写操作先做权限校验，再做业务校验。
- 统一返回类型：

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```

- 表单错误显示在字段下方。
- 成功操作使用 Toast 或内联成功提示。
- 数据库错误不直接暴露给用户。
- 404 和 500 使用统一错误页。

### 10.7 限流

使用 Redis 实现滑动窗口或固定窗口。Redis 不可用时回退到内存 Map，仅用于本地开发。

建议限制：

| 操作 | 限制 |
|---|---|
| 登录 | 10 次/分钟/IP |
| 注册 | 5 次/小时/IP |
| 发评价 | 5 条/小时/用户，20 条/天/用户 |
| 编辑评价 | 10 次/天/用户 |
| 点有用 | 60 次/小时/用户 |
| 举报 | 5 次/天/用户 |
| 搜索建议 | 60 次/分钟/IP |
| 管理员登录 | 5 次/分钟/IP |

新账号冷却：

- 注册后 10 分钟内不能发评价。
- 新账号前 3 条评价进入 `PENDING`，人工审核后发布。
- 这些参数放在 `src/lib/constants.ts`，方便调整。

### 10.8 搜索

第一版使用 PostgreSQL：

- `pg_trgm` 扩展。
- `ILIKE '%keyword%'` 做基础匹配。
- `similarity()` 做排序加权。
- 课程名、课程代码、教师名都建 GIN trigram 索引。
- 搜索结果排序：完全匹配优先，其次前缀匹配，其次相似度，最后按评价数。
- 1 到 2 个汉字的短关键词可能无法命中索引，允许回退到 `ILIKE` 扫描。数据量小的时候可以接受。

不使用 Meilisearch。等数据量和搜索体验成为瓶颈时再引入。

### 10.9 CSV 导入

模板列：

```csv
course_code,course_name,credits,course_type,college,instructor,term,section
CS301,操作系统,4,REQUIRED,计算机学院,王砚秋,2025-2026-1,01
CS202,数据结构,4,REQUIRED,计算机学院,林知夏,2025-2026-1,01
```

规则：

- `course_code`、`course_name`、`college`、`instructor`、`term` 必填。
- `credits` 为 0 到 10 的数字。
- `course_type` 使用枚举值。
- `section` 为空时默认 `01`。
- 先预览前 20 行，展示新增、更新、跳过和错误行。
- 提交时使用事务。
- 重复课程按 `course_code` 合并。
- 重复班次按 `course_code + term + section` 合并。
- 导入结果返回统计和错误列表。
- 不删除已有数据，只新增或更新。

### 10.10 图表

- 使用 Recharts。
- 评分分布使用 5 根柱状图，从 1 到 5。
- 学期趋势使用折线图，按学期聚合推荐度。
- 图表颜色使用珊瑚色和弱化的纸张色，不使用彩虹色。
- 图表必须有文字标签和可读的 tooltip。
- 小样本不渲染图表，显示空状态。

### 10.11 动效

- 使用 `@gsap/react` 的 `useGSAP()`。
- 首屏动画在 `useGSAP` 的 scope 内创建。
- 滚动动画使用 `ScrollTrigger.batch`。
- 所有动画在 `prefers-reduced-motion: reduce` 时跳过。
- 只动画 `transform` 和 `opacity`。
- 组件卸载时由 `useGSAP` 自动清理。

### 10.12 样式组织

- `src/styles/tokens.css` 放颜色、字体、间距、圆角、阴影变量。
- `src/styles/zine.css` 放胶带、纸张、贴纸、偏移阴影等可复用视觉类。
- Tailwind 用于布局和间距。
- 复杂装饰用组件级 CSS Module 或普通 CSS 类，不堆一长串 arbitrary values。
- 不在组件中写死颜色值。
- 后台页面使用 `admin` 变体：同样的颜色变量，但去掉旋转、胶带和弹跳，增加表格密度。

### 10.13 NPM 脚本

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "check": "tsc --noEmit && biome check . && vitest run",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:test:reset": "tsx scripts/reset-test-db.ts",
    "prototype": "node design/server.js",
    "capture": "node design/scripts/capture.js"
  }
}
```

说明：

- `dev` 是正式 Next.js 应用。
- `prototype` 保留静态原型预览，不参与正式构建。
- `capture` 用于重新生成设计截图。

### 10.14 本地启动流程

1. 启动 PostgreSQL。需要管理员 CMD 或 PowerShell：

```bat
net start postgresql-x64-18
```

2. 创建数据库：

```bat
psql -U postgres -c "CREATE DATABASE course_review;"
psql -U postgres -c "CREATE DATABASE course_review_test;"
```

3. 安装依赖：

```bat
npm install
```

4. 配置 `.env.local`。

5. 生成认证表并迁移：

```bat
npx prisma migrate dev --name init
npx @better-auth/cli@latest generate
npx prisma migrate dev --name auth
```

6. 初始化种子数据：

```bat
npm run db:seed
```

7. 启动开发服务器：

```bat
npm run dev
```

8. 打开 `http://127.0.0.1:3000`。

### 10.15 从当前原型迁移到 Next.js

当前目录是静态原型。正式开发时按以下方式整理：

1. 保留 `design/` 作为视觉参考和静态原型。
2. 把根目录的 `server.js` 移到 `design/server.js`，或删除。
3. 把 `scripts/capture.js` 移到 `design/scripts/capture.js`，并修正路径。
4. 根目录 `package.json` 改为 Next.js 应用配置。
5. 原型依赖 `gsap` 和 `@phosphor-icons/web` 可以保留；正式应用增加 `@phosphor-icons/react` 和 `@gsap/react`。
6. 把 `design/assets/` 的图片复制到 `public/images/`。
7. 不把 `design/` 放进 Next.js 的 `app` 或 `public`，它只作为静态参考。
8. 先提交一次原型快照，再开始 Next.js 改造。

### 10.16 生产构建验证

虽然不部署，也要验证本地生产构建：

```bat
npm run build
npm run start
```

检查：

- 构建无类型错误。
- 页面可访问。
- 图片和字体路径正确。
- 没有引入服务端专用模块到客户端组件。
- 没有 hydration mismatch。

---

## 11. 页面规格

### 11.1 首页 `/`

目标：让第一次访问的人知道这里能做什么，并快速进入课程或写评价。

内容：

1. 顶部导航。
2. 首屏标题：“选课别开盲盒，先翻翻大家的手账。”
3. 副标题：“真实评价，匿名写下。”
4. 主按钮：“翻课程”。
5. 次按钮：“写一页”。
6. 右侧手账拼贴：课程便签、评分、匿名贴纸、照片。
7. 最近大家在聊：最新 4 到 6 条评价，使用便签卡片。
8. 本周榜单预览：推荐度前 5。
9. 写评价提示区：三个写作提示和匿名说明。
10. 页脚。

数据：

- 最新评价：`Review` 按 `createdAt` 降序，状态 `PUBLISHED`，关联班次和课程。
- 榜单：贝叶斯平均前 5。
- 统计：课程数、评价数、教师数。

状态：

- 加载骨架：拼贴和便签卡片占位。
- 空状态：没有评价时显示“还没有评价，来写第一条”。
- 错误状态：数据库不可用时显示友好提示。

动效：

- 首屏标题逐行进入。
- 便签卡片错峰弹入。
- 滚动进入时轻微上移。

### 11.2 课程库 `/courses`

目标：搜索和筛选课程。

内容：

- 搜索框，label 为“搜索课程、教师或课程代码”。
- 学院筛选。
- 课程类型筛选。
- 学期筛选。
- 排序：推荐度、评价数、最新。
- 课程卡片网格。
- 分页。

URL 参数：

```text
?q=操作系统&college=计算机学院&type=REQUIRED&term=2025-2026-1&sort=recommendation&page=1
```

课程卡片：

- 课程名。
- 课程代码。
- 学院。
- 教师。
- 推荐度，样本不足时显示“样本不足”。
- 评价数。
- 标签。

状态：

- 加载骨架。
- 无结果空状态，提供“清除筛选”。
- 搜索词高亮。

### 11.3 课程详情 `/courses/[courseId]`

目标：展示一门课的整体情况。

内容：

- 课程头部：课程名、代码、学分、类型、学院。
- 总体评分：推荐度、难度、作业量，样本数。
- 评分分布。
- 学期趋势（P1）。
- 班次列表：学期、教师、班次、评分、样本数。
- 评价概览：最新 3 条。
- 收藏按钮。
- 写评价入口。

规则：

- 总体样本少于 5 条时只显示样本数，不显示平均分。
- 班次样本少于 5 条时同样处理。
- 课程页的评价列表只显示已发布评价。

### 11.4 班次详情 `/offerings/[offeringId]`

目标：查看具体学期和教师的评价，并提供写评价入口。

内容：

- 班次头部：课程名、学期、教师、班次。
- 评分汇总和分布。
- 考核方式统计（P1）。
- 标签云。
- 排序：最有用、最新、最高分、最低分。
- 评价列表。
- 教师回应（P1）。
- 写评价按钮。
- 如果当前用户已评价，按钮变为“编辑我的评价”。

评价卡片：

- 匿名标识。
- 学期。
- 难度、作业量、推荐度。
- 考核方式标签。
- 正文。
- 标签。
- 有用按钮和数量。
- 举报按钮。
- “已编辑”标识。
- 教师回应。

### 11.5 教师详情 `/instructors/[instructorId]`（P1）

- 教师姓名、学院、职称。
- 所授课程列表。
- 聚合评分。
- 最新评价。

### 11.6 排行榜 `/leaderboards`

内容：

- 标题：“本周榜单”。
- 维度切换：推荐度、难度、作业量。
- 学期筛选。
- 榜单列表：名次、课程、教师、分数、样本数。
- 规则说明：贝叶斯平均，至少 5 条评价。

状态：

- 切换维度时更新排序和分数。
- 无数据时显示空状态。
- 样本不足的课程不显示在榜单中。

### 11.7 写评价 `/write/[offeringId]`

内容：

- 课程和班次信息，只读。
- 三个必填评分：难度、作业量、推荐度。
- 两个可选评分：给分友好度、教学质量。
- 考核方式多选。
- 评价正文，最少 10 个字符，最多 2000 个字符。
- 标签选择，最多 5 个。
- 隐私说明。
- 提交按钮。
- 取消按钮。

交互：

- 星级评分支持鼠标和键盘。
- 考核方式使用 chip 多选。
- 实时显示字数。
- 提交中禁用按钮并显示加载状态。
- 成功后跳转到班次详情，并 Toast 提示“评价已发布”。
- 新账号评价进入待审核时，提示“评价已提交，审核后展示”。
- 已评价时跳转到编辑页。
- 超过 7 天时禁止编辑。

### 11.8 我的评价 `/me/reviews`

- 评价列表：课程、班次、状态、时间、编辑、删除。
- 状态：已发布、待审核、已隐藏、已删除。
- 已隐藏评价显示原因。
- 删除需要二次确认。

### 11.9 登录和注册

登录：

- 邮箱。
- 密码。
- 登录按钮。
- 错误提示。
- 演示账号提示。

注册：

- 邮箱。
- 密码。
- 确认密码。
- 注册按钮。
- 密码规则说明。
- 用户协议和隐私说明链接。

### 11.10 后台

后台使用冷静版本的手账配色，不使用旋转和胶带。

后台首页：

- 今日新增评价。
- 待审核评价。
- 待处理举报。
- 课程数、评价数、用户数。
- 最近审计日志。

课程管理：

- 课程列表。
- 新建和编辑课程。
- 班次列表。
- CSV 导入。
- 删除前检查关联数据。

评价审核：

- 待审核列表。
- 已发布、已隐藏、已删除筛选。
- 隐藏、恢复、删除。
- 隐藏原因必填。
- 操作写入审计日志。

举报处理：

- 举报列表。
- 查看评价内容。
- 标记处理中、已解决、已驳回。
- 处理备注。
- 操作写入审计日志。

用户管理：

- 用户列表。
- 角色修改。
- 封禁和解封。
- 封禁原因必填。
- 操作写入审计日志。

审计日志：

- 时间、操作人、动作、目标、备注。
- 只读。
- 支持按动作和目标类型筛选。

---

## 12. Server Actions 与数据契约

### 12.1 统一约定

- 所有写操作都是 Server Actions。
- 所有 Action 以 `"use server"` 开头。
- 所有 Action 先校验登录和权限。
- 所有 Action 输入使用 Zod。
- 所有 Action 返回 `ActionResult`。
- 写操作后调用 `revalidatePath`。
- 不把 Prisma 实体直接返回给客户端。

### 12.2 主要 Action

| Action | 权限 | 输入 | 副作用 |
|---|---|---|---|
| `createReview` | 登录学生 | offeringId、评分、考核方式、正文、标签 | 创建 Review 和 ReviewAuthor，刷新班次页 |
| `updateReview` | 作者本人，7 天内 | reviewId、评分、正文、标签 | 更新 Review，设置 editedAt |
| `deleteReview` | 作者本人 | reviewId | 状态改为 DELETED |
| `toggleHelpful` | 登录用户，非作者 | reviewId | 新增或删除 ReviewVote，更新计数 |
| `createReport` | 登录用户，非作者 | reviewId、reason、detail | 创建 Report，检查重复和限流 |
| `toggleBookmark` | 登录用户 | courseId | 新增或删除 Bookmark |
| `submitInstructorResponse` | 认证教师 | reviewId、content | 创建或更新教师回应（P1） |
| `hideReview` | 审核员/管理员 | reviewId、reason | 状态改为 HIDDEN，写审计日志 |
| `restoreReview` | 审核员/管理员 | reviewId | 状态改为 PUBLISHED，写审计日志 |
| `resolveReport` | 审核员/管理员 | reportId、status、note | 更新举报状态，写审计日志 |
| `importCourses` | 管理员 | CSV 行数组 | 事务导入课程、教师、班次，返回统计 |
| `upsertCourse` | 管理员 | 课程字段 | 新建或更新课程 |
| `upsertOffering` | 管理员 | 班次字段 | 新建或更新班次 |
| `setUserRole` | 管理员 | userId、role | 修改角色，写审计日志 |
| `setUserStatus` | 管理员 | userId、status、reason | 封禁或解封，写审计日志 |

### 12.3 查询函数

放在 `src/server/queries/`，只被 Server Components 调用：

- `getHomeData()`
- `searchCourses(params)`
- `getCourseDetail(courseId)`
- `getOfferingDetail(offeringId, sort)`
- `getInstructorDetail(instructorId)`
- `getLeaderboard(dimension, termId)`
- `getMyReviews(userId)`
- `getMyBookmarks(userId)`
- `getAdminDashboard()`
- `getAdminReviews(filters)`
- `getAdminReports(filters)`
- `getAuditLogs(filters)`

每个查询都显式 `select` 需要的字段，不返回 `ReviewAuthor`。

### 12.4 公共 DTO

```ts
type PublicReview = {
  id: string;
  offeringId: string;
  difficulty: number;
  workload: number;
  recommendation: number;
  grading: number | null;
  teaching: number | null;
  assessment: string[];
  content: string;
  tags: { id: string; name: string }[];
  helpfulCount: number;
  createdAt: string;
  editedAt: string | null;
  status: "PUBLISHED";
  instructorResponse: { content: string } | null;
};
```

禁止字段：

- `userId`
- `email`
- `authorId`
- `reviewAuthor`
- `ip`
- `userAgent`

用一个映射函数 `toPublicReview(review)` 生成 DTO，并写测试保证不泄露。

---

## 13. 内容治理与反滥用

### 13.1 评价发布策略

- 注册超过 24 小时且没有违规记录的用户，评价自动发布。
- 新账号前 3 条评价进入 `PENDING`。
- 被举报多次的用户，后续评价进入待审核。
- 管理员可以一键隐藏评价。
- 被隐藏评价的作者可以申诉（P2）。

### 13.2 重复内容

- 对正文做归一化：去除空白、标点、全半角差异。
- 计算 SHA-256 哈希。
- 同一用户提交相同哈希内容时拒绝。
- 近似重复检测放到 P2，使用 SimHash 或相似度阈值。

### 13.3 敏感内容

- 第一版使用配置文件中的基础敏感词列表。
- 命中后进入 `PENDING`，不直接拒绝。
- 个人信息模式检测：
  - 手机号。
  - 邮箱。
  - 身份证号。
  - 家庭住址关键词。
- 命中后提示用户修改，或进入人工审核。
- 不做自动删除，保留人工判断。

### 13.4 刷分与刷票

- 一人一评，数据库唯一约束。
- 一人一票，数据库唯一约束。
- 不能给自己投票。
- 新账号冷却。
- 登录、发评、投票、举报分别限流。
- 排行榜使用贝叶斯平均和最小样本量。
- 管理员可以封禁账号。
- 不展示实时投票明细，降低刷票反馈。

### 13.5 举报滥用

- 同一用户对同一评价只能有一条未处理举报。
- 举报限流。
- 恶意举报累计后暂停举报权限。
- 管理员可以驳回举报并记录备注。

### 13.6 审计日志

必须记录：

- 隐藏评价。
- 恢复评价。
- 删除评价。
- 处理举报。
- 修改用户角色。
- 封禁和解封。
- CSV 导入。
- 课程和班次的新增、修改、删除。

日志字段：

- 操作人。
- 动作。
- 目标类型。
- 目标 ID。
- 备注。
- 时间。
- 不记录评价正文和用户邮箱。

---

## 14. 测试计划

### 14.1 单元测试

- `ranking.ts`：贝叶斯平均计算、最小样本过滤、排序。
- `anonymity.ts`：公共 DTO 不包含作者字段。
- `permissions.ts`：角色权限矩阵。
- `validation/review.ts`：评分范围、字数、标签数量、考核方式枚举。
- `format.ts`：评分格式、日期格式、样本不足文案。

### 14.2 集成测试

使用独立测试数据库 `course_review_test`。

必须覆盖：

- 同一用户对同一班次只能创建一条评价。
- 同一用户对同一班次不同学期可以创建多条评价。
- 隐藏评价不参与平均分和排行榜。
- 删除评价不参与聚合。
- 有用投票唯一，不能给自己投票。
- 举报唯一未处理约束。
- 编辑窗口超过 7 天被拒绝。
- 非作者不能编辑或删除评价。
- 学生不能访问后台 Action。
- CSV 导入重复行被跳过，错误行返回错误。

### 14.3 匿名泄露测试

这是必测项：

1. 请求公开课程页、班次页、搜索接口。
2. 断言返回 HTML 和 JSON 中不出现：
   - `userId`
   - `authorId`
   - `email`
   - `reviewAuthor`
3. 断言评价卡片只显示“匿名同学”和学期。
4. 断言管理员审核列表默认不显示作者。
5. 断言少于 5 条评价时不显示平均分。

### 14.4 E2E 测试

Playwright 配置使用本机 Chrome，避免下载 Chromium：

```ts
export default defineConfig({
  use: { channel: "chrome" },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});
```

使用 Playwright：

1. 注册新用户。
2. 登录。
3. 搜索“操作系统”。
4. 打开班次详情。
5. 填写评价并提交。
6. 看到匿名评价。
7. 点有用。
8. 举报一条评价。
9. 管理员登录，处理举报并隐藏评价。
10. 评价从公开展示和聚合中消失。
11. 切换暗黑模式并刷新，主题保持。
12. 390px 宽度下完成一次写评价流程。

### 14.5 可访问性测试

- 键盘完成登录、搜索、评分、提交。
- 星级评分可用左右方向键。
- 表单错误与字段关联。
- Dialog 焦点锁定和 Esc 关闭。
- 颜色对比度检查。
- 减少动态模式下动画关闭。

### 14.6 视觉回归

可选，但建议：

- 首页、课程库、课程详情、班次详情、写评价、榜单。
- 1440px 和 390px。
- 亮色和暗黑。
- 用 Playwright 截图对比。

### 14.7 性能检查

- 首页首屏查询不超过 5 个主要查询。
- 课程列表分页，避免一次加载全部。
- 评价列表分页。
- 避免 N+1 查询。
- 聚合查询加索引。
- 图片使用 `next/image`。
- Lighthouse 本地检查 LCP、CLS、INP。

---

## 15. 开发里程碑

### M0：项目骨架与视觉迁移

目标：把 C 方向迁移到 Next.js 骨架。

任务：

- 整理原型文件到 `design/`。
- 初始化 Next.js 16 + TypeScript + Tailwind 4。
- 建立颜色 token、字体、全局样式。
- 实现 `SiteHeader`、`SiteFooter`、`ThemeToggle`、`ZineButton`、`ZineCard`、`Sticker`、`Tag`。
- 实现首页静态版。
- 实现亮色和暗黑切换。
- 配置 npm 脚本和 Biome。

验收：

- `npm run dev` 可以打开。
- 首页在 1440px 和 390px 下正常。
- 亮色默认，暗黑切换正常。
- 没有控制台错误。
- 视觉与 `design/style-c` 一致。

### M1：数据库、种子与认证

任务：

- 启动 PostgreSQL，创建数据库。
- 配置 Prisma 7 和 driver adapter。
- 建立业务模型和迁移。
- 建立 `pg_trgm` 索引。
- 用 Better Auth CLI 生成认证表。
- 实现注册、登录、登出。
- 种子数据：课程、教师、学期、班次、演示用户。
- 实现角色和权限基础函数。

验收：

- 可以注册和登录。
- 演示账号可以登录。
- 数据库中有课程、班次和评价。
- 未登录访问 `/me` 会跳转登录。
- 学生访问 `/admin` 被拒绝。

### M2：课程库、搜索与详情

任务：

- 课程库页面。
- 搜索框和 URL 参数。
- 学院、类型、学期筛选。
- 课程详情页。
- 班次详情页。
- 分页。
- 空状态、加载状态、错误状态。

验收：

- 中文课程名可以搜索。
- 筛选条件刷新后保留。
- 课程和班次聚合正确。
- 小样本显示“样本不足”。

### M3：评价闭环与匿名

任务：

- 写评价页。
- 星级评分组件。
- 考核方式多选。
- 标签选择。
- 一人一评约束。
- 编辑和删除。
- 我的评价。
- 公共 DTO 和匿名映射。
- 匿名泄露测试。

验收：

- 同一班次不能重复评价。
- 评价公开页不显示作者。
- 我可以编辑和删除自己的评价。
- 超过 7 天不能编辑。
- 匿名测试通过。

### M4：聚合、榜单、投票与举报

任务：

- 评分分布。
- 排行榜和维度切换。
- 贝叶斯平均。
- 有用投票。
- 举报创建和后台处理。
- 小样本保护在所有聚合中生效。

验收：

- 榜单至少 5 条才上榜。
- 切换维度后排序正确。
- 一人一票。
- 不能给自己投票。
- 举报进入后台队列。
- 隐藏评价后榜单和平均分更新。

### M5：后台与数据管理

任务：

- 后台布局。
- 课程和班次 CRUD。
- CSV 导入向导。
- 评价审核。
- 举报处理。
- 用户角色和封禁。
- 审计日志。
- 站内通知（P1）。

验收：

- 管理员可以导入 CSV 并预览错误。
- 隐藏和恢复评价生效。
- 所有敏感操作写入审计日志。
- 学生无法访问后台 Action。

### M6：测试、可访问性与收尾

任务：

- 补齐单元测试和集成测试。
- Playwright E2E。
- 匿名泄露测试。
- 可访问性检查。
- 性能检查。
- 暗黑和移动端视觉回归。
- 更新 README 和开发文档。
- 清理演示数据和日志。

验收：

- `npm run check` 通过。
- `npm run test:e2e` 通过。
- 无匿名泄露。
- 无控制台错误。
- 视觉验收清单全部通过。
- 本地生产构建成功。

---

## 16. 完成定义

一个功能完成必须满足：

- [ ] 功能在亮色和暗黑下都可用。
- [ ] 桌面和移动端都可用。
- [ ] 有加载状态。
- [ ] 有空状态。
- [ ] 有错误状态。
- [ ] 服务端校验和权限校验完成。
- [ ] 公开 DTO 不泄露作者身份。
- [ ] 相关测试通过。
- [ ] 没有 TypeScript 错误。
- [ ] 没有控制台错误。
- [ ] 文案符合校园手账语气，没有 em dash 和 emoji。
- [ ] 交互有 hover、focus、active 状态。
- [ ] 减少动态模式下可正常使用。
- [ ] 开发文档和 README 已更新。

---

## 17. 代码规范

### 17.1 TypeScript

- `strict: true`。
- 禁止 `any`，确实需要时使用 `unknown` 并收窄。
- 所有边界输入使用 Zod。
- 数据库实体不直接跨层传递，使用 DTO。
- 公共函数写清楚参数和返回类型。
- 服务端专用模块加 `import "server-only"`。

### 17.2 命名

- 组件：PascalCase。
- 函数和变量：camelCase。
- 常量：UPPER_SNAKE_CASE。
- 数据库模型：PascalCase。
- 路由：kebab-case 或短词。
- 测试文件：`*.test.ts` 或 `*.spec.ts`。

### 17.3 组件

- 默认 Server Component。
- 需要状态、事件、GSAP 的组件才加 `"use client"`。
- 客户端组件尽量小，数据在服务端取。
- 不在客户端组件里直接查询数据库。
- 不把整个页面标记为客户端组件。

### 17.4 CSS

- 颜色只用 CSS 变量。
- 间距优先用 Tailwind。
- 复杂装饰用 `zine.css` 或 CSS Module。
- 不使用内联 style，动画初始值除外。
- 暗黑模式通过 `[data-theme="dark"]` 覆盖变量。
- 移动端覆盖写在对应断点内。

### 17.5 Git 与提交

建议使用 `git init`。提交信息格式：

```text
feat: add course search filters
fix: prevent duplicate reviews per offering
docs: update anonymity rules
test: add public review leak test
```

一次提交只做一件事。不要提交 `.env.local`、数据库导出和 `node_modules`。

### 17.6 禁止事项

- 不使用 pnpm。
- 不使用 Docker。
- 不引入外部字体 CDN。
- 不引入 Meilisearch。
- 不在公开查询里 include 作者表。
- 不使用 `window.addEventListener("scroll")`。
- 不写死颜色。
- 不使用纯黑和纯白。
- 不在 UI 文案中使用 em dash 和 emoji。
- 不把管理员去匿名化入口做进第一版。

---

## 18. 风险与待确认项

### 18.1 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 中文搜索效果一般 | 找不到课程 | pg_trgm + ILIKE，后续可换 Meilisearch |
| 小样本反推身份 | 匿名失效 | 少于 5 条不显示聚合，内容审核 |
| 刷分和刷票 | 榜单失真 | 一人一评、一人一票、限流、贝叶斯平均 |
| 恶意举报 | 审核负担 | 举报限流、驳回记录、封禁 |
| 教师隐私和人身攻击 | 法律和伦理风险 | 规则、敏感词、人工审核、举报 |
| 课程数据来源不合法 | 数据风险 | 只用手动录入或授权 CSV |
| 榜单被少数人操纵 | 公信力下降 | 最小样本、学期筛选、异常账号处理 |
| 范围蔓延 | 项目做不完 | 严格按 P0 里程碑 |
| 手账风格影响可读性 | 操作效率下降 | 表单和后台收敛，移动端去旋转 |

### 18.2 默认决策

如果开发中遇到以下问题，按默认值执行：

| 问题 | 默认决策 |
|---|---|
| 单校还是多校 | 单校 |
| 写评价是否需要登录 | 需要 |
| 邮箱验证 | 本地关闭 |
| 编辑窗口 | 7 天 |
| 小样本阈值 | 5 条 |
| 排行榜最小样本 | 5 条 |
| 贝叶斯 m 值 | 10 |
| 新账号发评冷却 | 10 分钟 |
| 新账号前几条进审核 | 3 条 |
| 标签数量上限 | 5 个 |
| 评价正文字数 | 10 到 2000 字 |
| 是否做嵌套评论 | 不做 |
| 是否做图片上传 | 不做 |
| 是否做教师回应 | P1 |
| 是否做去匿名化 | 不做 |
| 账号注销后的评价 | 保留正文，删除作者映射 |
| 是否做多学校 | P2 |

---

## 19. 附录

### 19.1 考核方式枚举

```text
CLOSED_BOOK_EXAM      闭卷考试
OPEN_BOOK_EXAM        开卷考试
PAPER                 课程论文
PROJECT               大作业
LAB                   实验实践
PRESENTATION          口试或展示
ATTENDANCE            点名或出勤
PARTICIPATION         平时分
```

### 19.2 预设标签

```text
干货多
作业多
不点名
给分好
论文多
实验多
讨论多
硬核
轻松
考试原题
```

### 19.3 CSV 模板

```csv
course_code,course_name,credits,course_type,college,instructor,term,section
CS301,操作系统,4,REQUIRED,计算机学院,王砚秋,2025-2026-1,01
CS202,数据结构,4,REQUIRED,计算机学院,林知夏,2025-2026-1,01
ECON204,微观经济学,3,ELECTIVE,经济学院,周明远,2025-2026-1,01
LIT118,中国现代文学,2,ELECTIVE,人文学院,陈嘉禾,2025-2026-1,01
SOC101,社会学概论,2,GENERAL,人文学院,赵行舟,2025-2026-1,01
```

### 19.4 种子数据建议

- 4 个学院：计算机学院、经济学院、人文学院、理学院。
- 20 到 30 门课程。
- 8 到 12 位教师。
- 3 个学期：2024-2025-2、2025-2026-1、2025-2026-2。
- 每个热门班次 5 到 20 条评价。
- 至少 3 条评价的班次用于测试小样本保护。
- 演示账号：
  - `student@example.local`
  - `teacher@example.local`
  - `moderator@example.local`
  - `admin@example.local`
- 密码只用于本地演示，写在 README 的本地开发说明中。

### 19.5 评分展示

```text
难度：★★★★☆  3.5 / 5
作业量：★★★★☆  4.2 / 5
推荐度：★★★★★  4.6 / 5
```

规则：

- 输入使用 1 到 5 的整数。
- 展示使用半星。
- 平均分保留一位小数。
- 少于 5 条评价时显示“样本不足”。

### 19.6 术语表

| 术语 | 说明 |
|---|---|
| Course | 课程本体，例如“操作系统” |
| Offering | 开课班次，课程 + 学期 + 班次 |
| Instructor | 教师 |
| Term | 学期 |
| Review | 一条匿名评价 |
| ReviewAuthor | 评价与作者的内部映射，不对外暴露 |
| Helpful | “有用”投票，不是点赞 |
| Leaderboard | 排行榜 |
| Small sample | 少于 5 条评价的样本 |
| Public DTO | 对外返回的数据结构，必须移除作者字段 |

---

## 20. 开始开发前的检查清单

- [ ] 已选定 C 校园手账。
- [ ] 已确认不做部署。
- [ ] 已确认使用 npm。
- [ ] PostgreSQL 服务已启动。
- [ ] `course_review` 数据库已创建。
- [ ] `.env.local` 已配置。
- [ ] Better Auth 认证表已生成。
- [ ] 种子数据已导入。
- [ ] 原型文件已整理到 `design/`。
- [ ] 第一版 P0 功能清单已确认。
- [ ] 匿名和小样本规则已确认。
- [ ] 后台审核流程已确认。
- [ ] 测试数据库已创建。
- [ ] 开发分支已建立。
