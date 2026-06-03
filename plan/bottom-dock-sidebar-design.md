# 底部悬浮 Dock 菜单改造方案

## 🎯 目标概述

将当前传统左侧 Sidebar 改造成页面底部居中的悬浮 Dock 菜单。

核心目标：

- 一级父菜单固定悬浮在页面中心底部，横向排列。
- 每个父级菜单使用圆形半透明背景，并展示对应 icon。
- 动画效果参考 macOS 底部 Dock：鼠标悬浮时放大、上浮、阴影增强。
- 当父级菜单存在子菜单时，在父菜单上方展示纵向子菜单列表。
- 子菜单展示动画为从下往上浮现、渐显进入。
- 菜单最多展示两级，避免复杂递归菜单影响交互清晰度。


## 🔍 当前实现现状

当前侧边栏主要由以下文件组成：

- `components/layout/sidebar.tsx`
  - 当前 Sidebar 主渲染组件。
  - 从 `useMenuStore` 读取菜单树。
  - 使用递归 `MenuLink` 渲染多级纵向菜单。
  - 使用 Chakra `Collapse` 展开子菜单。

- `components/layout/dashboard-shell.tsx`
  - 当前 Dashboard 主壳布局。
  - 使用 `Flex` 横向布局。
  - `<Sidebar />` 作为左侧固定宽度布局项，占用 `240px`。

- `lib/menu.ts`
  - 定义 `MenuNode` 类型。
  - 构造当前用户可访问菜单树。

- `stores/menu-store.ts`
  - 保存菜单树和权限码。
  - Dock 菜单仍可复用该 store。

当前菜单节点结构：

```ts
type MenuNode = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  component: string | null;
  icon: string | null;
  sort: number;
  type: 'DIR' | 'PAGE' | 'LINK';
  permissionCode: string | null;
  visible: boolean;
  status: 'ENABLED' | 'DISABLED';
  externalUrl: string | null;
  children: MenuNode[];
};
```


## 🧭 总体设计方向

保留现有数据链路，重构展示层。

推荐策略：

1. 保留 `Sidebar` 组件导出名，降低引用改动成本。
2. 将 `Sidebar` 内部实现替换为底部悬浮 Dock。
3. `DashboardShell` 不再让 Sidebar 占据左侧空间。
4. Dock 使用 `position: fixed` 固定在视口底部中心。
5. 主内容区域增加底部 padding，避免内容被 Dock 遮挡。
6. 菜单渲染控制为最多两级。

改造后的布局关系：

```txt
[DashboardShell]
├── MenuStoreInitializer
├── Header
├── Main Content
└── Bottom Dock Menu fixed at bottom center
```


## 🧩 组件结构设计

建议将 `Sidebar` 内部拆成以下逻辑组件：

```txt
Sidebar
└── DockBar
    └── DockMenuItem
        ├── DockIcon
        └── DockSubMenu
            └── DockSubMenuItem
```

职责说明：

- `Sidebar`
  - 读取 `useMenuStore((state) => state.menus)`。
  - 对菜单树进行二级规整。
  - 渲染 `DockBar`。

- `DockBar`
  - 负责底部 fixed 容器。
  - 横向排列所有一级菜单。

- `DockMenuItem`
  - 负责单个父级菜单交互。
  - 管理 hover / focus 状态。
  - 根据是否存在子菜单显示 `DockSubMenu`。

- `DockIcon`
  - 展示 icon。
  - 负责圆形背景、当前态、高亮态、hover 动画。

- `DockSubMenu`
  - 渲染父级菜单对应的子菜单列表。
  - 出现在父级 icon 正上方。
  - 使用渐显和位移动画。


## 🌲 菜单层级规整方案

需求要求最多两级菜单。

当前数据库菜单可能存在三级，例如：

```txt
系统管理
└── 日志管理
    └── 操作日志
```

建议前端渲染时做扁平化规整：

- 一级菜单：保留根节点菜单。
- 二级菜单：收集该根节点下面所有可点击页面节点。
- `DIR` 类型节点仅作为分组来源，不作为第三级展示。

示例转换：

```txt
转换前：
系统管理
├── 用户管理
├── 文件管理
└── 日志管理
    └── 操作日志

转换后：
系统管理
├── 用户管理
├── 文件管理
└── 操作日志
```

建议实现一个纯函数：

