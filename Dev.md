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

## TODO
1. 优化API KEYS 和 Codex 之间的路由策略 ✔

2. 做约束
技术付费版本，默认只支持一个添加一个 codex 账号 Or 可以通过持续购买扩容码的方式添加新的 codex 机器
添加可以自动生成 扩展码的 代码

3. 扩展码（只防小白，不防大神）
记录，生效时间 + 过期时间 + 激活数量 + secret—key 进行签名。后台部署校验规则鉴权，是否运行添加。




