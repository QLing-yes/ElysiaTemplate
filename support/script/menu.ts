/**
 * 交互式命令选择器
 * 方向键 ↑↓ 选择，回车执行，Ctrl+C 退出
 */

const main = "./app/cluster.ts";
const outDir = "./dist";

/** 构建模式配置 */
type BuildMode = "release" | "debug" | "minimal";
/** @param target 目标平台 @param mode 构建模式 */
const build = (target: string, mode: BuildMode = "release") => {
  const base = `bun build --compile --target ${target} --outfile ${outDir}/${target}-server ${main}`;
  const opts: Record<BuildMode, string> = {
    release: "--minify-whitespace --minify-syntax --sourcemap --bytecode",
    debug: "--sourcemap",
    minimal: "",
  };
  return `${base} ${opts[mode]}`;
};

/** 命令项结构 */
type Cmd = { label: string; cmd: string; desc: string; group?: string };
/** @type 命令列表 */
const list: Cmd[] = [
  {
    group: "开发",
    label: "dev",
    cmd: `bun run generate && bun run --watch ${main}`,
    desc: "开发模式启动",
  },
  {
    group: "开发",
    label: "fix",
    cmd: "bunx --bun @biomejs/biome check --write .",
    desc: "自动修复代码",
  },
  {
    group: "开发",
    label: "generate",
    cmd: "bun ./support/script/index.ts && bun --bun run prisma generate",
    desc: "生成 路由和Prisma",
  },
  {
    group: "开发",
    label: "prisma-studio",
    cmd: "bun --bun run prisma studio",
    desc: "Prisma 管理",
  },

  {
    group: "生产",
    label: "start",
    cmd: `NODE_ENV=production bun ${main}`,
    desc: "生产启动",
  },
  {
    group: "生产",
    label: "start-hot",
    cmd: `bun run generate && NODE_ENV=production bun --hot ${main}`,
    desc: "热更新启动",
  },

  { group: "构建 - Bun", label: "bun", cmd: build("bun"), desc: "Bun 原生" },

  {
    group: "构建 - Linux",
    label: "linux-x64",
    cmd: build("bun-linux-x64"),
    desc: "Linux x64",
  },
  {
    group: "构建 - Linux",
    label: "linux-x64-baseline",
    cmd: build("bun-linux-x64-baseline"),
    desc: "Linux x64 (2013前 CPU)",
  },
  {
    group: "构建 - Linux",
    label: "linux-x64-modern",
    cmd: build("bun-linux-x64-modern"),
    desc: "Linux x64 (2013后 CPU,更快)",
  },
  {
    group: "构建 - Linux",
    label: "linux-arm64",
    cmd: build("bun-linux-arm64"),
    desc: "Linux ARM64 (Graviton/RPi)",
  },

  {
    group: "构建 - Windows",
    label: "win-x64",
    cmd: build("bun-windows-x64"),
    desc: "Windows x64",
  },
  {
    group: "构建 - Windows",
    label: "win-x64-baseline",
    cmd: build("bun-windows-x64-baseline"),
    desc: "Windows x64 baseline",
  },
  {
    group: "构建 - Windows",
    label: "win-x64-modern",
    cmd: build("bun-windows-x64-modern"),
    desc: "Windows x64 modern",
  },

  {
    group: "构建 - macOS",
    label: "darwin-x64",
    cmd: build("bun-darwin-x64"),
    desc: "macOS x64",
  },
  {
    group: "构建 - macOS",
    label: "darwin-x64-baseline",
    cmd: build("bun-darwin-x64-baseline"),
    desc: "macOS x64 baseline",
  },
  {
    group: "构建 - macOS",
    label: "darwin-x64-modern",
    cmd: build("bun-darwin-x64-modern"),
    desc: "macOS x64 modern",
  },
  {
    group: "构建 - macOS",
    label: "darwin-arm64",
    cmd: build("bun-darwin-arm64"),
    desc: "macOS ARM64 (Apple Silicon)",
  },
  {
    group: "构建 - macOS",
    label: "darwin-arm64-baseline",
    cmd: build("bun-darwin-arm64-baseline"),
    desc: "macOS ARM64 baseline",
  },
  {
    group: "构建 - macOS",
    label: "darwin-arm64-modern",
    cmd: build("bun-darwin-arm64-modern"),
    desc: "macOS ARM64 modern",
  },

  {
    group: "构建 - 模式",
    label: "linux-debug",
    cmd: build("bun-linux-x64", "debug"),
    desc: "Linux x64 (调试)",
  },
  {
    group: "构建 - 模式",
    label: "linux-minimal",
    cmd: build("bun-linux-x64", "minimal"),
    desc: "Linux x64 (最小化)",
  },
];