```ts
function collectDockChildren(menu: MenuNode): MenuNode[] {
  return menu.children.flatMap((child) => {
    if (child.children.length === 0) return [child];
    if (child.type === 'DIR') return collectDockChildren(child);
    return [child, ...collectDockChildren(child)];
  });
}
```

注意点：

- 若父菜单没有子菜单，则父菜单自己作为跳转项。
- 若父菜单有子菜单，点击父菜单默认跳转第一个子菜单。
- 外链 `LINK` 类型继续使用 `externalUrl || path`。


## 🖱️ 交互方案

### 一级菜单

无子菜单：

- 点击直接跳转目标路径。
- hover 时触发 Dock 放大动画。

有子菜单：

- hover / focus 时显示上方子菜单列表。
- 鼠标移入子菜单时保持展开。
- 点击父菜单建议跳转第一个子菜单，延续当前 Sidebar 交互习惯。

### 子菜单

- 在父菜单正上方纵向排列。
- 点击后跳转对应页面。
- hover 时使用与父级一致的上浮、缩放、阴影增强效果。
- 当前路径命中时高亮。

### 当前态

当前路由命中判断沿用现有逻辑：

```ts
function isActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}
```

父级当前态：

- 父级本身命中；或
- 任一子菜单命中。


## 🎨 整体样式方案

### Dock 容器

位置：

```tsx
position="fixed"
left="50%"
bottom="24px"
transform="translateX(-50%)"
zIndex="sticky"
```

视觉：

```tsx
const dockContainerStyle = {
  px: 3,
  py: 2,
  gap: 2,
  rounded: 'full',
  bg: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
  backdropFilter: 'blur(18px) saturate(1.2)',
};
```

建议补充：

- 最大宽度：`maxW="calc(100vw - 32px)"`
- 横向滚动：`overflowX="auto"`
- 隐藏滚动条可后续处理。


## 🟦 父级菜单 icon 样式

基础样式：

```tsx
const dockIconStyle = {
  w: '52px',
  h: '52px',
  rounded: 'full',
  bg: 'rgba(37, 99, 235, 0.14)',
  color: 'blue.600',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease',
};
```

悬浮样式：

```tsx
const dockIconHoverStyle = {
  bg: 'rgba(37, 99, 235, 0.22)',
  transform: 'translateY(-10px) scale(1.22)',
  boxShadow: '0 16px 34px rgba(37, 99, 235, 0.24)',
};
```

当前态样式：

```tsx
const activeDockIconStyle = {
  bg: 'blue.500',
  color: 'white',
  boxShadow: '0 14px 34px rgba(37, 99, 235, 0.34)',
};
```


## 📦 子菜单样式方案

子菜单位置：

```tsx
position="absolute"
bottom="72px"
left="50%"
transform="translateX(-50%)"
```

容器样式：

```tsx
const subMenuStyle = {
  minW: '148px',
  p: 2,
  rounded: '2xl',
  bg: 'rgba(255,255,255,0.86)',
  border: '1px solid rgba(226,232,240,0.8)',
  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.16)',
  backdropFilter: 'blur(16px)',
};
```

子菜单项样式：

```tsx
const subMenuItemStyle = {
  px: 3,
  py: 2,
  rounded: 'xl',
  fontSize: 'sm',
  color: 'gray.700',
  whiteSpace: 'nowrap',
  transition: 'transform 160ms ease, background 160ms ease, color 160ms ease',
};
```

子菜单项 hover：

```tsx
const subMenuItemHoverStyle = {
  bg: 'rgba(37, 99, 235, 0.12)',
  color: 'blue.600',
  transform: 'translateY(-3px) scale(1.04)',
};
```


## ✨ 动画方案

项目已安装 `framer-motion`，推荐使用它处理进入 / 离开动画。

### 父级 Dock 动画

首版可用 CSS transition：

```tsx
transition="transform 180ms ease, box-shadow 180ms ease, background 180ms ease"
_hover={{
  transform: 'translateY(-10px) scale(1.22)',
}}
```

增强版可用 `framer-motion`：

- 当前 hover 项最大缩放：`1.28 ~ 1.35`
- 左右相邻项缩放：`1.08 ~ 1.16`
- 上浮距离：`8px ~ 12px`

如果要做真正的 macOS 距离感动画，需要记录鼠标横坐标，并按每个 icon 中心点距离计算 scale。

### 子菜单进入动画

