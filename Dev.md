## 任务类型: 功能开发

目标位置:
类:
- 外部API调用执行类
- 外部API调用封装类
- 用量统计聚合服务类
- 用量统计Web页面控制器/视图模型类
- Windows桌面应用用量统计页面视图模型类
方法:
- 发起外部API调用的方法
- 处理外部API响应的方法
- 记录调用日志的方法
- 查询调用统计列表的方法
- 查询调用汇总统计的方法
- Web端用量统计页面加载方法
- 桌面端用量统计页面加载方法

当前行为:
- 系统在外部调用API时未持久化记录每次调用的详细状态信息
- 系统无法查询单次API调用的接口名称、调用时间、调用状态、Token消耗等数据
- 用量统计页面未展示外部API调用明细与统计信息
- Web页面和Windows桌面应用中均无法查看外部API调用记录

期望行为:
- 每次外部API调用时自动记录调用日志
- 调用日志至少包含以下字段：
    - 接口标识
    - 接口名称或URL
    - 调用时间
    - 调用结束时间
    - 调用状态
    - 是否成功
    - 请求耗时
    - 输入Token数
    - 输出Token数
    - 总Token数
    - 错误信息
- 调用完成后，无论成功或失败，都必须生成一条可查询的调用记录
- 用量统计页面可以展示调用明细列表和汇总统计
- 用户可以通过Web页面查看调用记录
- 用户可以通过Windows桌面应用查看调用记录

修改要求:
- 在所有外部API调用入口统一增加调用日志记录逻辑
- 调用前写入初始记录，调用结束后更新最终状态
- 成功时记录成功状态、Token消耗、耗时、响应完成时间
- 失败时记录失败状态、错误信息、耗时、响应完成时间
- 若第三方API未直接返回Token信息，按当前系统可获取的数据进行兼容处理，字段保留且不能为空时使用默认值
- 新增调用日志持久化模型、数据表或存储结构
- 新增调用日志查询服务，用于明细查询与汇总统计
- 在用量统计页面新增以下展示内容：
    - 调用记录列表
    - 成功/失败状态
    - 接口名称或接口地址
    - 调用时间
    - Token消耗
    - 总调用次数
    - 成功次数
    - 失败次数
    - Token总消耗
- Web页面与Windows桌面应用必须共用同一套后端统计口径
- 若项目已有用量统计模块，则在现有模块中扩展；若没有，则新增独立的调用统计模块并接入现有导航或入口

输出要求:
- 完成代码修改
- 完成数据库结构或存储结构变更
- 完成外部API调用日志记录能力
- 完成用量统计查询接口或服务
- 完成Web端用量统计展示
- 完成Windows桌面应用用量统计展示
- 保证调用成功与失败场景均可展示记录
- 提供最终修改文件列表
- 提供验证结果，至少包含：
    - 成功调用记录验证
    - 失败调用记录验证
    - Web页面展示验证
    - Windows桌面应用展示验证

约束:
- 不允许只记录成功调用，失败调用必须记录
- 不允许遗漏Token相关字段
- 不允许在各调用点重复散落实现，必须尽量集中封装
- 不允许修改无关业务逻辑
- 不允许破坏现有外部API调用流程
- 页面展示字段名称必须与日志字段语义一致
- 若存在多种外部API接入方式，必须覆盖所有实际外部调用路径
- 所有新增字段、方法、页面元素命名必须清晰且可维护



## 任务类型: 功能增强

目标位置:
类:
- API调用日志实体类
- API调用日志持久化映射类
- API调用日志记录服务类
- API调用日志查询服务类
- 用量统计聚合服务类
- 用量统计Web页面控制器/视图模型类
- Windows桌面应用用量统计页面视图模型类
方法:
- 记录API调用日志的方法
- 更新API调用结果的方法
- 查询API调用日志列表的方法
- 查询API调用统计汇总的方法
- Web端用量统计页面加载方法
- 桌面端用量统计页面加载方法

当前行为:
- 系统已实现API调用日志存储能力
- 系统已实现API调用日志查询能力
- 当前调用日志中缺少本次调用所使用模型的信息
- 当前查询结果与统计页面无法展示每次调用对应的模型信息

期望行为:
- 每条API调用日志都必须记录本次调用所使用的模型信息
- API调用日志查询结果中必须包含模型信息字段
- 用量统计页面必须能够展示每次调用对应的模型信息
- Web页面与Windows桌面应用中均可查看模型信息

