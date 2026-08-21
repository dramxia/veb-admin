# VEB UI 风格规范

## 文档目标

本文档用于统一 VEB 管理后台的视觉语言、样式规则和组件落地方式。

项目技术栈为 Next.js 14 App Router、React 18、TypeScript、Prisma 5、PostgreSQL、NextAuth.js v5 beta、Chakra UI v2、TailwindCSS、Zustand、pnpm、echarts、framer-motion、lru-cache、nprogress。

UI 主题固定为：

- 苹果式清新后台系统
- 毛玻璃与高斯模糊
- 淡蓝渐变主色
- 轻盈、通透、有生命力
- 面向高频管理操作，保持清晰、克制、可读

Chakra UI 是主组件系统，TailwindCSS 只作为布局与工具类补充。所有外部依赖的视觉输出必须向同一套主题风格对齐。

---

## 设计定位

### 核心气质

- **清新**：使用低饱和浅色背景，避免沉重深色块。
- **通透**：核心容器使用半透明白色、玻璃边框、背景模糊。
- **有生命力**：通过淡蓝、天青、蓝紫的轻渐变表达活力。
- **专业**：后台页面保持高信息密度，避免营销页式大标题和装饰堆叠。
- **稳定**：交互反馈柔和但明确，所有状态都要可感知。

### 视觉关键词

- Glassmorphism
- Gaussian Blur
- Apple-like
- Airy
- Soft Blue Gradient
- Focused Admin Workspace

### 禁止方向

- 不使用大面积深蓝、深紫、黑色背景。
- 不使用高饱和霓虹色作为主视觉。
- 不使用厚重阴影、强拟物、高对比硬边框。
- 不把后台系统做成营销落地页。
- 不使用大量装饰性渐变球、光斑、噪点遮挡内容。

---

## 设计令牌

### 主色

主题色以 `#1677ff` 为核心，并向浅蓝、天青、蓝紫延展。

推荐色阶：

- `brand.50`: `#eef7ff`
- `brand.100`: `#d8ecff`
- `brand.200`: `#b7ddff`
- `brand.300`: `#83c8ff`
- `brand.400`: `#48a8ff`
- `brand.500`: `#1677ff`
- `brand.600`: `#0f5ed7`
- `brand.700`: `#104cad`
- `brand.800`: `#13428c`
- `brand.900`: `#153a75`

使用规则：

- 主按钮、当前导航、关键进度、图表主系列使用 `brand.500`。
- hover 和 active 使用 `brand.600`、`brand.700`。
- 背景、标签、选中行使用 `brand.50` 到 `brand.100`。
- 渐变可从 `#1677ff` 过渡到 `#63b3ed` 或 `#6d5dfc`。

### 中性色

后台文本以冷灰为主，避免纯黑带来的压迫感。

- 页面主文本：`ink.800` / `#1e293b`
- 强标题：`ink.900` / `#0f172a`
- 次级文本：`ink.500` / `#64748b`
- 辅助文本：`ink.400` / `#94a3b8`
- 分割线：`ink.100` / `#f1f5f9`
- 弱边框：`ink.200` / `#e2e8f0`

### 功能色

功能色必须降低饱和度，并优先用于状态表达，不参与大面积装饰。

- 成功：`#16a34a`，背景 `#ecfdf5`
- 警告：`#f59e0b`，背景 `#fffbeb`
- 错误：`#ef4444`，背景 `#fef2f2`
- 信息：`#0ea5e9`，背景 `#f0f9ff`

### 背景

全局背景使用低对比淡蓝渐变：

```css
linear-gradient(135deg, #f8fbff 0%, #f3f7ff 46%, #eef4ff 100%)
```

可叠加非常轻的径向渐变来制造空气感：

```css
radial-gradient(circle at 12% 10%, rgba(22, 119, 255, 0.14), transparent 28%)
radial-gradient(circle at 88% 4%, rgba(99, 102, 241, 0.12), transparent 24%)
radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.10), transparent 32%)
```

注意：

- 径向渐变只能作为弱背景氛围，不得遮挡内容。
- 页面主体仍应保持高可读性。
- 不允许每个区块都叠加独立装饰背景。