const C = "\x1b[?25l",
  R = "\x1b[?25h",
  SEP = "─".repeat(40),
  WIN = process.platform === "win32";

/** 渲染菜单 @param sel 选中索引 @returns 渲染后的字符串 */
function render(sel: number) {
  const g = (s: string) => `\x1b[38;5;208m${s}\x1b[0m`;
  const cur = list[sel],
    cls = "\x1b[2J\x1b[H";
  let s = `${cls}\x1b[38;5;45m╭──────────────────────────────────────────────────╮\x1b[0m\n`;
  s +=
    "\x1b[38;5;45m│\x1b[0m        \x1b[1;36m🚀 Bun 命令菜单    \x1b[0m                       \x1b[38;5;45m│\x1b[0m\n";
  s +=
    "\x1b[38;5;45m╰──────────────────────────────────────────────────╯\x1b[0m\n";
  s += "\x1b[2m  ↑↓ 选择  Enter 执行  Ctrl+C 退出\x1b[0m\n";
  let grp = "";
  for (const it of list) {
    if (it.group && it.group !== grp) {
      grp = it.group;
      s += (grp ? "\n" : "") + g(`  ╭─ ${grp}\n`);
    }
    const on = it === cur,
      pre = on ? "▶" : " ",
      col = on ? "\x1b[1;32m" : "\x1b[2m";
    s += `${g(`  │`)} ${col}${pre} ${it.label}\x1b[0m  \x1b[90m${it.desc}\x1b[0m\n`;
  }
  s +=
    g("  ╰\n\n") +
    (cur ? `\x1b[38;5;45m─\x1b[0m \x1b[1m当前命令:\x1b[0m ${cur.cmd}` : "");
  return s;
}

async function run() {
  let idx = 0;
  process.stdout.write(C + render(idx));
  process.stdin.setRawMode(true).resume().setEncoding("utf8");

  const fin = () => {
    process.stdout.write(R);
    process.stdin.setRawMode(false).pause();
  };
  process.on("SIGINT", () => {
    fin();
    console.log("\n\n\x1b[33m已退出\x1b[0m");
    process.exit(0);
  });

  const rd = () => process.stdout.write(render(idx));

  await new Promise<void>((r) => {
    process.stdin.on("data", async (k: unknown) => {
      const key = String(k);
      if (key === "\x1b[A") {
        idx = (idx - 1 + list.length) % list.length;
        rd();
      } else if (key === "\x1b[B") {
        idx = (idx + 1) % list.length;
        rd();
      } else if (key === "\r" || key === "\n") {
        const it = list[idx];
        if (!it) return fin();
        fin();
        console.log(`\n\x1b[1;35m执行:\x1b[0m ${it.cmd}\n\x1b[2m${SEP}\x1b[0m`);
        const p = Bun.spawn(
          WIN ? ["cmd", "/c", it.cmd] : ["sh", "-c", it.cmd],
          { stdout: "inherit", stderr: "inherit" },
        );
        await p.exited;
        console.log(`\x1b[2m${SEP}\x1b[0m\n\x1b[2m按任意键返回...\x1b[0m`);
        process.stdin
          .setRawMode(true)
          .resume()
          .once("data", () => {
            process.stdin.setRawMode(false);
            r();
          });
      } else if (key === "\x03") {
        fin();
        console.log("\n\x1b[33m已退出\x1b[0m\n");
        process.exit(0);
      }
    });
  });
  process.stdin.removeAllListeners("data");
  await run();
}

run();
