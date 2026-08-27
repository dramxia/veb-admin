# Core API 单体化重构计划

## Problem Statement

当前系统把系统管理与博客业务拆成两个 Next.js API 应用和两个 PostgreSQL 数据库。浏览器的系统请求进入 VEB API；博客管理请求先由 VEB API 校验 Auth.js Session 与 RBAC，再通过请求绑定的 RS256 服务令牌转发到 Blog API 的内部接口；公开文章、标签和点赞则通过另一条代理及独立公开网关直接访问 Blog API。文章作者因为跨库而保存为普通 ID、用户名和昵称快照，两个 API 各自维护 Prisma Schema、初始化迁移、seed、健康检查、环境变量、Docker 镜像、网关和故障边界。

这套行为对于“博客是 VEB 的一个普通业务模块”已经不正确。服务拆分制造了不再需要的 BFF、JWKS、服务令牌、防重放、重试、依赖服务 503、双数据库一致性、双网关和双部署链路；访问级别又隐含在服务边界、路径前缀和各处理器的手写鉴权中，无法从每个接口声明直接判断其是公开、仅登录可访问，还是需要具体权限。继续保留这些边界会增加开发、测试、配置和部署成本，并阻碍博客与用户、权限、审计数据建立正常的单库关系。

必须保留的核心不变量是：**每个标准 API 方法都必须显式声明为 public 或 private；private 请求必须在业务处理器执行前完成 Session 校验，并在声明权限码时完成 RBAC 校验，未声明访问级别的标准接口不得进入可运行状态。**

除已经明确决定改变的应用名称、博客 URL、模块命名、网络拓扑、数据库归属和作者关系外，现有业务可观察语义必须保持：只公开已发布且发布时间不晚于当前时间的文章；公开 DTO 不泄露数据库 ID、账户用户名或草稿字段；分页、校验、点赞 Cookie、访客哈希、限流、统一响应壳、请求 ID、操作审计和错误映射继续有效。

## Solution

我希望把两个 API 完全重构为一个名为 `core-api` 的 Next.js 应用和一个 PostgreSQL 数据库。博客文章、标签、关联关系和点赞模型进入统一 Prisma Schema；文章作者改为必选的系统用户外键，展示信息实时读取用户数据，有文章的用户不能被物理删除。博客公开接口统一使用 `/api/v1/blog/**`，管理接口统一使用 `/api/v1/blog/manage/**`；其他系统 API 路径不改，也不提供旧 URL、旧服务名、旧环境变量或旧数据库结构的兼容层。

所有标准 Route Handler 使用统一的 `defineApiRoute` 边界。该边界负责访问声明、Session/RBAC、可信用户上下文、请求 ID、错误映射、访问日志和可选操作审计。public 声明不能携带权限，private 声明可以只要求 Session，也可以声明单个权限或采用“任一命中”语义的权限列表。Auth.js 适配路由是唯一经过测试和文档化的技术例外；健康检查也必须显式声明 public。

Web public gateway 成为唯一公开入口，Web 的浏览器代理和服务端请求都只连接 Compose 私网中的 `core-api`。最终删除 Blog API、Blog PostgreSQL、Blog public gateway、BFF、服务 JWT/JWKS、防重放、跨服务重试和相应配置。`api-contracts` 继续作为 Web 与 Core API 的共享 HTTP 契约；`api-kit` 的仍有价值的能力及测试迁入 Core API；`service-auth` 和无剩余消费者的错误码、别名、配置与文件全部删除。

## Commits