### 玻璃态

玻璃容器推荐值：

```css
background: rgba(255, 255, 255, 0.72);
border: 1px solid rgba(255, 255, 255, 0.72);
backdrop-filter: blur(18px) saturate(160%);
-webkit-backdrop-filter: blur(18px) saturate(160%);
box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
```

强玻璃容器，例如 Header、侧栏与浮层菜单：

```css
background: rgba(255, 255, 255, 0.4);
border: 1px solid rgba(255, 255, 255, 0.4);
backdrop-filter: blur(32px) saturate(200%);
-webkit-backdrop-filter: blur(32px) saturate(200%);
box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
```

使用规则：

- Header、侧栏、Modal、Drawer、Menu、Popover 可使用玻璃态。
- 表格外层、数据卡片可使用弱玻璃态。
- 输入框内部不应过度透明，必须保证文字可读。
- 玻璃层后方背景过于复杂时，需要提高容器白色不透明度。

### 圆角

后台界面使用柔和圆角，但不应影响信息密度。

- 小控件：`10px` 到 `12px`
- 输入框、按钮：`12px` 到 `14px`
- 卡片、弹窗：`18px` 到 `24px`
- 头像、状态点、圆形图标按钮：`999px` 或 `full`

规则：

- 同一页面不要混用过多圆角尺度。
- 表格行、菜单项、列表项可用 `10px` 到 `12px`。
- 卡片圆角不超过 `24px`，避免过度玩具化。

### 阴影

阴影必须轻、散、低透明度。

推荐阴影：

```css
--shadow-soft: 0 18px 50px rgba(15, 23, 42, 0.08);
--shadow-card:
  0 18px 44px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
--shadow-glow: 0 24px 80px rgba(22, 119, 255, 0.24);
```

使用规则：

- 卡片使用 `shadow-card`。
- 主按钮 hover 可使用淡蓝微光。
- 弹窗和抽屉使用更高层级阴影，但透明度不得过重。
- 不允许使用纯黑高透明阴影。

### 字体

字体栈：

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

规则：

- 标题字重使用 `700` 到 `900`。
- 正文字重使用 `400` 到 `500`。
- 操作按钮使用 `700`。
- 表格表头使用 `600` 到 `700`。
- 不使用负字距。
- 不根据视口宽度动态缩放字体。

### 间距

后台布局优先保证扫描效率。

- 页面边距：移动端 `16px`，桌面端 `24px` 到 `32px`
- 卡片内边距：`20px` 到 `28px`
- 表单项间距：`16px` 到 `20px`
- 表格单元格纵向间距：`12px` 到 `16px`
- 工具栏元素间距：`8px` 到 `12px`

### 令牌与容器优先级

新增或修改 UI 时，样式来源必须遵循以下优先级：

1. Chakra UI theme 的语义 token 与组件变体
2. `GlassPanel`、`DataTable` 等通用组件
3. TailwindCSS 的布局与响应式工具类
4. 经过评审的业务局部样式

业务组件不得新增硬编码的 `rgba(...)`、`backdrop-filter`、`box-shadow` 或渐变字符串。当前存量代码中的此类值应在相关组件改动时逐步收敛到共享 token 或变体，不能继续复制扩散。

---

## 全局布局规则

### App Shell

后台主结构由通栏 Header、按模块需要展示的侧栏和主内容区组成。

规则：

- 页面最外层使用淡蓝渐变背景。
- Header 使用 sticky 玻璃态，保持页面滚动时的空间感。
- 主内容区最大宽度建议为 `1280px`。
- 桌面侧栏支持展开和收起；只有一个可导航页面的模块不显示侧栏。
- 窄屏通过 Header 按钮打开遮罩侧栏，关闭或完成导航后应恢复合理的焦点位置。

### 页面内容

页面内容遵循清晰的信息层级：

1. 页面标题与关键说明
2. 操作工具栏
3. 查询筛选区
4. 数据表格或核心业务区域
5. 分页、批量操作、状态反馈

规则：