修改要求:
- 在API调用日志数据模型中新增模型信息字段
- 在日志存储结构中新增对应字段，并完成映射
- 在API调用发起或日志记录流程中补充模型信息写入逻辑
- 若调用链路中已有模型标识参数，直接透传并落库
- 若模型信息存在于请求对象、响应对象或上下文中，统一从稳定来源提取
- 在API调用日志查询结果DTO或视图模型中新增模型信息字段
- 在日志列表查询、详情查询、统计展示所使用的数据返回结构中补充模型信息
- 在Web端用量统计页面中新增模型信息展示列或字段
- 在Windows桌面应用用量统计页面中新增模型信息展示列或字段
- 若已有筛选能力，支持按模型信息进行筛选；若当前无筛选能力，则本次不新增筛选功能
- 保持现有日志记录、查询、统计逻辑不变，仅补充模型信息相关能力

输出要求:
- 完成代码修改
- 完成数据库结构或存储结构变更
- 完成模型信息写入日志
- 完成查询结果返回模型信息
- 完成Web端模型信息展示
- 完成Windows桌面应用模型信息展示
- 提供最终修改文件列表
- 提供验证结果，至少包含：
    - 日志写入模型信息验证
    - 日志查询返回模型信息验证
    - Web页面展示模型信息验证
    - Windows桌面应用展示模型信息验证

约束:
- 不允许只在页面层拼接模型信息，必须以日志正式字段存储和查询
- 不允许修改无关业务逻辑
- 不允许破坏现有API调用日志存储与查询功能
- 模型信息字段命名必须清晰且语义明确
- 若历史数据不存在模型信息，查询时必须兼容旧数据
- Web页面与Windows桌面应用的模型信息展示口径必须一致

## 任务类型: Bug Fix

目标位置:
- 类: `UpstreamRouter`
- 方法: `resolve(model: string): UpstreamAdapter`
- 文件: [upstream-router.ts](D:/Dev/IDEA/Project/codex-proxy/src/proxy/upstream-router.ts)

当前行为:
- 当请求模型未命中以下任一条件时:
  - `ApiKeyPool` 精确匹配
  - 显式 provider 前缀
  - `model_routing`
  - 内建 pattern 规则
- `resolve()` 未回退到 `codex` 路线
- 当前实现会回退到 `adapters.values().next().value`
- 当已配置 provider adapter 且未注册 `codex` adapter 时，请求会错误走到第一个 provider adapter
- 结果是路由层判断 `isCodexModel(model) === false`，继续执行 `handleDirectRequest(...)`
- 最终请求错误走 API Key，而不是账号池

期望行为:
- 当且仅当请求模型未命中以下任一条件时:
  - `ApiKeyPool` 精确匹配
  - 显式 provider 前缀
  - `model_routing`
  - 内建 pattern 规则
- `resolve()` 必须明确回退到 `codex` 路线
- 不允许回退到任意 provider adapter
- 路由层必须将此类请求识别为 `codex` 模型，并进入账号池逻辑

修改要求:
- 修改 `UpstreamRouter.resolve()` 的默认回退逻辑
- 移除“未找到 `codex` adapter 时回退到第一个 adapter”的行为
- 确保默认回退结果语义上等价于 `codex`
- 如果当前架构要求 `resolve()` 必须返回 `UpstreamAdapter` 实例，则实现一个明确、安全、可维护的 `codex` 默认回退方案
- 不得通过调整 `ApiKeyPool`、`model_routing`、模型名解析规则或路由层绕过该问题
- 仅修复默认 fallback 行为，不修改已有优先级顺序

输出要求:
- 修改生产代码
- 补充或更新测试，覆盖以下场景:
  - 未命中 `ApiKeyPool`、前缀、`model_routing`、pattern 时，`resolve()` 回退到 `codex`
  - 已配置 provider adapter 但未命中任何规则时，不得回退到第一个 provider
  - `isCodexModel()` 在上述场景下返回 `true`
  - 已命中 `ApiKeyPool`、前缀、`model_routing`、pattern 的行为保持不变
- 提供最终变更摘要
- 提供验证结果

约束:
- 不得修改现有优先级:
  1. `ApiKeyPool`
  2. 显式 provider 前缀
  3. `model_routing`
  4. 内建 pattern
  5. 默认回退 `codex`
- 不得引入模糊 fallback
- 不得让未知模型继续走任意 provider adapter
- 不得删除现有测试覆盖
- 变更范围限定在与该路由缺陷直接相关的代码和测试
- 保持现有公开接口尽可能稳定


## 任务类型: Bug Fix