1. 为当前拆分架构补齐重构特征测试，固定公开文章过滤与脱敏、管理权限矩阵、发布附加权限、点赞 Cookie/限流、统一响应壳、请求 ID、操作审计和管理发布后公开可读等行为；只增加测试，不改变实现 → verify: `pnpm --filter @veb/api-contracts test && pnpm --filter @veb/api-kit test && pnpm --filter @veb/veb-api test && pnpm --filter @veb/blog-api test && pnpm --filter @veb/web test`
2. 机械迁移 VEB API 应用目录和工作区包名为 Core API，更新根脚本、TypeScript/Vitest/Next 配置、Prisma 生成路径、Docker 构建路径和锁文件；暂时保留现有 Compose 服务名与双数据库拓扑，以便把纯文件移动和运行拓扑变更分开验证 → verify: `pnpm --filter @veb/core-api typecheck && pnpm --filter @veb/core-api test && pnpm --filter @veb/core-api build`
3. 把运行时 API 服务名、Web 内部上游变量、健康检查引用和日志 scope 从 VEB API 统一改为 Core API，同时保持端口 1067 和当前双数据库链路不变 → verify: `pnpm --filter @veb/web test && pnpm --filter @veb/core-api test && docker compose --env-file .env.development config --quiet`
4. 在 Core API 中引入统一路由边界及其契约测试，覆盖 public、private 仅 Session、private 单权限、private 多权限任一命中、无会话、无权限、可信用户上下文、请求 ID、错误映射、访问日志和审计成功/失败路径；此提交不迁移现有接口 → verify: `pnpm --filter @veb/core-api test -- route`
5. 将 live、ready 和现有业务健康接口迁入统一路由边界，明确声明为 public，并保持 ready 仍检查当前必要配置和数据库 → verify: `pnpm --filter @veb/core-api test -- health route`
6. 将个人资料、修改密码、导航、页面访问解析和仪表盘接口迁入统一路由边界，使用 private 无权限或精确权限声明替代处理器内的重复 Session 检查 → verify: `pnpm --filter @veb/core-api test -- session navigation dashboard route`
7. 将文件列表、上传、读取和删除接口迁入统一路由边界，保留文件权限、私有缓存头、上传目录和操作审计语义 → verify: `pnpm --filter @veb/core-api test -- file route`
8. 将用户与角色管理接口迁入统一路由边界，保留角色委派、superadmin、密码脱敏和原有权限判断 → verify: `pnpm --filter @veb/core-api test -- user role route`
9. 将模块、菜单、授权分配和页面解析相关接口迁入统一路由边界，保持有效授权计算和菜单约束不变 → verify: `pnpm --filter @veb/core-api test -- module menu assignment route`
10. 将操作日志查询与导出接口迁入统一路由边界，验证读取权限、导出响应头、请求 ID 和审计负载脱敏 → verify: `pnpm --filter @veb/core-api test -- operation-log route`
11. 增加 Route Handler 覆盖检查，枚举所有标准 HTTP 方法并断言其带有显式访问策略；暂时只允许 Auth.js 和待删除的旧 Blog BFF 作为命名例外 → verify: `pnpm --filter @veb/core-api test -- route-policy`
12. 在 seed 中增加新的 `blog:*` 模块权限集合，并保留现有 `content:*` 集合作为仅供下一步切换的短暂脚手架；验证 seed 幂等和权限层级完整 → verify: `pnpm --filter @veb/core-api test -- seed permission`
13. 将 Blog BFF 权限解析、Web 权限控件和操作审计动作切换到 `blog:*` 与 `blog.*` 命名，更新相应测试，确保每种文章、标签、分配和点赞操作仍要求等价权限 → verify: `pnpm --filter @veb/core-api test -- blog permission && pnpm --filter @veb/web test`
14. 将管理端模块 code、显示名称、页面 manifest、导航入口和管理页面 URL 从 content 统一改为 blog，更新 seed、前端调用和端到端选择器，不改变页面功能 → verify: `pnpm --filter @veb/core-api test -- seed navigation && pnpm --filter @veb/web test`
15. 删除短暂保留的 `content:*` 权限、旧管理页面路径和旧模块标识，增加残留扫描，保证最终授权模型只有 `blog:*` → verify: `! rg -n "content:|/admin/content|code: ['\"]content['\"]" apps packages docs --glob '!**/node_modules/**'`
16. 先在仍使用旧 Blog API 的 BFF 中引入最终管理 URL `/api/v1/blog/manage/**`，同步所有 Web 管理调用和测试，并让旧的无 manage 前缀管理路径直接返回 404；此时管理和公开流程仍使用同一个 Blog 数据库 → verify: `pnpm --filter @veb/core-api test -- blog && pnpm --filter @veb/web test`
17. 在 Core API 中增加声明为 public 的最终博客公开 Route Handler，但暂时只代理旧 Blog API 的公开处理器；保持公开 DTO、Cookie、缓存头、限流和请求 ID 不变 → verify: `pnpm --filter @veb/core-api test -- blog-public route`
18. 将 Web 浏览器代理、公开文章 SSR 和点赞客户端统一切换到 Core API 及 `/api/v1/blog/**`，删除 Web 对 Blog API 上游的选择逻辑和环境变量；底层暂时仍由 Core API 代理旧 Blog API，因此发布到公开读取的现有链路继续工作 → verify: `pnpm --filter @veb/web test && pnpm --filter @veb/core-api test -- blog-public`
19. 为单库直接调用增加管理输入契约，移除客户端提供作者身份的可能性，并保持现有管理响应 DTO 与公开 DTO 的外部字段语义；旧内部服务契约暂时保留到 Blog API 删除 → verify: `pnpm --filter @veb/api-contracts test`
20. 增加一个只使用一次性空 PostgreSQL 实例的初始化验证命令，验证 Prisma Schema、init migration 和 seed，不读取、删除或覆盖开发者现有数据库及 volume → verify: `pnpm db:verify:init`
21. 把文章、标签、文章标签关系和点赞模型合入 Core API 的 Prisma Schema，将文章作者建模为必选 User 外键并使用 Restrict 删除策略；直接重写唯一 init migration，使空库一次得到最终结构，同时生成单一 Prisma Client → verify: `pnpm db:generate && pnpm db:verify:init`
22. 在用户删除服务中把“用户仍有关联文章”的外键拒绝映射为明确的 409 Conflict，并增加不存在用户、无文章用户、有文章用户三类外部行为测试 → verify: `pnpm --filter @veb/core-api test -- user-delete`
23. 将博客 slug、发布状态校验、访客标识与哈希等纯领域辅助逻辑迁入 Core API，去除服务边界相关参数并迁移对应测试 → verify: `pnpm --filter @veb/core-api test -- blog-content`
24. 将博客 Prisma select 和管理/公开序列化逻辑迁入 Core API，改为从 User 关系读取作者身份；验证公开 DTO 仍拒绝数据库 ID、账户用户名、草稿字段和不可能的发布时间状态 → verify: `pnpm --filter @veb/core-api test -- blog-serializer`
25. 迁移公开文章与标签查询服务，保留发布时间过滤、tag 过滤、分页、排序、404 和输出契约，并改用统一 Prisma Client → verify: `pnpm --filter @veb/core-api test -- blog-public-service`
26. 迁移管理文章、作者列表和标签查询服务，保留关键词、状态、日期、作者、标签筛选和分页语义，作者列表直接来自有关联文章的系统用户 → verify: `pnpm --filter @veb/core-api test -- blog-admin-read`
27. 迁移文章创建、更新、发布、删除和标签分配服务，由统一路由边界提供的可信用户写入作者外键；保留 slug 冲突、发布必填校验和发布附加权限 → verify: `pnpm --filter @veb/core-api test -- blog-article-write`
28. 迁移标签创建、更新、删除及标签文章查询服务，保留名称/slug 唯一性、关联约束和错误响应 → verify: `pnpm --filter @veb/core-api test -- blog-tag-write`
29. 迁移公开点赞状态、点赞/取消点赞、管理列表、统计、单条删除和批量删除服务，保留访客 Cookie、哈希、唯一性、限流和时间筛选 → verify: `pnpm --filter @veb/core-api test -- blog-like`
30. 在不切换正式路由的情况下完成并测试直接调用单库服务的公开 HTTP 适配器，验证查询解析、Cookie、缓存头、请求 ID 和统一响应壳 → verify: `pnpm --filter @veb/core-api test -- blog-public-http`
31. 在不切换正式路由的情况下完成并测试直接调用单库服务的管理 HTTP 适配器，逐接口声明 `blog:*` 权限和 `blog.*` 审计动作，并验证发布操作的附加权限 → verify: `pnpm --filter @veb/core-api test -- blog-manage-http`
32. 以一个原子纵向提交把博客公开和管理正式路由同时从代理实现切换为单库直接适配器，更新集成测试为“管理端创建并发布、匿名端读取并点赞、管理端查看统计和删除”；避免管理写旧库而公开读新库的中间状态 → verify: `pnpm --filter @veb/core-api test && pnpm --filter @veb/web test && pnpm test:e2e`
33. 删除 Core API 中的 Blog BFF、公开代理、服务 JWT/JWKS、自检、防重放、跨服务重试、依赖服务 503 映射及其测试；ready 健康检查只检查统一数据库和仍必要的本地配置 → verify: `pnpm --filter @veb/core-api test && pnpm --filter @veb/core-api typecheck`
34. 将 Compose 和根开发脚本收敛为单一 Core API、单一数据库、单一迁移任务、Web 与 Web public gateway，移除 Blog API、Blog PostgreSQL、Blog public gateway、第二套 migration/seed 任务和相关部署清理逻辑 → verify: `docker compose --env-file .env.development config --quiet && pnpm db:verify:init`
35. 将剩余数据库服务与配置统一为通用 `postgres`、`migrate`、`DATABASE_URL` 和 `DB_*` 命名，更新开发/生产环境模板、部署脚本和健康依赖；端口仍保持 Web 1066、Core API 1067 → verify: `docker compose --env-file .env.development config --quiet && pnpm db:verify:init`
36. 删除整个 Blog API 工作区及其 Dockerfile、独立 Prisma Schema、迁移、seed、Route Handler 和已迁移/已替换测试，更新工作区锁文件并验证递归命令不再发现该包 → verify: `test ! -d apps/blog-api && pnpm install --lockfile-only && pnpm -r --if-present test`
37. 删除 `service-auth` 包及所有别名、transpile 配置、密钥变量和文档引用，并确认仓库不再包含服务令牌、JWKS 或 replay 的运行时代码 → verify: `test ! -d packages/service-auth && ! rg -n "@veb/service-auth|SERVICE_AUTH_|JWKS|ServiceTokenReplay" apps packages deploy docker-compose.yml package.json`
38. 把 `api-kit` 的响应、错误、请求 ID、访问日志和输出校验能力及其现有测试迁入 Core API，本提交只切换传输边界相关消费者，保留包给下一步的剩余消费者 → verify: `pnpm --filter @veb/core-api test -- api request-id access-log contract`
39. 把 `api-kit` 的 Prisma 错误识别、singleton、限流和可信客户端 IP 能力及测试迁入 Core API，切换全部剩余消费者，确保没有跨工作区引用 → verify: `pnpm --filter @veb/core-api test -- prisma rate-limit && ! rg -n "@veb/api-kit" apps packages --glob '!packages/api-kit/**'`
40. 删除不再共享的 `api-kit` 包，更新锁文件、Next transpile 列表和工作区脚本；保留迁入 Core API 的测试覆盖 → verify: `test ! -d packages/api-kit && pnpm install --lockfile-only && pnpm --filter @veb/core-api test`
41. 清理共享契约中的旧内部服务 DTO、过渡别名、旧 `content:*` 名称和无消费者的依赖服务错误码，只保留 Web 与 Core API 实际共享的当前契约 → verify: `pnpm --filter @veb/api-contracts test && pnpm --filter @veb/core-api typecheck && pnpm --filter @veb/web typecheck`
42. 完成 Route Handler 策略覆盖检查，移除旧 BFF 临时例外，确认除 Auth.js 适配路由外每个 HTTP 方法都由统一路由边界创建，且所有 private 管理接口有明确 Session/RBAC 行为测试 → verify: `pnpm --filter @veb/core-api test -- route-policy route-auth`
43. 更新仓库指南、根说明、Core API 应用说明、架构、权限和部署文档，准确描述单应用、单数据库、单网关、博客 public/manage 路由、`blog:*` 权限、作者关系、故障边界和首次空库初始化；删除所有旧拓扑表述 → verify: `! rg -n "apps/blog-api|@veb/blog-api|blog-postgres|blog-public|BLOG_API_INTERNAL_URL|VEB_API_INTERNAL_URL|content:" README.md AGENTS.md docs apps packages deploy docker-compose.yml package.json`
44. 执行最终残留扫描和完整质量门禁，验证单库 init + seed、lint、类型检查、全部单元/集成测试、构建、Compose 配置以及端到端管理发布与公开读取流程 → verify: `pnpm db:verify:init && pnpm lint && pnpm typecheck && pnpm test && pnpm build && docker compose --env-file .env.development config --quiet && pnpm test:e2e`