- 不使用超大 Hero。
- 页面标题不超过两行。
- 筛选区和工具栏应靠近数据区。
- 主操作按钮放在右侧或工具栏显著位置。
- 危险操作使用明确的红色状态，不用蓝色伪装。

### 响应式

- 移动端优先保证操作可达，不强行展示完整桌面表格。
- 表格可横向滚动，但滚动区域必须有清晰边界。
- 侧栏在窄屏下使用遮罩层显示，不压缩菜单文字和点击区域。
- Header 中的次级说明可在移动端隐藏。
- 弹窗在移动端可转为底部抽屉体验。

---

## Chakra UI 组件规范

Chakra UI v2 是项目主组件系统。主题入口应集中在 `apps/web/app/providers.tsx` 的 `extendTheme`，业务组件优先使用 Chakra props 和主题 token。

当前主题已覆盖常用输入、按钮、浮层、表格和反馈组件。新增或扩展 `Popover`、`Toast`、`AlertDialog`、`Avatar`、`Radio`、`NumberInput`、`IconButton`、`CloseButton` 时，必须优先补充统一 theme 覆盖，不能在业务页面分散实现视觉样式。

### Button

默认风格：

- 圆角：`14px`
- 字重：`700`
- 主色：`brand.500`
- 主按钮阴影：淡蓝微光
- hover：轻微上浮 `translateY(-1px)`
- active：恢复原位
- disabled：保持可识别，不参与 hover 动画

变体规则：

- `solid`：用于主操作，例如新增、保存、提交。
- `outline`：用于次级操作，例如导出、重置、批量操作。
- `ghost`：用于低强调操作，例如头像菜单、表格行内轻操作。
- 危险操作必须使用红色语义，不使用 `brand`。

### Card

卡片用于承载独立信息单元，不用于包裹整个页面区块。

默认风格：

- 背景：`rgba(255, 255, 255, 0.72)` 到 `0.86`
- 边框：`rgba(255, 255, 255, 0.72)`
- 圆角：`20px` 到 `24px`
- 阴影：`shadow-card`
- 可选：`backdrop-filter: blur(18px) saturate(160%)`

规则：

- 不允许卡片套卡片。
- 工具栏、表格、统计卡可以用卡片承载。
- 页面 section 不应全部做成浮动卡片。

### Input、Textarea、Select

默认风格：

- 圆角：`14px`
- 背景：`whiteAlpha.900`
- 边框：`ink.200`
- hover 边框：`brand.300`
- focus ring：`0 0 0 3px rgba(22, 119, 255, 0.14)`

规则：

- 输入区要优先保证可读，不追求过度透明。
- 错误态使用红色边框和浅红背景提示。
- placeholder 使用 `ink.400`。
- 密集表单可降低圆角到 `12px`，但不能出现硬直角。

### FormControl

规则：

- Label 使用 `ink.700`，字重 `600`。
- Helper text 使用 `ink.500`。
- Error message 使用错误色，并保持简短。
- 必填标记使用红色，不用星号堆叠样式。
- 表单布局优先两列，移动端折叠为单列。

### Table

后台表格以可读性和扫描效率为核心。

默认风格：

- 表头文字：`ink.500`
- 表头字号：`xs`
- 表头字重：`700`
- 分割线：`ink.100`
- 行 hover：`rgba(22, 119, 255, 0.04)`
- 选中行：`brand.50`

规则：

- 表头不使用重背景色。
- 数值列右对齐。
- 操作列固定在右侧时需要保持背景通透但可读。
- 空状态要给出下一步操作，不只显示“暂无数据”。
- 表格密度默认适中，避免行高过大。

### Badge、Tag、Status

规则：

- 使用圆角胶囊形。
- 字重 `700` 到 `800`。
- 文案短，不超过 6 个中文字符优先。
- 状态色使用功能色浅背景加深文字。
- 不使用高饱和实心色块作为默认状态。

### Menu、Popover、Tooltip

默认风格：

- 背景：玻璃态白色
- 圆角：`14px` 到 `18px`
- 阴影：`shadow-card`
- 内边距：`8px`
- item 圆角：`10px` 到 `12px`