目标位置:
- 类: `ApiCallLogStore`
- 方法: `startCall(input: ApiCallLogStartInput): string`
- 文件: [api-call-logs.ts](D:/Dev/IDEA/Project/codex-proxy/src/services/api-call-logs.ts)
- 类: 路由层 API 代理处理逻辑
- 方法: `handleDirectRequest(...)`
- 文件: [proxy-handler.ts](D:/Dev/IDEA/Project/codex-proxy/src/routes/shared/proxy-handler.ts)
- 类: API 路由
- 方法:
  - `POST /v1/chat/completions`
  - `POST /v1/messages`
  - `POST /v1beta/models/:modelAction`
  - `POST /v1/responses`
- 文件:
  - [chat.ts](D:/Dev/IDEA/Project/codex-proxy/src/routes/chat.ts)
  - [messages.ts](D:/Dev/IDEA/Project/codex-proxy/src/routes/messages.ts)
  - [gemini.ts](D:/Dev/IDEA/Project/codex-proxy/src/routes/gemini.ts)
  - [responses.ts](D:/Dev/IDEA/Project/codex-proxy/src/routes/responses.ts)

当前行为:
- API 调用记录中的 `model` 字段记录的是路由层构造的展示模型名
- 该值可能来自本地 `parseModelName()` 与 `buildDisplayModelName()` 处理结果
- 当请求模型未被本地模型目录识别或发生默认回退时，日志中的 `model` 可能被记录为默认模型，例如 `gpt-5.2-codex`
- 在第三方 provider 直连场景中，虽然实际上发往上游的模型名称是原始请求模型，例如 `deepseek-chat`，但日志仍可能记录为本地解析后的展示模型名

期望行为:
- API 调用记录中的 `model` 字段必须记录实际发往上游服务商的真实模型名称
- 在第三方 provider 直连场景中，日志必须记录真实上游模型名，例如 `deepseek-chat`
- 不得记录本地展示模型名
- 不得记录默认回退后的模型名，除非该模型名本身就是实际发往上游的模型名
- 账号池 / codex 路线中，日志记录值必须与实际发往 codex 上游的模型名一致

修改要求:
- 修正 API 调用日志写入时的模型来源
- 在所有直连上游的路径中，日志 `model` 必须取实际发送给上游的请求模型名
- 在 codex / 账号池路径中，日志 `model` 必须取实际发送给 codex 上游的请求模型名
- 不得继续使用仅用于展示、路由判断或本地别名解析的模型名称作为日志值
- 如有必要，调整路由层传入 `handleDirectRequest(...)` 或 `handleProxyRequest(...)` 的模型字段来源
- 保持对现有日志结构字段名 `model` 的兼容，不新增替代字段

输出要求:
- 修改生产代码
- 补充或更新测试，覆盖以下场景:
  - 第三方 provider 直连时，日志记录真实上游模型名
  - 本地展示模型名与真实上游模型名不一致时，日志仍记录真实上游模型名
  - 默认回退发生时，如真实上游请求模型不同于展示模型，日志记录真实上游模型名
  - codex / 账号池路径中，日志记录实际发往 codex 的模型名
- 提供最终变更摘要
- 提供验证结果

约束:
- 不得修改 API 调用记录的数据结构
- 不得修改字段名 `model`
- 不得引入新的日志字段替代 `model`
- 不得改变真实上游请求的模型路由逻辑
- 不得仅修复单一路由，必须覆盖所有会写入 API 调用记录的调用路径
- 保持现有公开接口尽可能稳定

## 任务类型: Security Hardening / Feature Removal

目标位置:
- 类: 服务启动逻辑
- 方法:
  - `startServer(options?: StartOptions): Promise<ServerHandle>`
- 文件: [index.ts](D:/Dev/IDEA/Project/codex-proxy/src/index.ts)

- 类: 更新路由
- 方法:
  - `createUpdateRoutes(): Hono`
  - `GET /admin/update-status`
  - `POST /admin/check-update`
  - `POST /admin/apply-update`
- 文件: [update.ts](D:/Dev/IDEA/Project/codex-proxy/src/routes/admin/update.ts)

- 类: 代理自更新逻辑
- 方法:
  - `checkProxySelfUpdate()`
  - `applyProxySelfUpdate(...)`
  - `startProxyUpdateChecker()`
  - `stopProxyUpdateChecker()`
- 文件: [self-update.ts](D:/Dev/IDEA/Project/codex-proxy/src/self-update.ts)

- 类: Codex 版本更新检查逻辑
- 方法:
  - `checkForUpdate()`
  - `startUpdateChecker()`
  - `stopUpdateChecker()`
- 文件: [update-checker.ts](D:/Dev/IDEA/Project/codex-proxy/src/update-checker.ts)