建议动画方向为从下往上浮现。

```tsx
initial={{ opacity: 0, y: 14, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.98 }}
transition={{ duration: 0.18, ease: 'easeOut' }}
```

说明：

- `y: 14 -> 0` 表示从下方向上浮入。
- 配合 `opacity` 实现渐显。
- `scale` 让弹层更轻盈。


## 🖼️ Icon 方案

当前 `MenuNode.icon` 字段未使用。

建议按以下优先级展示：

1. 如果 `menu.icon` 有值，按图标名称映射。
2. 如果没有 `menu.icon`，按 `menu.path` 或 `menu.type` 推断默认 icon。
3. 如果无法识别，使用菜单名称首字或默认圆点。

不新增依赖的轻量方案：

```tsx
function getMenuIcon(menu: MenuNode) {
  if (menu.icon) return menu.icon;
  if (menu.path === '/') return '⌘';
  if (menu.path.startsWith('/system')) return '⚙';
  if (menu.path.startsWith('/profile')) return '👤';
  return menu.name.slice(0, 1);
}
```

如果后续愿意引入图标库，可以使用 `react-icons/fi` 或 `lucide-react`。


## 📐 DashboardShell 布局调整

当前布局：

```tsx
<Flex minH="100vh" bg="gray.50">
  <MenuStoreInitializer menus={menus} permissionCodes={permissionCodes} user={user} />
  <Sidebar />
  <Box flex="1" minW={0}>
    <Header user={user} />
    <Box as="main" p={6}>{children}</Box>
  </Box>
</Flex>
```

建议改为：

```tsx
<Box minH="100vh" bg="gray.50">
  <MenuStoreInitializer menus={menus} permissionCodes={permissionCodes} user={user} />
  <Header user={user} />
  <Box as="main" p={6} pb="128px">
    {children}
  </Box>
  <Sidebar />
</Box>
```

关键变化：

- `Sidebar` 不再参与文档流布局。
- 内容区全宽显示。
- 主内容底部增加 padding，避免被 Dock 遮挡。
- 如果考虑移动端安全区，可以使用：

```tsx
pb="calc(128px + env(safe-area-inset-bottom))"
```


## 🧪 验证清单

改造完成后建议验证：

1. 登录后菜单仍来自服务端动态菜单树。
2. 一级菜单正常横向展示在页面底部中心。
3. 无子菜单的一级菜单点击能正常跳转。
4. 有子菜单的一级菜单 hover 后能展示子菜单。
5. 子菜单纵向展示在父菜单上方。
6. 子菜单点击能正常跳转。
7. 当前路由能高亮对应父菜单和子菜单。
8. 页面底部内容不会被 Dock 遮挡。
9. 菜单较多时 Dock 不溢出视口。
10. 移动端或窄屏下仍可横向滚动访问菜单。


## 🚧 实施步骤建议

### 第一步：布局改造

修改 `dashboard-shell.tsx`：

- 去掉左侧 Sidebar 占位布局。
- 将外层从 `Flex` 调整为 `Box`。
- `main` 增加底部 padding。
- 将 `<Sidebar />` 放在布局末尾。

### 第二步：Sidebar 内部重构

修改 `sidebar.tsx`：

- 保留 `Sidebar` 导出。
- 删除递归纵向 `MenuLink` 实现。
- 新增 Dock 渲染逻辑。
- 添加二级菜单规整函数。
- 增加 icon 显示逻辑。

### 第三步：动画增强

优先级：

1. 先使用 CSS transition 实现基础 Dock hover。
2. 再使用 `framer-motion` 实现子菜单进出动画。
3. 最后按需实现 macOS Dock 距离感缩放。

### 第四步：细节优化

- 增加 `aria-label`。
- 增加 `focus-visible` 样式。
- 优化外链 `target` 和 `rel`。
- 处理长菜单名省略。
- 可选处理深色模式。


## ✅ 推荐首版验收标准

首版不追求完全复刻 macOS Dock，但需要做到：

- 菜单形态从传统侧边栏变成底部悬浮 Dock。
- 父级菜单圆形半透明 icon 横向排列。
- 父级菜单 hover 有明显上浮和缩放动画。
- 有子菜单时能在上方展示纵向子菜单。
- 子菜单进入有渐显和位移动画。
- 动态菜单、权限过滤、路由跳转逻辑不被破坏。