规则：

- Menu item hover 使用浅蓝或浅灰背景。
- Tooltip 可使用深色半透明背景，但面积要小。
- Popover 内容不得遮挡主操作路径。
- 菜单出现与消失应使用短动画，不超过 `200ms`。

### Modal、Drawer

规则：

- 内容容器使用玻璃态或高不透明白色。
- Overlay 使用浅色半透明或轻微模糊，不使用纯黑重遮罩。
- 标题清晰，底部操作区固定且易达。
- 主要按钮放右侧，取消按钮放左侧或次级位置。
- 危险确认弹窗必须明确展示影响范围。

### Tabs

规则：

- 当前项使用淡蓝背景或底部品牌色指示。
- 非当前项保持低对比。
- 不使用厚重边框包围整个 Tabs。
- Tabs 适合切换同一业务域下的视图，不用于主导航。

### Alert、Toast

规则：

- 使用功能色浅背景。
- Toast 圆角不低于 `14px`。
- 成功反馈简短，错误反馈要包含可执行信息。
- 重要错误不只依赖 Toast，应在页面内保留状态。

### Skeleton、Progress、Spinner

规则：

- Skeleton 使用浅蓝灰色，不使用纯灰大块闪烁。
- Progress 使用淡蓝渐变。
- Spinner 仅用于短等待。
- 超过 2 秒的加载应使用页面级 loading 或骨架屏。

### 补充 Chakra 组件

以下组件必须继承同一套主题 token，不在业务页面各自定义圆角、阴影、焦点环或玻璃效果：

- `Popover`：浮层背景、边框和阴影与 `Menu` 一致；触发器保留明确 focus 状态。
- `AlertDialog`：沿用 `Modal` 的浅色模糊遮罩与高可读性内容层；危险确认必须使用红色语义和明确的影响说明。
- `IconButton`、关闭按钮：使用固定方形点击区和圆角，统一通过 `LocalIcon` 渲染分类 SVG；无文字按钮必须提供 `aria-label`，不熟悉的操作还需提供 Tooltip。
- `Avatar`：尺寸稳定、边框使用半透明白色或 `ink.100`；不能用头像颜色作为唯一状态表达。
- `Radio`、`Checkbox`、`Switch`：选中态使用 `brand.500`，未选中态保持中性色边框，均需可见 focus ring。
- `NumberInput`：与 `Input` 共用背景、边框、错误态和 focus ring；步进按钮不得挤压数值内容。

新增上述组件的主题覆盖时，应集中维护在 `apps/web/app/providers.tsx` 的 `extendTheme`；在覆盖前，业务组件也必须遵循本节规则。

---

## TailwindCSS 使用规则

TailwindCSS 是工具层，不替代 Chakra 主题系统。

当前项目应继续关闭 Tailwind `preflight`，避免与 Chakra 默认样式冲突。

推荐职责：

- 布局：`grid`、`flex`、`gap`、`items-*`、`justify-*`
- 响应式：`sm:`、`md:`、`lg:`、`xl:`
- 尺寸：`w-*`、`h-*`、`min-*`、`max-*`
- 定位：`relative`、`absolute`、`fixed`、`sticky`
- 少量工具类：`overflow-*`、`truncate`、`sr-only`

限制规则：

- Chakra 组件内优先使用 Chakra props。
- 不在业务组件中随意写 Tailwind 颜色类替代主题 token。
- 不用 Tailwind 写一套与 Chakra 不一致的阴影、圆角和渐变。
- 不启用会影响 Chakra 的全局 reset。

如需扩展 Tailwind theme，应与 Chakra token 保持语义一致：

```ts
theme: {
  extend: {
    colors: {
      brand: {
        50: '#eef7ff',
        500: '#1677ff',
        700: '#104cad',
      },
      ink: {
        500: '#64748b',
        800: '#1e293b',
      },
    },
  },
}
```

---

## echarts 样式对齐

echarts 图表必须看起来属于同一套后台 UI。

当前项目已安装 `echarts`，但尚未包含实际图表页面或通用图表组件；本节是后续接入时的强制视觉规范。