- 类: Electron 自动更新逻辑
- 方法:
  - `initAutoUpdater(...)`
  - `checkForUpdateManual()`
  - `downloadUpdate()`
  - `installUpdate()`
  - `stopAutoUpdater()`
- 文件: [auto-updater.ts](D:/Dev/IDEA/Project/codex-proxy/packages/electron/electron/auto-updater.ts)

- 类: Electron 主进程
- 方法:
  - 应用启动阶段对自动更新的初始化
  - `buildTrayMenu()`
  - `createWindow()`
- 文件: [main.ts](D:/Dev/IDEA/Project/codex-proxy/packages/electron/electron/main.ts)

- 类: Web 顶部导航
- 方法: `Header(...)`
- 文件: [Header.tsx](D:/Dev/IDEA/Project/codex-proxy/web/src/components/Header.tsx)

- 类: Web 更新弹窗
- 方法: `UpdateModal(...)`
- 文件: [UpdateModal.tsx](D:/Dev/IDEA/Project/codex-proxy/web/src/components/UpdateModal.tsx)

- 类: Web 页脚
- 方法: `Footer(...)`
- 文件: [Footer.tsx](D:/Dev/IDEA/Project/codex-proxy/web/src/components/Footer.tsx)

当前行为:
- 项目包含与核心 API 中转功能无关的第三方外链和远程更新能力
- Web 界面存在跳转到 GitHub / Release 页等外部链接
- Electron 存在打开外部链接、检查更新、下载更新、安装更新等逻辑
- 后端存在主动联网的更新检查逻辑，可能访问 GitHub、GHCR、远程 appcast 等外部地址
- 应用启动后会启动更新轮询任务
- 系统托盘菜单存在检查更新、下载更新、安装更新等功能
- 这些能力与 API 中转核心功能无关，存在对外联网和信息暴露面

期望行为:
- 删除所有与项目核心 API 中转功能无关的第三方外链、远程更新、自动更新、版本探测、发布页跳转能力
- 应用运行期间不得因非核心功能主动访问任何第三方更新源、发布源、代码托管源或外部页面
- Electron 不得自动打开任何外部链接
- Web 界面不得包含 GitHub、Release、捐赠、社群、外部推广类入口
- 保留账号池、Provider API Key、代理池、模型路由、Dashboard、调用日志等核心代理能力
- 项目在通过接口提供服务时，不得因非核心功能额外向外发送无关请求

修改要求:
- 删除后端更新接口及其依赖调用链
- 删除启动阶段所有自动更新检查任务
- 删除 `self-update.ts` 与 `update-checker.ts` 的功能接入；如文件仍保留，仅允许保留不会触发联网与不会暴露外部信息的最小兼容实现
- 删除 Electron 自动更新能力与托盘更新菜单项
- 删除 Electron 中所有对外部链接的打开行为
- 将 Electron `setWindowOpenHandler` 调整为拒绝非本地页面打开，禁止调用 `shell.openExternal(...)`
- 删除 Web 中所有外链按钮、更新按钮、更新状态入口、更新弹窗入口
- 删除与更新状态展示相关的前端依赖，避免残留请求 `/admin/update-status`
- 如页脚版本展示依赖更新状态接口，移除该依赖或改为仅展示本地静态版本信息
- 全局清理与以下类别相关的内容:
  - GitHub / Releases / Issues / X / 社群 / 打赏 / 捐赠
  - 自动更新 / 检查更新 / 下载更新 / 安装更新
  - 外部发布页跳转 / 浏览器打开外链
  - 与核心代理功能无关的远程版本探测
- 同步删除或更新相关测试，确保测试结果与新行为一致
- 不得影响核心 API 转发、账号池、API Key 池、代理池、模型转换、Dashboard 登录等主功能

输出要求:
- 修改生产代码
- 修改或删除失效测试
- 补充测试覆盖以下场景:
  - 启动服务后不会自动启动非核心远程更新检查
  - `/admin/update-status`、`/admin/check-update`、`/admin/apply-update` 不再可用，或被明确移除且前端不再依赖
  - Electron 不再触发外链打开行为
  - Web 界面不再包含 GitHub / 更新 / Release 等入口
  - 核心 API 路由与认证流程保持可用
- 提供最终变更摘要
- 提供验证结果

约束:
- 不得保留任何与核心 API 中转功能无关的主动联网逻辑
- 不得保留任何自动更新、远程版本检查、发布页跳转、外部推广入口
- 不得仅隐藏 UI，必须同时移除后端或主进程中的实际执行逻辑
- 不得破坏现有核心代理能力
- 不得引入新的第三方外联依赖
- 变更范围必须覆盖后端、Web、Electron 三端中所有相关入口
- 保持现有核心公开接口尽可能稳定，非核心更新接口允许直接删除