## Decision Document

- 当前行为：系统管理由一个 API 和 VEB 数据库处理；博客管理通过 BFF、服务令牌和内部接口访问另一个 API 与 Blog 数据库；公开博客通过独立上游和网关访问 Blog API。
- 当前行为的问题：博客已经是产品内模块，不再需要独立信任边界、数据所有权、故障边界和部署单元；拆分造成重复配置、代理、鉴权、数据库、测试和运维逻辑。
- 核心不变量：每个标准 API 方法必须显式声明 public 或 private；private 必须先完成 Session，并在有权限声明时完成 RBAC；没有访问声明的标准接口不能被接受。
- 最终应用名为 `core-api`，工作区包名为 `@veb/core-api`，Compose 私网服务名和日志 scope 同步使用 `core-api`。
- Core API 继续监听 1067，Web 继续监听 1066；端口不是本次重构对象。
- 最终只保留一个 PostgreSQL、一个迁移任务和一个 seed；基础设施使用通用数据库命名，不按业务模块拆分。
- 不迁移、回填或兼容旧数据库数据。项目未上线，最终 Prisma Schema 和唯一 init migration 直接表达最新结构。
- 文章、标签、文章标签关系和点赞归 Core API 与统一数据库所有。
- 文章必须关联一个系统用户；作者关系不可为空，删除策略为 Restrict；用户名和昵称从当前用户关系读取，不再保存作者快照字段。
- 删除仍有关联文章的用户返回明确的 409 Conflict；无文章用户仍可按现有权限物理删除。
- 统一路由边界接受 public 或 private 声明。public 不能配置权限；private 可以只要求 Session，也可以配置单个权限或权限列表；权限列表保持现有“任一命中即可访问”的语义。
- 统一路由边界同时负责可信用户上下文、请求 ID、统一错误响应、访问日志和可选操作审计，避免多层包装器产生顺序差异。
- Auth.js 适配路由是唯一技术例外，必须保留现有请求 ID 与访问日志并由专项测试登记；健康检查不是例外，必须声明 public。
- 博客公开接口为：文章列表、按 slug 获取文章、获取点赞状态、点赞、取消点赞、标签列表和按 slug 获取标签，统一位于 `/api/v1/blog/**`。
- 博客管理接口为：文章列表/创建/详情/更新/删除、作者列表、文章标签读取/分配、标签列表/创建/详情/更新/删除/关联文章、点赞列表/详情/统计/删除/批量删除，统一位于 `/api/v1/blog/manage/**`。
- 旧 `/api/v1/public/**` 与旧无 manage 前缀的博客管理接口不提供重定向、别名或兼容响应。
- 其他系统、个人、文件、导航、认证和健康检查 URL 保持不变。
- 现有 `content` 模块整体改名为 `blog`；模块 code、权限码、管理页面路径、操作日志动作、测试和文档同步更新。
- `blog:*` 权限保持现有文章、发布、标签、标签分配、点赞查看、点赞统计和点赞删除的粒度，不借重命名扩大或缩小授权能力。
- 发布文章继续额外要求发布权限；可信作者来自已认证用户上下文，客户端请求不能指定或覆盖作者。
- 公开文章继续要求已发布且发布时间不晚于当前时间；公开 DTO 继续排除数据库 ID、账户用户名、状态和草稿内容。
- 点赞继续使用 HttpOnly、SameSite=Lax 的访客 Cookie、服务端哈希、文章与访客唯一约束以及基于可信客户端 IP 的限流。
- API 继续统一返回 `{ code, data, message }`，分页继续返回 `{ items, total, page, pageSize }`，请求 ID 继续跨 Web 网关、Web 代理和 Core API 传递。
- 浏览器和外部客户端都只通过 Web public gateway 访问；Core API 仅在 Compose 私网可达，不直接发布端口，也不新增第二个 API 网关。
- Web 浏览器代理和服务端渲染只使用一个 Core API 上游；Cookie 和可信代理头处理规则保持。
- Blog 独立故障隔离不再存在。博客数据库不可用不再映射为依赖服务 503，而是统一数据库/应用故障；ready 只检查 Core API 自己的数据库与必要配置。
- 删除 BFF、内部博客接口、服务 JWT/JWKS、防重放、跨服务 GET 重试、Blog public gateway 和所有只为双服务存在的环境变量。
- `api-contracts` 保留为 Web 与 Core API 的共享契约包。
- `api-kit` 的有效实现与测试迁入 Core API 后删除该包；`service-auth` 直接删除；无消费者的错误码、兼容别名、注释和配置一并删除。
- 操作日志继续记录管理写操作的成功和失败，敏感字段继续脱敏；动作名统一进入 `blog.*` 命名空间。
- 所有文档、开发脚本、Docker 构建、Compose、环境模板、迁移、seed、测试和锁文件在同一重构中同步，不留下旧名称或旧拓扑说明。