### 色彩

推荐图表色板：

```ts
const chartColors = [
  '#1677ff',
  '#0ea5e9',
  '#38bdf8',
  '#6d5dfc',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
];
```

规则：

- 第一主系列使用 `brand.500`。
- 多系列使用蓝、青、蓝紫为主，功能色为辅。
- 不使用高饱和荧光色。
- 面积图可使用淡蓝透明渐变。

### 坐标轴与网格

规则：

- 网格线使用 `rgba(100, 116, 139, 0.12)`。
- 坐标轴文字使用 `#64748b`。
- 坐标轴线弱化或隐藏。
- 图表容器背景透明，外层由 Chakra Card 提供玻璃态。

### Tooltip

Tooltip 推荐玻璃态：

```ts
tooltip: {
  trigger: 'axis',
  backgroundColor: 'rgba(255, 255, 255, 0.88)',
  borderColor: 'rgba(226, 232, 240, 0.72)',
  borderWidth: 1,
  textStyle: {
    color: '#1e293b',
  },
  extraCssText:
    'backdrop-filter: blur(18px) saturate(160%); border-radius: 14px; box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);',
}
```

### 图表交互

- hover 高亮要轻，不要造成大面积闪烁。
- loading 使用淡蓝 spinner 或骨架容器。
- 空数据状态由页面组件承载，不在图表内部硬编码复杂提示。
- 图表高度需要稳定，避免数据加载后布局跳动。

---

## framer-motion 动效规则

framer-motion 用于微交互，不用于制造视觉噪音。

当前项目使用 framer-motion 实现少量页面微交互；新增动效必须延续本节规则。

推荐过渡：

```ts
const springTransition = {
  type: 'spring',
  stiffness: 360,
  damping: 30,
  mass: 0.8,
};

const easeTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};
```

使用场景：

- 菜单展开收起
- Modal、Drawer 入场
- 侧栏和菜单状态切换
- 表格筛选区展开
- 卡片轻微浮现

规则：

- 常规动画时长控制在 `160ms` 到 `260ms`。
- 弹性动画只用于浮层和少量强调交互。
- 不对大面积表格行做复杂动画。
- 不让动画影响布局稳定性。
- 尊重系统的 reduced motion 设置。

---

## nprogress 样式规则

nprogress 体现页面切换的轻盈感。

推荐样式：

```css
#nprogress .bar {
  background: linear-gradient(90deg, #1677ff, #63b3ed, #6d5dfc);
  height: 3px;
  z-index: 2000;
}

#nprogress .peg {
  box-shadow:
    0 0 10px #1677ff,
    0 0 5px #6d5dfc;
}
```

规则：

- 高度保持 `3px`。
- 使用品牌蓝到蓝紫渐变。
- 不添加额外 loading 文案。
- 不与页面级 loading 重复制造强干扰。

---

## Zustand UI 状态规则

Zustand 用于客户端 UI 状态时，命名和状态结构必须体现后台操作语义。

当前 store 维护侧边栏折叠状态，并由初始化结果写入菜单与权限信息；表格密度、筛选面板和上传面板属于可按本节规则增加的 UI 状态，不代表现有功能。

推荐使用场景：

- 菜单展开状态
- 用户偏好的表格密度
- 筛选面板展开收起
- 主题模式扩展
- 上传面板状态

规则：

- 服务端数据列表和详情不应长期放入 Zustand。
- UI 状态命名要清晰，例如 `isFilterOpen`、`tableDensity`、`activeMenuId`。
- 状态变化不应导致整页不必要重渲染。
- 与权限、菜单相关状态必须和服务端初始化结果一致。

---

## 外部依赖视觉对齐

所有具有可见输出的依赖都必须服从同一套淡蓝玻璃主题，不能带入独立的默认视觉语言。