## 任务类型: Security Hardening / Content Removal

目标位置:
- 类: Web 顶部导航
- 方法: `Header(...)`
- 文件: [Header.tsx](D:/Dev/IDEA/Project/codex-proxy/web/src/components/Header.tsx)

- 类: Web 页脚
- 方法: `Footer(...)`
- 文件: [Footer.tsx](D:/Dev/IDEA/Project/codex-proxy/web/src/components/Footer.tsx)

- 类: Web 更新弹窗
- 方法: `UpdateModal(...)`
- 文件: [UpdateModal.tsx](D:/Dev/IDEA/Project/codex-proxy/web/src/components/UpdateModal.tsx)

- 类: Electron 主进程
- 方法:
  - `createWindow()`
  - `buildTrayMenu()`
  - 任何外链打开相关逻辑
- 文件: [main.ts](D:/Dev/IDEA/Project/codex-proxy/packages/electron/electron/main.ts)

- 类: Electron 自动更新逻辑
- 方法: 与 GitHub Release、作者仓库、发布页相关的全部方法
- 文件: [auto-updater.ts](D:/Dev/IDEA/Project/codex-proxy/packages/electron/electron/auto-updater.ts)

- 类: 后端更新与发布信息逻辑
- 方法:
  - `checkProxySelfUpdate()`
  - `checkGitHubRelease()`
  - 相关发布信息拼装逻辑
- 文件: [self-update.ts](D:/Dev/IDEA/Project/codex-proxy/src/self-update.ts)

- 目标范围:
  - `src/`
  - `web/`
  - `packages/electron/`
  - `config/`
  - 项目文档与静态资源中所有与作者身份、社交账号、仓库主页、Issues、Releases、捐赠、交流群、推广入口相关的内容

当前行为:
- 项目中存在与作者相关的信息与入口
- 可能包括作者仓库链接、作者主页、社交账号、GitHub 仓库、Issues、Releases、捐赠二维码、交流群、署名性展示、推广性文案
- 这些内容分布在 Web、Electron、后端更新逻辑、文档和静态资源中
- 部分内容可能通过 UI 展示，部分内容可能通过远程发布页、更新页、作者仓库地址间接暴露

期望行为:
- 删除项目中所有与作者信息相关的内容
- 删除作者身份、作者主页、社交账号、仓库地址、Issues、Releases、捐赠、交流群、推广入口、署名展示
- 删除所有与作者信息相关的跳转、文案、静态资源、配置、发布链接、更新链接
- 删除后，项目不得在界面、代码、配置、文档、静态资源中暴露作者相关信息

修改要求:
- 全局清理以下类别内容:
  - 作者姓名、用户名、昵称、GitHub 仓库地址
  - GitHub Issues / Releases / Profile / Sponsor / Follow / Star
  - X / Twitter / 微信 / 交流群 / 打赏 / 捐赠
  - README、文档、UI 文案、按钮、图标、图片、二维码、推广语
- 删除与作者仓库、发布页、主页绑定的 URL 常量、配置值、拼装逻辑
- 删除与作者信息相关的静态资源文件引用；若资源仅用于作者展示，直接移除
- 删除 UI 中所有作者信息展示入口，不得仅隐藏
- 删除文档中所有作者宣传、关注、捐赠、社群相关段落
- 如某些代码路径仅用于作者信息展示或跳转，应连同逻辑一起删除
- 保持核心 API 中转功能不变

输出要求:
- 修改生产代码
- 修改或删除相关静态资源引用
- 修改文档内容，移除作者相关信息
- 修改或删除相关测试
- 提供最终变更摘要
- 提供验证结果

约束:
- 不得保留任何作者身份、社交账号、仓库主页、捐赠、社群、推广类信息
- 不得仅替换文案而保留原跳转逻辑
- 不得影响核心代理、账号池、API Key、代理池、模型路由、Dashboard 等主功能
- 变更范围必须覆盖代码、UI、配置、文档、静态资源
- 保持现有核心公开接口尽可能稳定


## TODO
1. 优化API KEYS 和 Codex 之间的路由策略 ✔

2. 做约束
技术付费版本，默认只支持一个添加一个 codex 账号 Or 可以通过持续购买扩容码的方式添加新的 codex 机器
添加可以自动生成 扩展码的 代码

3. 扩展码（只防小白，不防大神）
记录，生效时间 + 过期时间 + 激活数量 + secret—key 进行签名。后台部署校验规则鉴权，是否运行添加。

4. API 调用记录 采用分页，最小 10条记录，最大100条记录