## Testing Decisions

- 好测试验证外部行为和安全边界，而不是函数内部调用顺序。测试应从 HTTP 状态、响应契约、数据库可观察结果、权限结果、日志结果、Cookie/Header 和公开数据边界判断正确性。
- 对统一路由边界做契约级测试：公开请求不要求 Session；私有请求无 Session 返回认证错误；有 Session 但无权限返回授权错误；业务处理器只接收服务端可信用户；错误和成功响应都有请求 ID 与访问日志；声明审计时成功和失败均记录。
- 对全部 Route Handler 做策略覆盖测试，防止新增接口绕过 `defineApiRoute`。该测试允许且只允许登记后的 Auth.js 技术例外。
- 对博客公开服务测试发布时间过滤、草稿不可见、slug/tag 查询、分页和 DTO 脱敏。
- 对博客管理服务测试 CRUD、slug 冲突、发布校验、发布附加权限、标签分配、筛选和操作审计。
- 对作者关系测试创建文章只能使用当前登录用户、用户信息更新会反映到作者展示、删除有文章用户返回 409、删除无文章用户成功。
- 对点赞测试 Cookie 创建与复用、访客哈希、重复点赞幂等、取消点赞、限流、统计、单删和批量删除。
- 对数据库测试使用一次性空 PostgreSQL，执行唯一 init migration、Prisma Client 生成和单一 seed；不得依赖或清理开发者现有数据库/volume。
- 对 Web 测试单一 Core API 上游、请求 ID、Cookie、代理头清洗、新博客 URL、管理页面路径和 `blog:*` 控件授权。
- 端到端主流程为：登录管理端、创建/发布文章、匿名读取文章、点赞、管理端查看统计并清理测试数据。
- 删除不再成立的测试：服务令牌签发/验签、JWKS 轮换、防重放、BFF 502/503 重试、Blog API 独立环境校验、Blog public gateway 白名单、VEB API 停止时公开博客仍可用。
- 现有测试先例包括：共享契约响应边界测试、API 包装器与请求 ID 测试、RBAC 与页面访问测试、Blog 内容服务/序列化/公开 HTTP 测试、Web API 代理测试以及管理发布到公开读取的端到端测试。
- 规划时的绿色基线为：API contracts 20 个测试、API kit 28 个测试、VEB API 70 个测试、Blog API 32 个测试、Web 42 个单元测试，全部通过。
- 最终门禁必须同时通过 lint、类型检查、全部测试、生产构建、Compose 配置解析、一次性空库初始化和端到端主流程。

