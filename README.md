# msp-world-cli

基于 [`msp-ts`](./msp-ts) 构建的 23 个外部 World 节点集合（能力移植自 Pal-AI-Lab / Cortico 社区生态）。除 `minecraft` 需安装 `mineflayer` 系列依赖外，其余 22 个节点全部零第三方运行时依赖，支持 Node.js >= 22.6 原生运行 `.ts`。

## 快速使用

克隆时初始化全部子模块：

```bash
git clone --recurse-submodules https://github.com/msp-world/msp-world-cli.git
cd msp-world-cli
# 已经克隆时：git submodule update --init --recursive
```

```bash
# 查看全部 23 个可用 World
node src/cli.ts --list

# 加载并校验所有零依赖 World 的 Manifest（tools / signals / skills）
npm run lint

# 启动任意节点
npm start -- <world>
# 例如：
WEATHER_PROVIDER=openmeteo npm start -- weather
HASS_URL=http://homeassistant.local:8123 HASS_TOKEN=xxx npm start -- hass
```

通用 MSP 环境变量（适用于所有节点）：`MSP_NODE_ID`、`MSP_HOST`、`MSP_PORT`、`MSP_PEERS`（逗号分隔的 peer 地址）。

---

## 全部 23 个 World 节点

### 一、智能家居 / 生活与桌面感知（直连协议 / 独立运行）

| 节点 (`cli` / `nodeId`) | 说明 | 关键环境变量 |
|---|---|---|
| `hass` | Home Assistant：区域/实体查询、白名单控制、历史记录、摄像头抓图（`ImageContent`）、WebSocket 实时状态推送 | `HASS_URL`, `HASS_TOKEN`, `HASS_ALLOWED_DOMAINS`, `HASS_WATCH_ENTITIES` |
| `weather` | 多源天气（Open-Meteo / NMC / 和风天气 QWeather）、AQI/PM2.5、48h 逐时与多日预报、CMA/QWeather 预警、日出日落与变化检测 | `WEATHER_PROVIDER` (`openmeteo`/`nmc`/`qweather`), `WEATHER_PROVINCE`, `WEATHER_CITY`, `WEATHER_LAT`, `WEATHER_LON`, `QWEATHER_KEY`, `QWEATHER_HOST` |
| `music` | 桌面音频与音乐陪听：跨平台媒体会话读取与控制（Windows SMTC / macOS AppleScript / Linux MPRIS `playerctl`）+ LRCLIB 同步歌词 | — |
| `image` | AI 绘画生成（ComfyUI / OpenAI 兼容图像接口），返回 `BlobRef`（及可选 `ImageContent`） | `IMAGE_OUTPUT_DIR`, `COMFYUI_URL`, `COMFYUI_CKPT`, `IMAGE_OPENAI_URL`, `IMAGE_OPENAI_KEY`, `IMAGE_OPENAI_MODEL` |
| `steam` | 本地 Steam 游戏状态监控（读取 Steam 安装目录/进程与可选 Web API） | `STEAM_DIR`, `STEAM_ID`, `STEAM_API_KEY` |
| `presence` | 在场状态、日程事件与专注模式管理 | — |
| `watch_window` | 桌面指定窗口持续视觉观察（支持注入截图适配器，返回 `ImageContent`） | — |

### 二、直播与视频平台

| 节点 (`cli` / `nodeId`) | 说明 | 关键环境变量 |
|---|---|---|
| `bilibili` | B站直播间直连协议（弹幕、礼物、SC、舰长、进房、批量聚合信号与发弹幕工具） | `BILI_ROOM_ID`, `BILI_SESSDATA`, `BILI_GIFT_FLUSH` |
| `bili_reminder` | B站关注主播开播/下播状态轮询与提醒 | `BILI_FOLLOW_UIDS`（逗号分隔 UID） |
| `bili_watch` | B站视频检索、分 P/信息读取与弹幕陪看 | — |
| `douyin_live` | 抖音直播间 WebSocket 弹幕/礼物桥接客户端（需配合外部抖音弹幕抓取服务） | `DOUYIN_WS_URL`, `DOUYIN_ROOM_ID` |

