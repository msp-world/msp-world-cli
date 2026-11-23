/**
 * msp-world 统一启动器与 Manifest 自检工具。
 *
 * 用法：
 *   node src/cli.ts --list           列出全部 23 个 World
 *   node src/cli.ts --lint           加载并校验所有零依赖 World 的 Manifest（tools/signals/skills）
 *   node src/cli.ts <world>          启动指定 World MSP 节点
 */
import * as os from "node:os";
import * as path from "node:path";
import { MSPNode, installShutdownHooks, lintManifest, mspOptionsFromEnv } from "./shared/msp.ts";
import type { ImageModelEntry } from "./image/world.ts";

interface WorldEntry {
  nodeId: string;
  create: () => Promise<{ attach(node: MSPNode): void; start?(): void | Promise<void>; stop?(): void }>;
}

const REGISTRY: Record<string, WorldEntry> = {
  hass: {
    nodeId: "hass",
    create: async () => {
      const { HassWorld, DEFAULT_ALLOWED_DOMAINS } = await import("./hass/world.ts");
      const allowed = (process.env.HASS_ALLOWED_DOMAINS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return new HassWorld({
        config: {
          baseUrl: process.env.HASS_URL || "http://homeassistant.local:8123",
          token: process.env.HASS_TOKEN || "",
          allowedDomains: allowed.length > 0 ? allowed : DEFAULT_ALLOWED_DOMAINS,
          watchEntities: (process.env.HASS_WATCH_ENTITIES ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          eventCooldownSeconds: process.env.HASS_COOLDOWN_SEC ? Number(process.env.HASS_COOLDOWN_SEC) : 30,
        },
      });
    },
  },
  weather: {
    nodeId: "weather",
    create: async () => {
      const { WeatherWorld } = await import("./weather/world.ts");
      const rawProvider = process.env.WEATHER_PROVIDER;
      const provider =
        rawProvider === "nmc" ? "nmc" : rawProvider === "qweather" ? "qweather" : "openmeteo";
      return new WeatherWorld({
        config: {
          provider,
          province: process.env.WEATHER_PROVINCE || "北京市",
          city: process.env.WEATHER_CITY || "北京",
          nmcStationId: process.env.WEATHER_STATION_ID || "",
          qweatherKey: process.env.QWEATHER_KEY || "",
          qweatherHost: process.env.QWEATHER_HOST || undefined,
          latitude: process.env.WEATHER_LAT ? Number(process.env.WEATHER_LAT) : 39.9042,
          longitude: process.env.WEATHER_LON ? Number(process.env.WEATHER_LON) : 116.4074,
          timezone: process.env.WEATHER_TZ || "Asia/Shanghai",
        },
      });
    },
  },
  bilibili: {
    nodeId: "bilibili",
    create: async () => {
      const { BilibiliWorld } = await import("./bilibili/world.ts");
      return new BilibiliWorld({
        config: {
          roomId: Number(process.env.BILI_ROOM_ID || 1),
          sessdata: process.env.BILI_SESSDATA || "",
          giftFlushYuan: process.env.BILI_GIFT_FLUSH ? Number(process.env.BILI_GIFT_FLUSH) : 10,
        },
      });
    },
  },
  minecraft: {
    nodeId: "minecraft",
    create: async () => {
      const { MinecraftWorld } = await import("./minecraft/world.ts");
      return new MinecraftWorld({
        host: process.env.MC_HOST || "127.0.0.1",
        port: process.env.MC_PORT ? Number(process.env.MC_PORT) : 25565,
        username: process.env.MC_USERNAME || "CortiBot",
        version: process.env.MC_VERSION || "1.20.6",
        auth: process.env.MC_AUTH === "microsoft" ? "microsoft" : "offline",
      });
    },
  },
  image: {
    nodeId: "image",
    create: async () => {
      const { ImageWorld } = await import("./image/world.ts");
      const models: ImageModelEntry[] = [];
      if (process.env.COMFYUI_URL) {
        models.push({
          name: "comfyui",
          kind: "comfyui",
          baseUrl: process.env.COMFYUI_URL,
          model: process.env.COMFYUI_CKPT || undefined,
        });
      }
      if (process.env.IMAGE_OPENAI_URL && process.env.IMAGE_OPENAI_KEY) {
        models.push({
          name: "cloud",
          kind: "openai",
          baseUrl: process.env.IMAGE_OPENAI_URL,
          apiKey: process.env.IMAGE_OPENAI_KEY,
          model: process.env.IMAGE_OPENAI_MODEL || "gpt-image-1",
        });
      }
      return new ImageWorld({
        outputDir: process.env.IMAGE_OUTPUT_DIR || path.join(os.tmpdir(), "msp-images"),
        models,
      });
    },
  },
  warthunder: {
    nodeId: "warthunder",
    create: async () => {
      const { WarThunderWorld } = await import("./warthunder/world.ts");
      return new WarThunderWorld({ baseUrl: process.env.WT_URL || "http://127.0.0.1:8111" });
    },
  },
  ets2: {
    nodeId: "ets2",
    create: async () => {
      const { Ets2World } = await import("./ets2/world.ts");
      return new Ets2World({ telemetryUrl: process.env.ETS2_TELEMETRY_URL || "http://127.0.0.1:25555/api/ets2/telemetry" });
    },
  },
  hearthstone: {
    nodeId: "hearthstone",
    create: async () => {
      const { HearthstoneWorld } = await import("./hearthstone/world.ts");
      return new HearthstoneWorld({ logPath: process.env.HS_POWER_LOG || "" });
    },
  },
  steam: {
    nodeId: "steam",
    create: async () => {
      const { SteamWorld } = await import("./steam/world.ts");
      return new SteamWorld({
        steamDir: process.env.STEAM_DIR || undefined,
        steamId: process.env.STEAM_ID || "",
        apiKey: process.env.STEAM_API_KEY || "",
      });
    },
  },
  music: {
    nodeId: "music",
    create: async () => {
      const { MusicWorld } = await import("./music/world.ts");
      return new MusicWorld();
    },
  },
  sts: {
    nodeId: "sts",
    create: async () => {
      const { StsWorld } = await import("./sts/world.ts");
      return new StsWorld({ bridgeUrl: process.env.STS_BRIDGE_URL || "http://127.0.0.1:17717" });
    },
  },
  overcooked2: {
    nodeId: "overcooked2",
    create: async () => {
      const { Overcooked2World } = await import("./overcooked2/world.ts");
      return new Overcooked2World({ bridgeUrl: process.env.OC2_BRIDGE_URL || "http://127.0.0.1:17720" });
    },
  },
  stardew: {
    nodeId: "stardew",
    create: async () => {
      const { StardewWorld } = await import("./stardew/world.ts");
      return new StardewWorld({ bridgeUrl: process.env.STARDEW_BRIDGE_URL || "http://127.0.0.1:17730" });
    },
  },
  majsoul: {
    nodeId: "majsoul",
    create: async () => {
      const { MajsoulWorld } = await import("./majsoul/world.ts");
      return new MajsoulWorld({ bridgeUrl: process.env.MAJSOUL_BRIDGE_URL || "http://127.0.0.1:17740" });
    },
  },
  pvz: {
    nodeId: "pvz",
    create: async () => {
      const { PvzWorld } = await import("./pvz/world.ts");
      return new PvzWorld({ bridgeUrl: process.env.PVZ_BRIDGE_URL || "http://127.0.0.1:17750" });
    },
  },
  buckshot: {
    nodeId: "buckshot",
    create: async () => {
      const { BuckshotWorld } = await import("./buckshot/world.ts");
      return new BuckshotWorld({ bridgeUrl: process.env.BUCKSHOT_BRIDGE_URL || "http://127.0.0.1:17755" });
    },
  },
  pz: {
    nodeId: "pz",
    create: async () => {
      const { PzWorld } = await import("./pz/world.ts");
      return new PzWorld({ stateFile: process.env.PZ_STATE_FILE || "" });
    },
  },
  titanfall2: {
    nodeId: "titanfall2",
    create: async () => {
      const { Titanfall2World } = await import("./titanfall2/world.ts");
      return new Titanfall2World({ bridgeUrl: process.env.TF2_BRIDGE_URL || "http://127.0.0.1:17760" });
    },
  },
  watch_window: {
    nodeId: "watch_window",
    create: async () => {
      const { WatchWindowWorld } = await import("./watch-window/world.ts");
      return new WatchWindowWorld({
        listWindows: async () => [],
        captureWindow: async () => {
          throw new Error("当前未配置桌面截图适配器");
        },
      });
    },
  },
  douyin_live: {
    nodeId: "douyin_live",
    create: async () => {
      const { DouyinLiveWorld } = await import("./douyin-live/world.ts");
      return new DouyinLiveWorld({
        wsUrl: process.env.DOUYIN_WS_URL || "ws://127.0.0.1:8765",
        roomId: process.env.DOUYIN_ROOM_ID || "",
      });
    },
  },
  bili_reminder: {
    nodeId: "bili_reminder",
    create: async () => {
      const { BiliLiveReminderWorld } = await import("./bili-live-reminder/world.ts");
      const uids = (process.env.BILI_FOLLOW_UIDS ?? "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
      return new BiliLiveReminderWorld({ uids });
    },
  },
  bili_watch: {
    nodeId: "bili_watch",
    create: async () => {
      const { BiliWatchWorld } = await import("./bili-watch/world.ts");
      return new BiliWatchWorld();
    },
  },
  presence: {
    nodeId: "presence",
    create: async () => {
      const { PresenceWorld } = await import("./presence/world.ts");
      return new PresenceWorld();
    },
  },
};

const arg = process.argv[2];

if (!arg || arg === "--list") {
  console.log("可用 MSP World 节点:", Object.keys(REGISTRY).join(", "));
  process.exit(0);
}

if (arg === "--lint") {
  let failures = 0;
  for (const [name, entry] of Object.entries(REGISTRY)) {
    const node = new MSPNode(entry.nodeId);
    try {
      const world = await entry.create();
      world.attach(node);
      const issues = lintManifest(node);
      if (issues.length > 0) {
        failures += 1;
        console.error(`[FAIL] ${name}: ${issues.join("; ")}`);
      } else {
        const m = node.manifest;
        console.log(
          `[OK] ${name.padEnd(14)} tools=${String(m.tools.length).padStart(2)} signals=${String(m.signals.length).padStart(2)} skills=${m.skills.length}`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (name === "minecraft" && msg.includes("mineflayer")) {
        console.log(`[SKIP] ${name.padEnd(14)} (需先 npm install 安装 mineflayer)`);
      } else {
        failures += 1;
        console.error(`[FAIL] ${name}: ${msg}`);
      }
    }
  }
  process.exit(failures > 0 ? 1 : 0);
}

const entry = REGISTRY[arg];
if (!entry) {
  console.error(`未知 World: ${arg}。运行 --list 查看可用节点。`);
  process.exit(1);
}

const node = new MSPNode(process.env.MSP_NODE_ID || entry.nodeId, mspOptionsFromEnv());
const world = await entry.create();
world.attach(node);
const issues = lintManifest(node);
if (issues.length > 0) {
  console.error("Manifest 校验失败:", issues);
  process.exit(1);
}
const ep = await node.start();
await world.start?.();
console.log(`[${entry.nodeId}] MSP node listening on ${ep.host}:${ep.port}`);
installShutdownHooks(() => {
  world.stop?.();
  node.stop();
});
