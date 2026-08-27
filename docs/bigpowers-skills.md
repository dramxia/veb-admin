# bigpowers Agent Skills 总览（中文说明）

> 来源：本机 pi 已安装的 bigpowers 包 `~/.pi/agent/npm/node_modules/bigpowers`（v2.87.5）。
> 共 **81 个 skills**，按其 6 阶段生命周期（DISCOVER → ELABORATE → PLAN → BUILD → VERIFY → RELEASE）及功能分类整理。
> 官方目录：[SKILL-INDEX.md](https://github.com/danielvm-git/bigpowers/blob/main/SKILL-INDEX.md) · [文档站](https://danielvm-git.github.io/bigpowers/)

## 目录

- [一、入门与元技能](#一入门与元技能)
- [二、项目初始化](#二项目初始化)
- [三、阶段 1 DISCOVER — 调研发现](#三阶段-1-discover--调研发现)
- [四、阶段 2 ELABORATE — 细化建模](#四阶段-2-elaborate--细化建模)
- [五、阶段 3 PLAN — 规划排期](#五阶段-3-plan--规划排期)
- [六、阶段 4 BUILD — 构建开发](#六阶段-4-build--构建开发)
- [七、阶段 5 VERIFY — 验证审计](#七阶段-5-verify--验证审计)
- [八、阶段 6 RELEASE — 提交发布](#八阶段-6-release--提交发布)
- [九、文档与知识管理](#九文档与知识管理)
- [十、运维、可观测性与报告](#十运维可观测性与报告)
- [十一、前端设计专用](#十一前端设计专用)
- [十二、已废弃](#十二已废弃)

---

## 一、入门与元技能

| Skill                 | 作用                                                                                                                                                                           |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `using-bigpowers`     | **一次性引导技能**。介绍 bigpowers 技能体系、PMBOK 式生命周期，并根据你当前所处情境告诉你应先调用哪个技能。首次使用 bigpowers、或问"从哪开始"时用。                            |
| `orchestrate-project` | **元技能/总指挥**。强制执行 6 阶段核心循环（discover → elaborate → plan → build → verify → release）及各阶段硬性门禁，用于协调多阶段项目、保证质量检查点。每项目只需运行一次。 |
| `search-skills`       | 用自然语言描述意图，在本地词法索引（SKILL.md frontmatter）中查找最合适的 bigpowers 技能。不确定该调哪个技能时用。                                                              |
| `compose-workflow`    | 将多个 bigpowers 技能串成自定义工作流"配方"并保存到 `specs/`。当项目反复执行某个非标准技能序列、或想要一份超出 orchestrate-project 模式的 playbook 时用。                      |
| `craft-skill`         | 按 bigpowers 规范（正确结构、渐进式披露、捆绑资源）创建新技能。想为生命周期新写一个技能时用。                                                                                  |
| `evolve-skill`        | 基准测试门控的技能演进——消费 bigpowers-benchmark 报告 → 提出变更计划 → 用 craft-skill 修改技能 → 重跑基准 → 记录 ADR。当技能在基准测试中表现不佳或盘点发现系统性缺陷时用。     |
| `stocktake-skills`    | 用顺序子代理对技能目录做批量审计，分快速扫描（仅变更项）和全量两种模式。维护期、大版本发布前或怀疑目录漂移时用。                                                               |
| `terse-mode`          | 兜底的超压缩通信模式，砍掉填充词、冠词和客套话，省约 75% token 但保持技术准确性。**仅在上下文临界、必须压缩输出才能继续时使用**。                                              |

## 二、项目初始化

| Skill                | 作用                                                                                                                                                                                                                          |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seed-conventions`   | 面向全新项目的入口技能。通过简短访谈生成 `CLAUDE.md` 和 `CONVENTIONS.md`，并创建符合 bigpowers 演进结构的 `specs/` 目录（product/、tech-architecture/、verifications/、epics/archive/ 等）。绿地项目、或尚无 CLAUDE.md 时用。 |
| `audit-plan`         | 按 bigpowers 原则与约定评估外来项目计划，暴露缺口并给出 READY / NOT READY 结论。新项目接手、适配外部计划、在不熟悉的代码库上跑 seed-conventions 之前用。                                                                      |
| `migrate-spec`       | 检测 GSD、spec-kit、BMAD 等外来的规格产物，并将其转换为 bigpowers 的 YAML 布局（state.yaml、release-plan.yaml、epics/、requirements/、plans/、ADR）。迁移外部规格文档时用。                                                   |
| `setup-environment`  | 在开发开始前预装依赖并配置工具。新克隆仓库的会话开始时、kickoff-branch 之前、"setup environment / install deps" 时用。                                                                                                        |
| `organize-workspace` | 扫描工作区中的可清理产物（日志、缓存、过期构建输出、散落草稿 md），生成可审查清单，删除/移动前需显式确认，可选修订 .gitignore。说"clean my room / 整理工作区 / 清理临时文件"时用。                                            |

## 三、阶段 1 DISCOVER — 调研发现

| Skill            | 作用                                                                                                                                                                                                      |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `survey-context` | **每次任务的上下文引导**。读取现有 `specs/` 与 tech-architecture 文档，定位当前所处生命周期阶段并建议下一个技能。任何任务开始时、中断后回来、或不知下一步做什么时用。                                     |
| `map-codebase`   | 从零扫描代码库推导技术栈文档——分析技术栈、架构与灰色地带（错误处理、API 形态），持久化到 `specs/tech-architecture/tech-stack.md`。该文档尚不存在时先跑这个，之后由 survey-context 消费。                  |
| `research-first` | "先查再造"——实现前先搜软件仓库、代码库、已有技能和网上的现成方案，并把 Prior Art 追加到规格中。survey-context 之后、elaborate-spec 之前，或添加依赖时用。                                                 |
| `context7-mcp`   | 通过 Context7 MCP 拉取最新的库文档（而非训练数据）。问 React、Next.js、Prisma 等框架/API/配置/代码示例时用。                                                                                              |
| `run-planning`   | **发现阶段推进器**。驱动 `specs/planning-status.yaml` 中的 checklist 走完 survey-context → scope-work → research-first → elaborate-spec → plan-release → slice-tasks 链条。只负责编码前的 discover 阶段。 |
| `find-way`       | 将大型工作规划为 issue tracker 上的一张"决策票地图"，逐张解决直到路径清晰。想法大到一次会话做不完、实现前需要结构化探索时用。                                                                             |

## 四、阶段 2 ELABORATE — 细化建模

| Skill                 | 作用                                                                                                                                                           |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `elaborate-spec`      | 通过对话把粗糙想法提炼成清晰详细的规格，不产出一行代码。用户只有模糊想法、想在规划前把功能想透、或需要把"我想要 X"变成具体规格时用。                           |
| `grill-me`            | 交互式"拷问"——通过 relentless 提问对计划做压力测试，挖出所有假设直到每个决策都有结论。想挑战一个计划、验证决策时用；需要引用真实文档的变体见 grill-with-docs。 |
| `grill-with-docs`     | grill-me 的文档接地变体——通过抓取并引用真实库/API 文档来压测计划假设，每次质疑必须引用真实 URL。计划依赖特定库或外部 API 时用。                                |
| `model-domain`        | 拷问式会话——用现有领域模型挑战你的计划、锐化术语，并在决策成型时就地更新 tech-stack 文档与 ADR。想对照项目的领域语言和既有决策压测计划时用。                   |
| `define-language`     | 从当前对话中提取 DDD 风格的统一语言术语表，标记歧义并提议规范术语，保存到 `specs/UBIQUITOUS_LANGUAGE_LATEST.md`。提到"domain model / DDD / 术语表"时用。       |
| `deepen-architecture` | 依据领域语言与 ADR 寻找代码库的"深化"机会（Ousterhout 深模块理念）。想改进架构、找重构机会、合并强耦合模块、提升可测试性与 AI 可导航性时用。                   |
| `design-interface`    | 基于《A Philosophy of Software Design》的 "Design It Twice"：用并行子代理为一个模块生成多个截然不同的接口设计，再比较权衡。设计 API、探索接口选项时用。        |
| `spike-prototype`     | 面向未知问题域的一次性原型，产出是 `specs/archive/spikes/` 中的学习笔记而非生产代码。领域/技术未探索、不实验就无法估算、说"spike / prototype / POC"时用。      |

## 五、阶段 3 PLAN — 规划排期

规划主线（Planning Spine）三步：`scope-work`（定范围）→ `slice-tasks`（切故事）→ `plan-work`（写任务）。

| Skill            | 作用                                                                                                                                                                     |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scope-work`     | **规划主线第 1/3 步**：定义哪些在范围内、哪些不在，保存为 `specs/product/SCOPE_LATEST.yaml`。任何新动议在 slice-tasks / plan-release 之前用。                            |
| `slice-tasks`    | **规划主线第 2/3 步**：把已定范围的 PRD 拆成垂直切片故事，放入 `specs/epics/`。scope-work 之后、plan-work 之前用。                                                       |
| `plan-work`      | **规划主线第 3/3 步**：把详细实现任务写入活动 epic 胶囊（`specs/epics/eNN-slug/`），产出可数故事格式的 .md 规格和可执行的 `-tasks.yaml`。slice-tasks 之后用。            |
| `plan-release`   | **发布索引构建器**：把已细化的 epic 按 WSJF 排序并附 BCP 基线，序列化为 `specs/release-plan.yaml`。elaborate-spec 之后、需要版本化发布索引时用。                         |
| `change-request` | 对照 `specs/release-plan.yaml` 和 epic 胶囊，按 WSJF 新增需求（Add 模式）或重排优先级（Reorder 模式）。发布中期来了新需求时用。                                          |
| `assess-impact`  | 在写任何代码之前分析变更的"爆炸半径"——映射依赖方、受影响故事与测试覆盖，产出 `specs/IMPACT_LATEST.md`。非平凡变更在 plan-work 之前、动共享模块、或问"这会弄坏什么"时用。 |
| `plan-refactor`  | 通过用户访谈制定含微小提交的重构计划，保存为 `specs/REFACTOR_LATEST.md`。规划重构、写重构 RFC、把重构拆成安全增量步骤时用。                                              |
| `plan-tests`     | 在实现开始前为 epic 设计风险分级的测试架构——产出优先级场景、测试层级分布与 fixture 计划（基于 TEA 与 bigpowers 原则）。                                                  |

## 六、阶段 4 BUILD — 构建开发

| Skill             | 作用                                                                                                                                                                                                                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `build-epic`      | **八步 epic 构建循环**（survey-context → plan-work → kickoff-branch → develop-tdd → verify-work → audit-code → commit-message → release-branch）。读取 state.yaml / execution-status.yaml 与单个 epic 胶囊并更新状态；续跑模式每次调用只跑一步。发布类工作用它而非临时 execute-plan。 |
| `execute-plan`    | 从活动 epic 胶囊顺序批量执行任务，每步之后设人工检查点。已有批准的计划且想要逐步监督时用。                                                                                                                                                                                            |
| `kickoff-branch`  | 创建 git worktree 与特性分支，并在写任何代码前验证测试基线干净。开始新特性/任务、想与 main 隔离、"start a branch / new worktree" 时用。                                                                                                                                               |
| `develop-tdd`     | 红-绿-重构循环的 TDD 开发，采用垂直切片。做功能（epic 任务）或修 bug（`specs/bugs/BUG-*.md`）时用。                                                                                                                                                                                   |
| `fix-bug`         | **缺陷修复编排器**（active_flow = fix_bug）：读取 `specs/bugs/BUG-*.md`，串联 investigate-bug → develop-tdd → validate-fix。用户报告缺陷时用。                                                                                                                                        |
| `investigate-bug` | 通过探索代码库调查 bug 根因，然后把基于 TDD 的修复计划写入 `specs/bugs/BUG-*.md`。报告 bug、调查问题、triage、规划修复时用。                                                                                                                                                          |
| `diagnose-root`   | 四阶段根因分析——复现、隔离、假设、验证。bug 已确认但根因不明、investigate-bug 之后、或提到"根因分析"时用。                                                                                                                                                                            |
| `diagnose-stall`  | 诊断 agent 编排为何停滞——/loop、dispatch-agents、execute-plan 中的静默卡死。工作看似挂起、几分钟无输出、子代理未返回时用。                                                                                                                                                            |
| `validate-fix`    | 在宣称"修好"之前证明修复有效——重跑失败测试、跑全套件、typecheck、lint，并加固防复发。实现修复后、问"is this fixed?"时用。                                                                                                                                                             |
| `quick-fix`       | 纯数据类琐碎修复的快速通道——免 TDD、免分支仪式，把 6 个技能压缩为 2 个。防护栏触发时自动中止并回落到 investigate-bug。                                                                                                                                                                |
| `delegate-task`   | 把一个复杂任务委派给单个子代理，合回前分两阶段审查其工作。串行、一次一个代理、有监督。任务复杂且结果需仔细审查才接受时用（与 dispatch-agents 的区别：无并行）。                                                                                                                       |
| `dispatch-agents` | 在真正解耦的任务上**并行**派发多个子代理，之间零等待。任务彼此独立且速度优先时用（与 delegate-task 的区别：并发、无任务间审查门）。                                                                                                                                                   |
| `simulate-agents` | 在人工审查前用全新上下文运行 Mock User 和 Auditor 代理对一个特性做预演。verify-work 之后、request-review 之前用。                                                                                                                                                                     |

## 七、阶段 5 VERIFY — 验证审计

| Skill                | 作用                                                                                                                                                                                                                    |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify-work`        | **多阶段 UAT 门禁**——冷启动冒烟、构建、typecheck、lint、测试、逐步手工验证、缺口闭环循环。execute-plan / develop-tdd 之后、audit-code 之前用。                                                                          |
| `audit-code`         | 编码代理在派出审查者之前的**自审清单**——检查 CONVENTIONS.md 合规、童子军规则、测试覆盖、类型与 SOLID，产出 pass/fail 清单。request-review 之前、提交之前、或要代码质量检查时用。                                        |
| `request-review`     | 派出一个全新上下文、与编码代理零共享状态的审查代理来批评代码，给出真正的第二意见。audit-code 通过之后、提交之前用。                                                                                                     |
| `respond-review`     | 系统化处理审查代理的反馈——归类发现、应用修复、验证测试仍通过。request-review 返回报告之后用。                                                                                                                           |
| `security-review`    | AI 驱动的代码变更安全分析——跨文件追踪数据流，检测注入、鉴权绕过、密钥泄露与不安全反序列化。审查待提交变更、release-branch 之前、verify-work 第 5 阶段、build-epic 第 0 步威胁建模、或说"security review / 扫漏洞"时用。 |
| `enforce-first`      | 对测试套件或单个测试应用 F.I.R.S.T 测试质量量规（CONVENTIONS.md §Tests）。develop-tdd 写测试时、检查测试质量、提到 F.I.R.S.T 时用。                                                                                     |
| `validate-contracts` | 断言系统边界两侧数据形态一致——用 JSON Schema 校验真实 API 响应、跨层 key 集比对、迁移/导出的数据形态校验。在部署前捕获静默数据损坏。                                                                                    |
| `run-evals`          | 评估驱动开发——构建前先定义能力与回归 eval；代码评分器用 verify 命令、模型评分器用显式量规，记录 pass@k。新功能 develop-tdd 之前、或度量代理能力时用。                                                                   |
| `run-benchmark`      | 按 `specs/benchmarks/` 定义跑技能质量基准——N 次"带技能/不带技能"差值评分、训练/验证切分、pass@k 与 benchmark.json 报告。evolve-skill 前后各跑一次，证明改动是改进而非回归。                                             |
| `inspect-quality`    | 交互式 QA 会话——用户以对话方式报告 bug/问题，代理用结构化审计 schema 记入 `specs/bugs/registry.yaml`，后台同步探索代码库获取上下文与领域语言。说"QA session / 报 bug"时用。                                             |
| `smoke-test`         | 对线上 URL 做部署后健康检查——校验 HTTP 状态、响应内容与关键端点。可独立运行，也可作为 deploy 技能的最后一步。                                                                                                           |
| `gate-trace`         | 确定性追溯性质量门——读取覆盖矩阵与盲点数据，应用带"oracle 置信度降级"的决策规则，输出 PASS / CONCERNS / FAIL / WAIVED 结论。release-branch 之前作为合入门禁用。                                                         |
| `trace-requirement`  | 把 `specs/release-plan.yaml` 与 epic 胶囊中的故事 ID 链接到实现代码与测试，产出 `specs/TRACEABILITY_LATEST.md`。验证发布计划覆盖、审计哪些故事已实现、找出无代码的"暗故事"时用。                                        |

## 八、阶段 6 RELEASE — 提交发布

| Skill             | 作用                                                                                                                                                                                                                          |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commit-message`  | 审查工作区变更，起草 Conventional Commits 标题/正文，并说明该提交隐含的 semantic-release 版本跃迁，同时标注触及的防御性代码类别。要提交、要准备提交信息、要 semver 一致的消息时用。                                           |
| `release-branch`  | 为特性分支做 merge/PR/keep/discard 决策，验证覆盖门禁，用 `gh` 创建 PR 并清理 worktree。特性完成准备发布、"release / merge / open a PR" 时用。                                                                                |
| `guard-git`       | 拦截危险 git 命令（push、force push、reset --hard、clean、branch -D、checkout/restore .）并在 AI 代理执行前强制 Conventional Commits 与分支保护。为 Claude Code、Cursor、Gemini CLI 等装钩子脚本，统一各工具的 git 安全策略。 |
| `hook-commits`    | 在仓库配置 pre-commit 钩子（Husky + lint-staged 的 Prettier、类型检查、测试）。要加提交钩子、配置 lint-staged 时用。                                                                                                          |
| `wire-ci`         | CI 流水线搭建——自带中立模板与本地校验，从 git remote 识别 forge（GitHub/GitLab 等）生成 workflow，不支持的诚实跳过。CI 版的 wire-observability。                                                                              |
| `deploy`          | 构建 → 校验产物 → 部署 → 等待 → 冒烟的完整流水线。平台无关（MCP 或 CLI），带可配置超时、指数退避重试与集成健康检查。CI/CD 的"部署半场"。                                                                                      |
| `publish-package` | 发布到 npm / crates.io / PyPI / Homebrew——校验前置条件、执行发布命令、确认成功，失败时给出可操作的错误提示。                                                                                                                  |
| `reset-baseline`  | 把项目恢复到已知干净状态。基准测试两轮之间、失败的 spike 之后、或想要干净工作区时用。                                                                                                                                         |

## 九、文档与知识管理

| Skill            | 作用                                                                                                                                                                              |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `write-document` | 按 BMAD 方法论书写、组织并同步高完整性技术文档——确保每份文档 Bold、Minimal、Actionable、Durable。写架构文档、技术指南、组织 specs/ 目录时用。                                     |
| `edit-document`  | 编辑改进文档——重组章节、提升清晰度、收紧行文。适用于 specs/ 文件、文章、README、技术写作。                                                                                        |
| `simple-english` | 按 ASD-STE100 简化技术英语的 53 条规则（Issue 9）书写或改写技术文本，配确定性 lint 门禁，产出清晰、无歧义、无 AI 味的文档。写 README、runbook、错误信息、发布说明、API 指南时用。 |
| `maintain-wiki`  | 代理维护的 OKF wiki——INGEST 摄入源文档、LINT 检查问题、QUERY 跨概念页查询。作为 build-epic 第 8 步与 verify-work 第 3 阶段的一部分运行。                                          |
| `session-state`  | 在 `specs/state.yaml` 中追踪实现决策与进度，防止上下文腐烂。会话开始加载上下文时、每做出重大决策或到达里程碑时用。                                                                |

## 十、运维、可观测性与报告

| Skill                    | 作用                                                                                                                                                                                                                       |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wire-observability`     | 为项目添加结构化 JSON 日志、可观测性命令与幂等安装脚本。需要生产就绪插桩、结构化日志、或作为任一阶段的生产就绪门禁时用。                                                                                                   |
| `harden-vps`             | 三层加固生产 Linux VPS——应用层（systemd 加固、监控告警、备份自动化）、Ubuntu OS 层（UFW、fail2ban、unattended-upgrades、SSH 加固）、VPS 供应商层（健康检查、每日备份、每月快照）。要保护生产服务器、审计服务器安全时用。   |
| `visual-dashboard`       | 启动浏览器可视化面板，展示架构、实现计划与项目状态，产物持久化到 `.bigpowers/dashboard/`，通过 HTTP API 读取 state.yaml、release-plan.yaml、epics 等。                                                                     |
| `generate-allure-report` | 从 bigpowers YAML 元数据（execution-status、release-plan、epic 胶囊、任务 YAML、cycle-times、bug 登记）生成 Allure 兼容报告（junit-results.xml、categories.json 等）。做进度面板、接入 Allure TestOps 或生成 CI 报告时用。 |

## 十一、前端设计专用

| Skill            | 作用                                                                                                                                                                                                                                                                                                                                                                |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `align-grid`     | 在**真正的 Müller-Brockmann 模块化网格**（国际主义排版风格）上构建编辑/杂志/报告类网页，而非装饰性网格：列+模块+基线的纪律、格洛特斯克字体、左对齐、克制的黑白红配色；工程上保证网格真实可见可验证——CSS 变量单一事实源、与内容同盒的网格切换浮层、subgrid 栏带、8px 基线锁定、运行时光学对齐（让显示字体的墨而非盒贴线），附脚手架生成器与 Puppeteer 0px 偏差验证。 |
| `extract-design` | 用 Puppeteer 从 HTML 原型（claude.ai/design 或任何带样式页面）提取 Google 风格的 `DESIGN.md`，产出机器可读 token 与 AI 生成的文字说明。有 HTML 原型想锚定项目视觉体系时用。                                                                                                                                                                                         |

## 十二、已废弃

| Skill            | 作用                                                                          |
| :--------------- | :---------------------------------------------------------------------------- |
| `define-success` | **墓碑技能**——已重命名/合并到 `plan-work`。此存根只保留一个发布周期后即移除。 |

---

## 附：与本项目（veb）的关联提示

bigpowers 的 `specs/` 驾驶舱结构（state.yaml、release-plan.yaml、epics/）与本项目现有 `specs/REFACTOR_LATEST.md` 可互补；若想试点，建议从 `survey-context`、`session-state`、`commit-message`、`verify-work` 这几个低侵入技能开始，而不是一次性引入完整 6 阶段流程。
