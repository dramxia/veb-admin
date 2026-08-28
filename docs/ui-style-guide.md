# VEB Web UI 实现

本文档记录 `apps/web` 当前实现，不包含未落地的视觉方案。

## 技术与入口

- Next.js 14 App Router、React 18、TypeScript。
- Chakra UI v2 是页面和组件样式的主要实现。
- TailwindCSS 关闭 `preflight`，用于少量工具类；`brand` 和 `ink` 色阶与 Chakra 一致。
- Zustand 保存桌面侧栏折叠状态，并维护移动侧栏开关。
- ECharts 渲染仪表盘图表，nprogress 显示路由进度。
- 业务图标来自 `apps/web/assets/icons`，通过 `LocalIcon` 以 18px 尺寸渲染。

样式来源：

| 文件                          | 当前职责                                                           |
| ----------------------------- | ------------------------------------------------------------------ |
| `apps/web/app/providers.tsx`  | Chakra 主题、语义色、层样式、组件变体、Toast 和全局减弱动效        |
| `apps/web/app/globals.css`    | Tailwind 层、原生 select、滚动条、nprogress 和 `.liquid-rise` 动画 |
| `apps/web/tailwind.config.ts` | Tailwind 扫描范围、关闭 preflight、共享色阶和工具类扩展            |
| `apps/web/components/common`  | 玻璃容器、数据表格、页面画布、加载、错误、上传和选择器等通用组件   |

## 当前主题

主色 `brand.500` 为 `#1677ff`，文本使用 `ink` 冷灰色阶。页面背景由浅蓝线性渐变和三层低透明径向渐变组成。

Chakra 语义色包含：

- 画布、控件、对话框、工具栏和玻璃表面背景。
- 默认、弱化、交互和玻璃边框。
- 成功、警告、错误和信息状态。
- 表格 hover、选中状态、Tooltip 和焦点环。

字体栈为 `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`。Chakra 圆角令牌为：

- `control`、`md`：`8px`
- `lg`：`10px`
- `dialog`、`xl`：`12px`
- `2xl`：`16px`

`glassSoft`、`glassSolid`、`glassFloating`、`navigationGlass`、`toolbarSurface` 和 `subtleSurface` 是当前共享层样式。玻璃层使用半透明白色、浅色边框、低透明阴影和 `backdrop-filter`。

## Chakra 组件覆盖

`apps/web/app/providers.tsx` 当前覆盖：

- Button、CloseButton、Badge、Card
- Input、Select、Textarea、NumberInput 和表单反馈
- Progress、Skeleton、Spinner、Tooltip 和 Alert
- Modal、AlertDialog、Drawer、Menu 和 Popover
- Avatar、Checkbox、Radio、Switch、Tabs 和 Table

`ChakraProvider` 另外配置 Toast 的时长、关闭按钮、位置、容器宽度、间距和动效。

按钮默认使用 8px 圆角、600 字重和 `brand` 实色变体；危险操作使用红色状态令牌。Card 使用 10px 圆角、实色表面、弱边框和无阴影默认样式。输入控件统一处理 hover、focus、invalid、disabled 和 read-only 状态。

通用业务组件包括：

- `GlassPanel`：映射四种玻璃层样式。
- `WorkspaceCanvas`：页面标题、说明、操作区、侧区和内容布局。
- `DataTableCard`：表格标题、工具栏、横向滚动、粘性表头和空状态。
- `MetricIsland`：仪表盘指标块。
- `AppSelect`、`FileUpload`、`ErrorState`、`PageLoading` 等表单和反馈组件。

## 页面布局

工作区使用 `100dvh` 固定画布，由 Header、可选 Sidebar 和滚动内容区组成。当前模块只有一个可导航页面时不显示 Sidebar。

桌面端 Sidebar 支持折叠。移动端由 Header 按钮打开遮罩侧栏；路径变化、点击遮罩或按 Escape 会关闭侧栏，并把焦点返回触发按钮。未显示的侧栏设置为不可交互。

管理页面使用 `WorkspaceCanvas` 和通用表格、表单组件。`WorkspaceCanvas` 的满高模式用于编辑器等固定工作区：页面标题保持在上方，内容占满剩余高度并由内部区域负责滚动。公开文章列表与详情使用独立的 `PublicArticleHeader` 布局，不使用管理侧栏。

当前页面包括：

- 登录、403、404、错误和加载状态。
- 公开文章列表与文章详情。
- 仪表盘和个人资料。
- 模块、用户、角色、菜单与权限、文件、操作日志管理。
- 文章、标签和喜欢记录管理。

## 响应式与交互

- 页面标题和操作区在窄屏改为纵向排列。
- 文章编辑页固定在工作区剩余高度内；返回与保存操作始终位于顶部。桌面端文章信息栏独立滚动，Markdown 默认使用分栏模式，编辑与预览按滚动进度双向同步；窄屏在正文和文章信息之间切换。
- 管理表格保留最小宽度，并在带标签的可聚焦区域内横向滚动。
- Header 在桌面和移动端使用不同的模块、侧栏控制方式。
- Dashboard 图表使用固定容器高度，并在尺寸变化时调用 ECharts resize。
- `.liquid-rise` 提供 220ms 入场动画；系统启用 `prefers-reduced-motion` 时关闭该动画并压缩 Chakra 过渡时间。
- nprogress 使用 3px 的蓝色渐变进度条。

当前实现包含统一的焦点环、表单标签与错误信息、图标按钮标签、导航 `aria-current`、表格区域标签、图表摘要标签和减弱动效处理。

维护 UI 时，以 `apps/web/app/providers.tsx` 和现有通用组件为准，避免在文档中记录尚未实现的推荐值。