### 三、游戏直连 / 遥测 / 日志（无需额外自定义 Mod）

| 节点 (`cli` / `nodeId`) | 说明 | 关键环境变量 |
|---|---|---|
| `warthunder` | 战争雷霆本地 `:8111` HTTP 遥测（空战/陆战仪表、地图、战况事件） | `WT_URL`（默认 `http://127.0.0.1:8111`） |
| `ets2` | 欧洲卡车模拟 2 本地 Telemetry Server HTTP 遥测（车速、油量、货物、损伤） | `ETS2_TELEMETRY_URL`（默认 `http://127.0.0.1:25555/api/ets2/telemetry`） |
| `hearthstone` | 炉石传说 `Power.log` 增量解析（对局/回合/血量/费用/手牌/战棋状态） | `HS_POWER_LOG` |
| `minecraft` | Minecraft 机器人（基于 `mineflayer` + `mineflayer-pathfinder`；**运行前需 `npm install`**） | `MC_HOST`, `MC_PORT`, `MC_USERNAME`, `MC_VERSION`, `MC_AUTH` |

### 四、游戏 Mod 桥接节点（需配合游戏侧 Mod / HTTP 桥接）

以下节点实现了完整的 MSP 工具、信号、状态机与多步操作 `SkillSpec`，运行时需配合游戏侧对应 Mod 暴露的本地 HTTP Bridge 或状态文件：

| 节点 (`cli` / `nodeId`) | 游戏 | 桥接方式 / 环境变量 |
|---|---|---|
| `sts` | 杀戮尖塔 (Slay the Spire) | `STS_BRIDGE_URL`（默认 `http://127.0.0.1:17717`，配合 CommunicationMod 桥接） |
| `overcooked2` | 胡闹厨房 2 (Overcooked! 2) | `OC2_BRIDGE_URL`（默认 `http://127.0.0.1:17720`，配合游戏侧 Mod） |
| `stardew` | 星露谷物语 (Stardew Valley) | `STARDEW_BRIDGE_URL`（默认 `http://127.0.0.1:17730`，配合 SMAPI Mod） |
| `majsoul` | 雀魂麻将 (Mahjong Soul) | `MAJSOUL_BRIDGE_URL`（默认 `http://127.0.0.1:17740`，配合对局状态桥接） |
| `pvz` | 植物大战僵尸 (PvZ) | `PVZ_BRIDGE_URL`（默认 `http://127.0.0.1:17750`，配合内存/桥接服务） |
| `buckshot` | 恶魔轮盘 (Buckshot Roulette) | `BUCKSHOT_BRIDGE_URL`（默认 `http://127.0.0.1:17755`，配合游戏侧 Mod） |
| `pz` | 僵尸毁灭工程 (Project Zomboid) | `PZ_STATE_FILE`（配合 Lua Mod 导出的 JSON 状态文件） |
| `titanfall2` | 泰坦陨落 2 (Titanfall 2) | `TF2_BRIDGE_URL`（默认 `http://127.0.0.1:17760`，配合 Northstar Mod） |

---

## 说明

- `msp-world` 保持纯源码形态（默认不安装 `node_modules`）。仅在使用 `minecraft` 节点时需要执行 `npm install`。
- 12 个多步骤/状态受限节点（`hass`, `minecraft`, `image`, `hearthstone`, `sts`, `buckshot`, `stardew`, `majsoul`, `pvz`, `overcooked2`, `bili_watch`, `watch_window`）均已注册 MSP 0.1.0a2 `SkillSpec`。
- 图像类工具（`hass_camera_snapshot`, `image_generate`, `watch_window_look`）均已使用 `ToolResult` 返回标准 `ImageContent` / `BlobRef`。

## 上游与致谢

本项目的 World 能力参考或移植自 [Pal-AI-Lab/Cortico](https://github.com/Pal-AI-Lab/Cortico) 及其社区生态。各节点仓库 README 列出了源码记录的上游项目和已核实的作者；未能核实的作者标注为待确认。MSP 实现的许可证版权署名为 [hxh230802](https://github.com/hxh230802)，详见 [msp-ts](https://github.com/msp-world/msp-ts)。感谢所有上游作者与贡献者。
