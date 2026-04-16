# 购买GPT Plus账号 | ChatGPT会员 | 低价Codex Plus | 官方授权

**🔗 官方售卖地址：[https://pay.ldxp.cn/shop/MKZAQO3Q](https://pay.ldxp.cn/shop/MKZAQO3Q)**

## 🔥 热门搜索关键词
购买ChatGPT会员、低价Codex Plus、GPT Plus账号购买、ChatGPT Plus订阅、OpenAI账号购买、Codex Plus低价、ChatGPT会员购买、GPT Plus优惠、Codex Plus账号、OpenAI Plus账号、ChatGPT Plus折扣、Codex Plus订阅、GPT Plus代购、ChatGPT Plus购买渠道、Codex Plus官方授权

---

<div align="center">

  <h1>Codex Proxy</h1>
  <h3>您的本地 Codex 编程助手中转站</h3>
  <p>将 Codex Desktop 的能力以 OpenAI / Anthropic / Gemini 标准协议对外暴露，无缝接入任意 AI 客户端。</p>

  <p>
    <img src="https://img.shields.io/badge/Runtime-Node.js_18+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Framework-Hono-E36002?style=flat-square" alt="Hono">
    <img src="https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Desktop-Win%20%7C%20Mac%20%7C%20Linux-8A2BE2?style=flat-square&logo=electron&logoColor=white" alt="Desktop">
    <img src="https://img.shields.io/badge/License-Non--Commercial-red?style=flat-square" alt="License">
  </p>

  <p>
    <a href="#-快速开始">快速开始</a> &bull;
    <a href="#-核心功能">核心功能</a> &bull;
    <a href="#-可用模型">可用模型</a> &bull;
    <a href="#-客户端接入">客户端接入</a>
  </p>

  <p>
    <strong>简体中文</strong> |
    <a href="./README_EN.md">English</a>
  </p>

  <br>

  <h2 style="color: #ff4500; font-size: 24px;">💎 购买GPT Plus账号，享受Codex Plus的强大功能</h2>
  <p style="font-size: 18px; margin: 20px 0;">
    <a href="https://pay.ldxp.cn/shop/MKZAQO3Q" style="color: #0066cc; text-decoration: none; font-weight: bold; font-size: 20px;">🔗 https://pay.ldxp.cn/shop/MKZAQO3Q</a>
  </p>
  <p style="font-size: 16px; color: #333;">官方授权，安全可靠，价格优惠，快速发货</p>

  <br>

  <a href="https://x.com/IceBearMiner"><img src="https://img.shields.io/badge/Follow-@IceBearMiner-000?style=flat-square&logo=x&logoColor=white" alt="X"></a>
  <a href="https://github.com/icebear0828/codex-proxy/issues"><img src="https://img.shields.io/github/issues/icebear0828/codex-proxy?style=flat-square" alt="Issues"></a>

  <br><br>

</div>

---

> **声明**：本项目由个人独立开发和维护，初衷是解决自己的需求。我有自己的注册机，根本不缺 token，所以这个项目不是为了"薅"谁的资源而存在的。
> 
> 我自愿开源、自愿维护。该有的功能我会加，有 bug 我也会第一时间修。但我没有义务为任何单个用户提供定制服务。
> 
> 觉得代码垃圾？可以不用。觉得你写得更好？欢迎提 PR 加入贡献者。Issue 区用来反馈 bug 和建议，不是用来提需求、催更新、或指点江山的。

---

**Codex Proxy** 是一个轻量级本地中转服务，将 [Codex Desktop](https://openai.com/codex) 的 Responses API 转换为多种标准协议接口（OpenAI `/v1/chat/completions`、Anthropic `/v1/messages`、Gemini、Codex `/v1/responses` 直通）。通过本项目，您可以在 Cursor、Claude Code、Continue 等任何兼容上述协议的客户端中直接使用 Codex 编程模型。

只需一个 ChatGPT 账号（或接入第三方 API 中转站），配合本代理即可在本地搭建一个专属的 AI 编程助手网关。

## 🚀 快速开始

> **前置条件**：你需要一个 ChatGPT 账号（免费账号即可）。如果还没有，先去 <a href="https://pay.ldxp.cn/shop/MKZAQO3Q">https://pay.ldxp.cn/shop/MKZAQO3Q</a> 购买一个。

### 方式一：桌面应用（推荐新手）

下载 → 安装 → 打开就能用。

**下载安装包** — 打开 [Releases 页面](https://github.com/icebear0828/codex-proxy/releases)，根据系统下载：

| 系统 | 文件 |
|------|------|
| Windows | `Codex Proxy Setup x.x.x.exe` |
| macOS | `Codex Proxy-x.x.x.dmg` |
| Linux | `Codex Proxy-x.x.x.AppImage` |

安装后打开应用，点击登录按钮用 ChatGPT 账号登录。浏览器访问 `http://localhost:8080` 即可看到控制面板。

### 方式二：Docker 部署

```bash
mkdir codex-proxy && cd codex-proxy
curl -O https://raw.githubusercontent.com/icebear0828/codex-proxy/master/docker-compose.yml
curl -O https://raw.githubusercontent.com/icebear0828/codex-proxy/master/.env.example
cp .env.example .env
docker compose up -d
# 打开 http://localhost:8080 登录
```

> 账号数据保存在 `data/` 文件夹，重启不丢失。其他容器连本服务用宿主机 IP（如 `192.168.x.x:8080`），不要用 `localhost`。

### 方式三：源码运行

```bash
git clone https://github.com/icebear0828/codex-proxy.git
cd codex-proxy
npm install                        # 安装后端依赖
cd web && npm install && cd ..     # 安装前端依赖
npm run dev                        # 开发模式（热重载）
# 或: npm run build && npm start   # 生产模式
```

> **需要 Rust 工具链**（用于编译 TLS native addon）：
> ```bash
> # 1. 安装 Rust（如果没有的话）
> curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
> # 2. 编译 TLS addon
> cd native && npm install && npm run build && cd ..
> ```

打开 `http://localhost:8080` 登录。

## 🌟 核心功能

### 🔌 全协议兼容
- 兼容 `/v1/chat/completions`（OpenAI）、`/v1/messages`（Anthropic）、Gemini 格式及 `/v1/responses`（Codex 直通）
- SSE 流式输出，可直接对接所有 OpenAI / Anthropic SDK 和客户端
- 自动完成 Chat Completions / Anthropic / Gemini ↔ Codex Responses API 双向协议转换
- **Structured Outputs** — `response_format`（`json_object` / `json_schema`）和 Gemini `responseMimeType`
- **Function Calling** — 原生 `function_call` / `tool_calls` 支持（所有协议）

### 🔐 账号管理与智能轮换
- **OAuth PKCE 登录** — 浏览器一键授权，无需手动复制 Token
- **多账号轮换** — `least_used`（最少使用优先）、`round_robin`（轮询）、`sticky`（粘性）三种策略
- **Plan Routing** — 不同 plan（free/plus/team/business）的账号自动路由到各自支持的模型
- **Token 自动续期** — JWT 到期前自动刷新，指数退避重试
- **配额自动刷新** — 后台每 5 分钟拉取各账号额度，达到阈值时弹出预警横幅；额度耗尽自动跳过
- **封禁检测** — 上游 403 自动标记 banned；401 token 吊销自动过期并切换账号
- **Relay 中转站** — 支持接入第三方 API 中转站（API Key + baseUrl），自动按 `format` 决定直通或翻译
- **Web 控制面板** — 账号管理、用量统计、批量操作，中英双语；远程访问需 Dashboard 登录门

### 🌐 代理池
- **Per-Account 代理路由** — 为不同账号配置不同的上游代理
- **四种分配模式** — Global Default / Direct / Auto / 指定代理
- **健康检查** — 定时 + 手动，通过 ipify 获取出口 IP 和延迟
- **不可达自动标记** — 代理不可达时自动排除

### 🛡️ 反检测与协议伪装
- **Rust Native TLS** — 内置 reqwest + rustls native addon，TLS 指纹与真实 Codex Desktop 精确一致（依赖版本锁定）
- **完整请求头** — `originator`、`User-Agent`、`x-openai-internal-codex-residency`、`x-codex-turn-state`、`x-client-request-id` 等头按真实客户端行为发送
- **Cookie 持久化** — 自动捕获和回放 Cloudflare Cookie
- **指纹自动更新** — 轮询 Codex Desktop 更新源，自动同步 `app_version` 和 `build_number`

## 🏗️ 技术架构

```
                                Codex Proxy
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Client (Cursor / Claude Code / Continue / SDK / ...)    │
│       │                                                  │
│  POST /v1/chat/completions (OpenAI)                      │
│  POST /v1/messages         (Anthropic)                   │
│  POST /v1/responses        (Codex 直通)                  │
│  POST /gemini/*            (Gemini)                      │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────┐   │
│  │  Routes   │──▶│  Translation  │──▶│    Proxy     │   │
│  │  (Hono)  │   │ Multi→Codex   │   │ Native TLS   │   │
│  └──────────┘   └───────────────┘   └──────┬───────┘   │
│       ▲                                     │           │
│       │          ┌───────────────┐          │           │
│       └──────────│  Translation  │◀─────────┘           │
│                  │ Codex→Multi   │  SSE stream          │
│                  └───────────────┘                       │
│                                                          │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │   Auth   │  │  Fingerprint  │  │   Model Store    │  │
│  │ OAuth/JWT│  │ Rust (rustls) │  │ Static + Dynamic │  │
│  │  Relay   │  │  Headers/UA   │  │  Plan Routing    │  │
│  └──────────┘  └───────────────┘  └──────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                Rust Native Addon (napi-rs)
              reqwest 0.12.28 + rustls 0.23.36
             (TLS 指纹 = 真实 Codex Desktop)
                          │
                   ┌──────┴──────┐
                   ▼             ▼
              chatgpt.com   Relay 中转站
         /backend-api/codex  (第三方 API)
```

## 📦 可用模型

| 模型 ID | 别名 | 推理等级 | 说明 |
|---------|------|---------|------|
| `gpt-5.4` | — | low / medium / high / xhigh | 最新旗舰模型 |
| `gpt-5.4-mini` | — | low / medium / high / xhigh | 5.4 轻量版 |
| `gpt-5.3-codex` | — | low / medium / high / xhigh | 5.3 编程优化模型 |
| `gpt-5.2-codex` | `codex` | low / medium / high / xhigh | 前沿 agentic 编程模型（默认） |
| `gpt-5.2` | — | low / medium / high / xhigh | 专业工作 + 长时间代理 |
| `gpt-5.1-codex-max` | — | low / medium / high / xhigh | 扩展上下文 / 深度推理 |
| `gpt-5.1-codex` | — | low / medium / high | GPT-5.1 编程模型 |
| `gpt-5.1` | — | low / medium / high | 通用 GPT-5.1 |
| `gpt-5-codex` | — | low / medium / high | GPT-5 编程模型 |
| `gpt-5` | — | minimal / low / medium / high | 通用 GPT-5 |
| `gpt-oss-120b` | — | low / medium / high | 开源 120B 模型 |
| `gpt-oss-20b` | — | low / medium / high | 开源 20B 模型 |
| `gpt-5.1-codex-mini` | — | medium / high | 轻量快速编程模型 |
| `gpt-5-codex-mini` | — | medium / high | 轻量编程模型 |

> **后缀**：任意模型名后追加 `-fast` 启用 Fast 模式，`-high`/`-low` 切换推理等级。例如：`codex-fast`、`gpt-5.2-codex-high-fast`。
> 
> **Plan Routing**：不同 plan（free/plus/team/business）的账号自动路由到各自支持的模型。模型列表由后端动态获取，自动同步。

## 🔗 客户端接入

> 所有客户端的 API Key 均从控制面板 (`http://localhost:8080`) 获取。模型名填 `codex`（默认 gpt-5.2-codex）或任意 [可用模型](#-可用模型) ID。

### 通用设置

| 设置项 | 值 |
|--------|-----|
| Base URL | `http://localhost:8080/v1` |
| API Key | 控制面板获取 |
| Model | `codex`（或其他模型 ID） |

### 常用客户端

- **Claude Code (CLI)**：设置 `ANTHROPIC_BASE_URL=http://localhost:8080` 和 `ANTHROPIC_API_KEY=your-api-key`
- **Cursor**：设置 OpenAI API，Base URL 为 `http://localhost:8080/v1`，添加模型名 `codex`
- **Continue (VSCode 扩展)**：在 `~/.continue/config.json` 中配置 OpenAI 兼容设置
- **Cherry Studio**：添加 OpenAI 类型服务，API 地址为 `http://localhost:8080/v1`

## ⚙️ 配置说明

默认配置位于 `config/default.yaml`，自定义配置请通过 Dashboard 设置面板修改（自动保存到 `data/local.yaml`）。

### 局域网访问

默认监听 `127.0.0.1`（仅本机）。如需局域网内其他设备访问，在 `data/local.yaml` 中添加：

```yaml
server:
  host: "0.0.0.0"
```

> ⚠️ 绑定 `0.0.0.0` 会将服务暴露到局域网，务必在 Dashboard → 密钥设置中配置强密钥。

## 📡 API 端点

**协议端点**

| 端点 | 方法 | 说明 |
|------|------|------|
| `/v1/chat/completions` | POST | OpenAI 格式聊天补全 |
| `/v1/responses` | POST | Codex Responses API 直通 |
| `/v1/messages` | POST | Anthropic 格式聊天补全 |
| `/v1/models` | GET | 可用模型列表 |

## 📋 系统要求

- **Node.js** 18+（推荐 20+）
- **Rust** — 源码运行需 Rust 工具链（编译 TLS native addon）；Docker / 桌面应用已内置
- **ChatGPT 账号** — 免费账号即可，推荐购买 Plus 账号获得更多功能
- **Docker**（可选）

## ⚠️ 注意事项

- Codex API 为**流式输出专用**，`stream: false` 时代理内部流式收集后返回完整 JSON
- 本项目依赖 Codex Desktop 的公开接口，上游版本更新时会自动检测并更新指纹
- Windows 下 native TLS addon 需 Rust 工具链编译；Docker 部署已预编译，无需额外配置

## 📝 最近更新

> 完整更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)

## 📄 许可协议

本项目采用 **非商业许可 (Non-Commercial)**：

- **允许**：个人学习、研究、自用部署
- **禁止**：任何形式的商业用途，包括但不限于出售、转售、收费代理、商业产品集成

本项目与 OpenAI 无关联。使用者需自行承担风险并遵守 OpenAI 的服务条款。

---

<div align="center">
  <h2 style="color: #ff4500; font-size: 24px;">🔥 购买GPT Plus账号，享受Codex Plus的强大功能</h2>
  <p style="font-size: 18px; margin: 20px 0;">
    <a href="https://pay.ldxp.cn/shop/MKZAQO3Q" style="color: #0066cc; text-decoration: none; font-weight: bold; font-size: 20px;">🔗 https://pay.ldxp.cn/shop/MKZAQO3Q</a>
  </p>
  <p style="font-size: 16px; color: #333;">官方授权，安全可靠，价格优惠，快速发货</p>
  <br>
  <sub>Built with Hono + TypeScript + Rust | Powered by Codex Desktop API</sub>
</div>

---

## 🔍 搜索关键词
购买ChatGPT会员、低价Codex Plus、GPT Plus账号购买、ChatGPT Plus订阅、OpenAI账号购买、Codex Plus低价、ChatGPT会员购买、GPT Plus优惠、Codex Plus账号、OpenAI Plus账号、ChatGPT Plus折扣、Codex Plus订阅、GPT Plus代购、ChatGPT Plus购买渠道、Codex Plus官方授权、购买GPT Plus、ChatGPT Plus账号、Codex Plus购买、OpenAI Plus会员、ChatGPT Plus会员购买、GPT Plus低价、Codex Plus官方、ChatGPT Plus官方购买、GPT Plus账号代购、Codex Plus会员、OpenAI账号代购、ChatGPT Plus优惠、Codex Plus折扣、GPT Plus官方授权、ChatGPT Plus官方授权、Codex Plus购买渠道、GPT Plus购买渠道、ChatGPT Plus会员价格、Codex Plus会员价格、GPT Plus账号价格、ChatGPT Plus账号价格、Codex Plus低价购买、GPT Plus低价购买、ChatGPT Plus会员优惠、Codex Plus会员优惠、GPT Plus账号优惠、ChatGPT Plus账号优惠、Codex Plus官方购买、GPT Plus官方购买、ChatGPT Plus代购、Codex Plus代购、OpenAI Plus账号购买、OpenAI Plus会员购买、ChatGPT Plus购买、Codex Plus购买、GPT Plus购买、OpenAI Plus购买、ChatGPT会员购买、Codex会员购买、GPT会员购买、OpenAI会员购买、ChatGPT Plus订阅价格、Codex Plus订阅价格、GPT Plus订阅价格、OpenAI Plus订阅价格、ChatGPT Plus订阅优惠、Codex Plus订阅优惠、GPT Plus订阅优惠、OpenAI Plus订阅优惠、ChatGPT Plus会员订阅、Codex Plus会员订阅、GPT Plus会员订阅、OpenAI Plus会员订阅、ChatGPT Plus账号订阅、Codex Plus账号订阅、GPT Plus账号订阅、OpenAI Plus账号订阅