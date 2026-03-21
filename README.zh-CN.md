<p align="center">
  <img src="assets/cover.png" alt="MelodyType 封面" width="100%" />
</p>

<h1 align="center">MelodyType</h1>

<p align="center">
  <strong>当打字遇上音乐</strong> — 一个注重隐私的打字练习应用，将每一次击键化为旋律。
</p>

<p align="center">
  <a href="./README.md">English | 中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-087ea4?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Tone.js-15-f734a3?logo=data:image/svg+xml;base64,&logoColor=white" alt="Tone.js" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue" alt="License" />
</p>

---

MelodyType 是一个纯客户端 Web 应用，拥有 MIDI 驱动的音频反馈和全面的进度追踪。所有数据保存在你的浏览器中 — 无需注册、无需云端、完全隐私。

## 目录

- [功能特性](#功能特性)
- [预览](#预览)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [数据与隐私](#数据与隐私)
- [许可证](#许可证)
- [致谢](#致谢)

---

## 功能特性

### 音乐打字

每一次击键都会演奏一个音符，练习即演出。

- **5 种合成器音色** — 钢琴、弦乐、合成器、音乐盒、钟声
- **自定义 MIDI 文件** — 上传你自己的旋律进行个性化练习
- **内置预设** — 小星星、欢乐颂、卡农、致爱丽丝、C 大调音阶、半音阶
- **播放模式** — 循环、单次、顺序、随机
- **播放列表** — 从预设和上传文件中构建自定义播放列表，支持拖拽排序
- **旋律流量表** — 实时可视化你的打字节奏
- **悬浮播放器** — 可最小化的悬浮 MIDI 播放器，全页面可见

### 自适应学习

一套根据你的技能水平智能适配的练习系统，灵感来自 [keybr.com](https://www.keybr.com)。

**渐进式按键解锁** — 从 6 个最常用的英文字母开始，掌握每个按键后按频率顺序解锁新字母：

```
e → n → i → t → r → l → s → a → u → o → d → y → c → h → g → m → p → b → k → v → w → f → z → x → q → j
```

**智能文本生成** — 使用基于英语语音数据训练的四阶马尔可夫链，生成自然发音的伪单词，重点练习你的薄弱按键。

**逐键进度追踪** — EWMA 速度、准确率追踪，以及多项式回归预测达到精通所需的练习次数。

**精通标准：**
- EWMA 速度达到目标 CPM（默认 175，可配置 75–750）
- 至少 35 次正确击键记录
- 近期准确率 ≥ 90%（衰减加权）
- 终身准确率 ≥ 88%

**连续练习** — 回合无缝衔接。按 `Esc` 暂停并查看进度。

### 练习模式

| 模式 | 描述 |
|------|------|
| **自适应** | 连续练习，渐进式按键解锁与智能文本生成 |
| **计时** | 结构化关卡系统，4 个难度层级，字母等级（F–S），进度追踪 |
| **引用** | 输入名人名言，增加多样性和自然语言练习 |

### 数据面板

通过详细的数据分析追踪你的进步：

- **数据概览** — 7 个核心指标卡片，悬停查看详情
- **活动热力图** — GitHub 风格的每日练习活跃度
- **每日目标环** — 可交互的拖拽环形进度条，设定每日练习目标
- **WPM 与准确率图表** — 聚合趋势，支持时间范围选择
- **键盘热力图** — 错误率、频率、转换三种视图
- **按键详情面板** — 逐键统计与学习趋势
- **自适应进度卡** — 解锁状态、信心度图谱、练习平均值
- **练习历史** — 近期练习记录，按模式筛选

---

## 预览

<p align="center">
  <img src="assets/preview1.png" alt="练习 — 自适应模式" width="100%" />
  <br />
  <em>自适应练习：实时指标、虚拟键盘、MIDI 播放</em>
</p>

<p align="center">
  <img src="assets/preview2.png" alt="数据面板 — 概览" width="100%" />
  <br />
  <em>数据面板：统计概览、活动热力图、每日目标追踪</em>
</p>

<p align="center">
  <img src="assets/preview3.png" alt="数据面板 — 键盘热力图" width="100%" />
  <br />
  <em>键盘热力图：转换弧线与逐键详细分析</em>
</p>

<p align="center">
  <img src="assets/preview4.png" alt="MIDI 管理" width="100%" />
  <br />
  <em>MIDI 管理 — 音色、预设、上传与播放列表</em>
</p>

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [React](https://react.dev) 19 |
| 语言 | [TypeScript](https://www.typescriptlang.org) 5.9 |
| 构建工具 | [Vite](https://vite.dev) 8 |
| 样式 | [Tailwind CSS](https://tailwindcss.com) 4 |
| UI 组件 | [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) |
| 本地存储 | [Dexie.js](https://dexie.org) (IndexedDB) |
| 音频 | [Tone.js](https://tonejs.github.io) |
| MIDI 解析 | [@tonejs/midi](https://github.com/Tonejs/Midi) |
| 图表 | [Recharts](https://recharts.org) |
| 动画 | [Framer Motion](https://www.framer.com/motion/) |
| 路由 | [React Router](https://reactrouter.com) |
| 测试 | [Vitest](https://vitest.dev) |

---

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io)

### 安装

```bash
git clone https://github.com/fl0w1nd/MelodyType.git
cd MelodyType
pnpm install
```

### 开发

```bash
pnpm dev        # 启动开发服务器 http://localhost:5173
pnpm build      # 生产构建
pnpm preview    # 预览生产构建
pnpm lint       # 运行 ESLint
npx vitest run  # 运行测试
```

> **提示**：无需 `.env` 文件或 API 密钥 — 应用完全自包含。

### 部署

#### Vercel

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffl0w1nd%2FMelodyType">
  <img src="https://vercel.com/button" alt="部署到 Vercel" />
</a>

#### Docker Compose

```yaml
services:
  melodytype:
    image: ghcr.io/fl0w1nd/melodytype:latest
    container_name: melodytype
    ports:
      - "3000:80"
    restart: unless-stopped
```

```bash
docker compose up -d
```

#### Docker

```bash
docker build -t melodytype .
docker run -d -p 3000:3000 melodytype
```

---

## 项目结构

```
src/
├── engine/                         # 核心业务逻辑
│   ├── typing/                     # 打字引擎（马尔可夫链、自适应、数学工具）
│   ├── midi/                       # MIDI 音频系统（Tone.js、调度）
│   └── practice/                   # 练习编排与数据持久化
├── components/                     # React 组件
│   ├── practice/                   # 练习界面
│   ├── dashboard/                  # 数据面板与分析
│   ├── layout/                     # 应用外壳与背景
│   └── ui/                         # shadcn/ui 基础组件
├── pages/                          # 页面组件（懒加载）
├── lib/                            # 工具库（数据库、设置、辅助函数）
├── App.tsx                         # 路由与 Provider
├── main.tsx                        # 入口文件
└── index.css                       # 全局样式（Tailwind v4）
```

---

## 数据与隐私

- **本地优先** — 所有数据存储在浏览器 IndexedDB 中
- **无追踪** — 无分析、无遥测、无外部请求（除 Google Fonts）
- **可迁移** — 在设置中导出/导入完整 JSON 备份
- **隐私** — 你的打字数据永远不会离开浏览器

---

## 许可证

[AGPL-3.0](LICENSE)

---

## 致谢

- [keybr.com](https://www.keybr.com) — 自适应学习算法的灵感来源