## Out of Scope

- 不保留或迁移任何旧本地、测试、预发布或假想生产数据库数据。
- 不提供旧 URL、旧包名、旧服务名、旧环境变量、旧 Prisma Client、旧权限码或旧模块路径的兼容层。
- 不新增博客业务能力，不改变文章编辑体验、Markdown 规则、分页默认值、发布规则、点赞规则或公开 DTO 的产品语义。
- 不重新设计 Auth.js 登录机制、Session 格式、密码策略、角色委派算法或其他系统管理领域规则。
- 不重构文件存储实现、上传 volume 或文件业务接口。
- 不直接暴露 Core API，不新增独立 API 域名、第二个 Nginx 网关或外部服务鉴权方案。
- 不升级 Next.js、Prisma、Auth.js、PostgreSQL 或其他依赖版本。
- 不执行生产部署，也不声称 CI、Compose 构建或本地 smoke test 等同于已上线。
- 不删除开发者现有数据库、Docker volume 或上传目录；空库验证只能使用可识别且自动清理的一次性资源。
- 不处理与本次单体化、命名统一、访问边界和博客模块迁移无关的 UI 改版或代码风格重构。

## Further Notes

- 路由切换必须采用一次原子纵向提交：在切换前先把单库 Schema、领域服务、HTTP 适配器和测试全部准备好，再同时切换管理与公开路由，避免管理写旧库而公开读新库。
- 允许在连续小提交之间保留短暂、明确且有删除提交的脚手架，例如旧 BFF 例外、双权限集合和公开代理；最终门禁要求这些内容全部消失。
- 架构、权限和部署文档是本次重构的一部分，不是后续补充工作。
- 实施前下一步应运行 `kickoff-branch`，创建独立的 refactor 分支和工作树，并先重跑绿色基线。