- `@chakra-ui/react`：主组件系统。颜色、圆角、阴影、焦点态和浮层样式以 `apps/web/app/providers.tsx` 的主题为唯一来源。
- `tailwindcss`：只承担布局、响应式和少量工具类；不使用颜色、阴影、圆角类覆盖 Chakra 语义 token，且保持 `preflight` 关闭。
- 本地图标集：SVG 按 `actions`、`auth`、`brand`、`content`、`editor`、`navigation`、`status`、`system` 分类；统一使用 24×24 画布、`1.8` 线宽和 `currentColor`，通过 `LocalIcon` 渲染。所有业务图标固定为 18px，品牌块、统计卡和状态面板只调整外层容器，不放大图标本身。
- `echarts`：遵循本规范的图表色板、坐标轴、玻璃 Tooltip 和稳定容器尺寸；不使用库默认色板。
- `framer-motion`：仅用于定义的微交互，并尊重 `prefers-reduced-motion`；不使用默认弹簧参数制造明显跳动。
- `nprogress`：仅使用全局的品牌渐变进度条，不额外添加 spinner 或文字提示。
- `zustand`：不直接输出视觉样式；其 UI 状态应驱动已主题化的 Chakra 组件，而不是在 store 中保存颜色、阴影等展示细节。
- `next-auth`、`prisma`、`lru-cache`：没有可见 UI 输出；由它们驱动的认证、数据或缓存状态必须通过本规范的加载、空状态、错误态和权限提示组件呈现。

---

## 典型页面规范

### 登录页

目标：轻盈、安全、可信。

规则：

- 背景使用淡蓝渐变和弱径向光。
- 登录表单使用玻璃态卡片。
- Logo 使用蓝到蓝紫渐变。
- 输入框保持高可读性。
- 错误提示放在表单内部，避免只用 Toast。
- 不使用过度装饰插画。

### Dashboard 首页

目标：快速建立系统状态感。

规则：

- 核心指标使用 3 到 4 个统计卡。
- 新增趋势图时使用 echarts 淡蓝色板。
- 操作入口使用清晰按钮或图标按钮。
- 卡片之间保持统一间距。
- 避免首屏堆叠过多模块。

### 列表与表格页

目标：高效查询、扫描、操作。

规则：

- 顶部为标题和主操作。
- 筛选条件保持单行或可折叠。
- 表格外层可使用玻璃卡片。
- 批量操作出现时不要挤压分页。
- 行内操作不超过 3 个，更多操作放入菜单。

### 表单页

目标：减少录入压力。

规则：

- 表单分组明确。
- 必填项清晰标记。
- 长表单优先使用 Drawer 或页面表单，不塞入小 Modal。
- 提交按钮固定在底部或表单末尾。
- 保存中必须展示 loading 状态。

### Modal

目标：完成短任务。

规则：

- 适合新增、编辑、确认等短流程。
- 宽度默认 `480px` 到 `720px`。
- 内容过长时改用 Drawer 或页面。
- 底部操作区固定，避免滚动后找不到按钮。

### Drawer

目标：承载侧向详情和复杂编辑。

规则：

- 适合详情、分配角色、权限勾选、复杂筛选。
- 宽度默认 `420px` 到 `640px`。
- 背景使用高不透明白色或弱玻璃。
- 右侧 Drawer 的关闭和提交操作必须清晰。

### 侧栏导航

目标：提供稳定、可扫描且适合重复操作的模块内导航。

规则：

- 桌面端支持展开和收起，收起时保留图标并通过 Tooltip 展示名称。
- 窄屏使用遮罩侧栏，通过 Header 按钮打开，并支持 Escape 和点击遮罩关闭。
- 当前页面必须有明确的文字、图标和选中状态，不能只依赖颜色表达。
- 外部链接需要标识并在新窗口打开；内部导航保持统一路由反馈。
- 菜单项保持稳定高度和点击区域，动态内容不得导致侧栏宽度跳动。

### 文件上传与预览

目标：清晰表达上传状态。

规则：

- 上传区域使用虚线边框和浅蓝背景。
- 拖拽 hover 使用 `brand.50`。
- 进度条使用淡蓝渐变。
- 成功、失败、取消状态必须明确。
- 预览区域保持简洁，不使用重阴影图片墙。

### 错误页与空状态

目标：让用户知道发生了什么，以及下一步怎么做。

规则：

- 使用简洁图形或图标，不使用复杂插画。
- 主文案短，说明清楚。
- 提供返回、刷新或创建等明确操作。
- 错误信息可折叠展示，避免首屏吓人。

---

## 可访问性

必须满足以下规则：

- 文本与背景对比度满足常规可读要求。
- 交互元素必须有明确 focus 状态。
- 图标按钮必须提供 `aria-label`。
- 表单错误要与字段关联。
- 颜色不能作为唯一状态表达。
- 键盘可以操作菜单、弹窗、表单和主要按钮。
- 动画需要尊重 `prefers-reduced-motion`。

---

## 性能规则

玻璃态和模糊效果需要克制使用。

规则：

- `backdrop-filter` 不要在大量列表项中重复使用。
- 大面积模糊层不要频繁动画。
- 表格行 hover 不使用复杂 filter。
- echarts 图表按需加载，避免首屏阻塞。
- framer-motion 不用于大批量 DOM 节点动画。
- 图片和头像需要设置稳定尺寸，避免布局抖动。

---

## 实现入口建议

### `apps/web/app/providers.tsx`

集中维护 Chakra 主题：

- `colors.brand`
- `colors.ink`
- `fonts`
- `radii`
- `shadows`
- `styles.global`
- `components`

组件样式优先在 Chakra theme 内统一，不在每个业务页面重复写一套。

业务组件必须遵循“令牌与容器优先级”。优先使用 Chakra token、组件变体和 `GlassPanel` 等通用容器；确有例外时，必须说明其无法由现有 token 表达的原因。

### `tailwind.config.ts`

保持：

```ts
corePlugins: {
  preflight: false,
}
```

如需扩展 token，必须与 Chakra theme 同名同义。

### `apps/web/app/globals.css`

只维护真正全局的样式：

- Tailwind components 和 utilities
- body 背景兜底
- scrollbar
- nprogress
- reduced motion
- 少量全局 CSS 变量

不要在 `globals.css` 中写具体业务组件样式。

### 通用业务组件

以下组件必须优先对齐本规范：

- `data-table`
- `file-upload`
- `page-loading`
- `error-state`
- `dashboard-shell`
- `header`
- `sidebar`
- 各类 form modal 和 drawer

---

## 禁用清单

以下做法不允许进入项目主 UI：

- Chakra 组件和 Tailwind 类重复定义同一视觉规则。
- 每个页面单独写不同蓝色、不同圆角、不同阴影。
- 表格页使用营销式大 Hero。
- 使用大面积深色背景作为默认后台风格。
- 玻璃容器后方内容复杂导致文字不可读。
- hover 导致布局尺寸变化。
- 动画影响表单输入、表格扫描和批量操作。
- 只用 Toast 表达关键错误。
- 只用颜色表达状态。
- 图表使用与主题不一致的高饱和随机色。
- 使用表情符号充当界面图标、状态标识或装饰。
- 在业务组件中直接内联 SVG 或引入第三方图标组件。

---

## UI 验收清单

每次新增或重构 UI，至少检查：

- 页面是否符合淡蓝、玻璃、轻盈的整体方向。
- Chakra 组件是否优先使用主题 token。
- Tailwind 是否只承担布局和工具类职责。
- 主按钮、输入框、表格、弹窗是否风格一致。
- hover、focus、active、disabled、loading、error 状态是否完整。
- 移动端是否无文字重叠、按钮溢出或侧栏遮罩与焦点异常。
- 图表、进度条、动画是否与主题一致。
- 页面是否保持后台系统应有的信息密度。
- 是否存在过度装饰、重阴影、高饱和色。
- 图标是否来自分类 SVG 图标集，并保持统一画布、线宽、尺寸和可变色。

---

## 总结

VEB 的 UI 不追求复杂装饰，而是追求清晰、通透、轻盈和可靠。

所有页面与组件都应围绕同一套原则构建：以 Chakra UI 主题为核心，以 TailwindCSS 为工具补充，以淡蓝渐变和毛玻璃建立品牌识别，以克制动效和清晰状态支撑后台高频操作。
