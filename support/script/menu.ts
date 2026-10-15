/**
 * 项目命令菜单
 *
 * 用法：
 *   bun menu.ts                  交互式菜单
 *   bun menu.ts <名称>           直接执行或进入匹配项（模糊匹配，忽略大小写）
 *   bun menu.ts <父级> <子项> <...>    按路径逐级定位
 *   bun menu.ts --list           列出所有可执行项
 */

import { entry, execCmd, type MenuItem } from "@/app/utils/menu-ui.ts";

// ── 构建配置 ─────────────────────────────────────────────────

const main = "./app/cluster.ts";
const outdir = "./";

/**
 * Bun 跨平台单文件可执行文件构建函数
 * 将 TypeScript/JavaScript 项目编译为独立的二进制可执行文件，支持多目标平台
 *
 * @param target - 编译目标平台，格式为 bun-{os}-{arch}，如 "bun-linux-x64"
 * @param fileName - 可选自定义输出文件名，不提供则使用 target 名称
 * @returns Bun 构建结果 Promise
 */
async function build(target: Bun.Build.CompileTarget, fileName?: string) {
  console.log("\n\x1b[33m🔄 构建中...\x1b[0m\n");
  // 判断是否为 Windows 平台，用于条件应用 Windows 专属配置
  // const isWindows = target.includes("windows");
  const result = await Bun.build({
    // 入口文件路径：指定应用的启动文件
    entrypoints: [main],
    // 输出模块格式：使用 ES Module 格式
    format: "esm",
    // Source Map 配置：生成链接式源码映射，便于生产环境调试
    sourcemap: "linked",
    // 字节码缓存：启用构建时预编译，可提升 2-4 倍启动速度
    bytecode: true,
    // 开启树摇优化，移除未使用的代码
    treeShaking: true,
    optimize: {
        // 预编译 JS/TS 到字节码
        bytecode: true
    },
    // 单文件编译核心配置
    compile: {
      // 目标平台：指定跨编译的目标操作系统和架构
      target,
      // 输出文件路径：自定义文件名或使用目标平台名称，Windows 自动添加 .exe
      outfile: `${outdir}/${fileName || target}`,
      // 运行时自动加载 tsconfig.json（默认关闭，显式开启）
      autoloadTsconfig: true,
      // 运行时自动加载 package.json（默认关闭，显式开启）
      autoloadPackageJson: true,
      // 运行时自动加载 .env 环境变量文件（默认开启）
      autoloadDotenv: true,
      // 运行时自动加载 bunfig.toml 配置文件（默认开启）
      autoloadBunfig: true,
      // Windows 平台专属配置（条件展开）
      // ...(isWindows && {
      //   windows: {
      //     // 应用图标路径：.ico 格式图标文件
      //     icon: "public/icon.ico",
      //     // 隐藏控制台窗口：GUI 应用设为 true，CLI 应用设为 false
      //     hideConsole: false,
      //     // 文件属性中的程序标题
      //     title: "",
      //     // 文件属性中的发布者名称
      //     publisher: "",
      //     // 文件属性中的版本号
      //     version: "1.0.0",
      //     // 文件属性中的应用描述
      //     description: "",
      //     // 文件属性中的版权声明
      //     copyright: "",
      //   }
      // })
    },

    // 代码压缩配置
    minify: {
      // 空白符压缩：移除多余空格、换行、缩进
      whitespace: true,
      // 语法优化：常量折叠、死代码消除、语法等价改写
      syntax: true,
      // 标识符压缩：基于使用频率重命名局部变量为短名称
      identifiers: true,
      // 保留名称：压缩标识符的同时保留函数/类的 .name 属性，便于调试
      keepNames: true,
    },

    // 资源命名规则配置
    naming: {
      // 嵌入资源命名模板：禁用内容哈希，保留原始文件名 [name].[ext]
      asset: "[name].[ext]",
    },

    // 构建时常量注入
    define: {
      // 注入生产环境标识：代码中 process.env.NODE_ENV 会被直接替换为 "production"
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });
  console.log("\n\x1b[32m✅ 构建完成\x1b[0m\n");
  return result;
}

// ── 菜单数据 ─────────────────────────────────────────────────

/** 根菜单项列表 */
const menuItems: MenuItem[] = [
  {
    name: "dev",
    remark: "开发模式",
    fun: () => execCmd("bun run dev"),
  },
  {
    name: "start",
    remark: "生产模式",
    children: [
      {
        name: "hot",
        remark: "热更新",
        fun: () => execCmd(`NODE_ENV=production bun --hot ${main}`),
      },
      {
        name: "hot-bg",
        remark: "热更新·后台运行",
        fun: () =>
          execCmd(`NODE_ENV=production bun --hot --background ${main}`),
      },
    ],
  },
  {
    name: "build",
    remark: "编译构建",
    children: [
      {
        name: "linux",
        remark: "🐧 Linux (服务器/嵌入式操作系统)",
        children: [
          {
            name: "x64",
            remark:
              "x86_64 - 适用于绝大多数主流 Linux 服务器（Ubuntu、CentOS、Debian 等），使用 glibc",
            fun: () => build("bun-linux-x64"),
          },
          {
            name: "arm64",
            remark:
              "ARM 64-bit - 适用于 ARM64 架构服务器（如 AWS Graviton、树莓派 4/5、Oracle Cloud ARM 实例）",
            fun: () => build("bun-linux-arm64"),
          },
          {
            name: "aarch64",
            remark:
              "ARM 64-bit (别名) - 与 arm64 相同，aarch64 是 ARM64 架构的另一种命名方式",
            fun: () => build("bun-linux-aarch64"),
          },
          {
            name: "x64-glibc",
            remark:
              "x86_64 + glibc - 标准 Linux x64 版本，使用 GNU C 库，适用于大多数发行版",
            children: [
              {
                name: "baseline",
                remark:
                  "基础 SIMD - 兼容 2013 年以前的旧 CPU，不依赖 AVX2 指令集，解决 Illegal instruction 报错",
                fun: () => build("bun-linux-x64-baseline-glibc"),
              },
              {
                name: "modern",
                remark:
                  "现代 SIMD - 针对 2013 年及以后 CPU 优化，支持 AVX2 指令集，性能提升约 10-20%",
                fun: () => build("bun-linux-x64-modern-glibc"),
              },
            ],
          },
          {
            name: "x64-musl",
            remark:
              "x86_64 + musl - 轻量级 Linux x64 版本，使用 musl libc，专为 Alpine Linux 等轻量级发行版设计",
            children: [
              {
                name: "baseline",
                remark:
                  "基础 SIMD - Alpine Linux 旧 CPU 兼容版本，适用于资源受限的容器环境",
                fun: () => build("bun-linux-x64-baseline-musl"),
              },
              {
                name: "modern",
                remark:
                  "现代 SIMD - Alpine Linux 现代 CPU 优化版本，在轻量级环境中提供最佳性能",
                fun: () => build("bun-linux-x64-modern-musl"),
              },
            ],
          },
          {
            name: "arm64-glibc",
            remark:
              "ARM64 + glibc - 标准 Linux ARM64 版本，使用 GNU C 库，适用于 AWS Graviton、树莓派等设备",
            children: [
              {
                name: "baseline",
                remark:
                  "基础 SIMD - ARM64 架构基础兼容版本，确保在各类 ARM 设备上稳定运行",
                fun: () => build("bun-linux-arm64-baseline-glibc"),
              },
              {
                name: "modern",
                remark:
                  "现代 SIMD - ARM64 架构优化版本，充分利用 NEON 指令集加速计算",
                fun: () => build("bun-linux-arm64-modern-glibc"),
              },
            ],
          },
          {
            name: "arm64-musl",
            remark:
              "ARM64 + musl - 轻量级 Linux ARM64 版本，使用 musl libc，适用于 Alpine Linux ARM 容器",
            children: [
              {
                name: "baseline",
                remark:
                  "基础 SIMD - Alpine Linux ARM64 基础版本，兼容各类 ARM 嵌入式设备",
                fun: () => build("bun-linux-arm64-baseline-musl"),
              },
              {
                name: "modern",
                remark:
                  "现代 SIMD - Alpine Linux ARM64 优化版本，在资源受限环境中提供最佳性能",
                fun: () => build("bun-linux-arm64-modern-musl"),
              },
            ],
          },
          {
            name: "aarch64-glibc",
            remark:
              "aarch64 + glibc - ARM64 架构的别名版本，功能与 arm64-glibc 完全相同",
            children: [
              {
                name: "baseline",
                remark:
                  "基础 SIMD - aarch64 命名的基础兼容版本，与 arm64-baseline-glibc 等价",
                fun: () => build("bun-linux-aarch64-baseline-glibc"),
              },
              {
                name: "modern",
                remark:
                  "现代 SIMD - aarch64 命名的优化版本，与 arm64-modern-glibc 等价",
                fun: () => build("bun-linux-aarch64-modern-glibc"),
              },
            ],
          },
          {
            name: "aarch64-musl",
            remark:
              "aarch64 + musl - ARM64 架构 musl libc 的别名版本，功能与 arm64-musl 完全相同",
            children: [
              {
                name: "baseline",
                remark:
                  "基础 SIMD - aarch64 命名的 musl 基础版本，与 arm64-baseline-musl 等价",
                fun: () => build("bun-linux-aarch64-baseline-musl"),
              },
              {
                name: "modern",
                remark:
                  "现代 SIMD - aarch64 命名的 musl 优化版本，与 arm64-modern-musl 等价",
                fun: () => build("bun-linux-aarch64-modern-musl"),
              },
            ],
          },
        ],
      },
      {
        name: "macOS",
        remark: "🍎 macOS (Apple 桌面操作系统)",
        children: [
          {
            name: "x64",
            remark:
              "Intel 芯片 Mac - 适用于 2013-2020 年的 Intel 处理器 Mac 设备，兼容性最佳",
            fun: () => build("bun-darwin-x64"),
          },
          {
            name: "arm64",
            remark:
              "Apple Silicon - 适用于 M1/M2/M3 系列芯片的 Mac 设备，性能最优",
            fun: () => build("bun-darwin-arm64"),
          },
          {
            name: "x64-modern",
            remark:
              "Intel + SIMD 优化 - 适用于 2013 年及以后的 Intel Mac，支持 AVX2 指令集，性能更强",
            fun: () => build("bun-darwin-x64-modern"),
          },
          {
            name: "arm64-modern",
            remark:
              "Apple Silicon + SIMD 优化 - 适用于 Apple Silicon 芯片的现代优化版本，充分利用 NEON 指令集",
            fun: () => build("bun-darwin-arm64-modern"),
          },
        ],
      },
      {
        name: "windows",
        remark: "🖥️  Windows (微软桌面/服务器操作系统)",
        children: [
          {
            name: "x64",
            remark:
              "64-bit Windows - 适用于绝大多数 64 位 Windows 系统（Windows 10/11、Windows Server 2016+）",
            fun: () => build("bun-windows-x64"),
          },
          {
            name: "x64-baseline",
            remark:
              "64-bit + 基础 SIMD - 兼容 2013 年以前 CPU 的 Windows 版本，解决 Illegal instruction 错误",
            fun: () => build("bun-windows-x64-baseline"),
          },
          {
            name: "x64-modern",
            remark:
              "64-bit + 现代 SIMD - 针对 2013 年及以后 CPU 优化的 Windows 版本，支持 AVX2 指令集，性能更强",
            fun: () => build("bun-windows-x64-modern"),
          },
          {
            name: "arm64",
            remark:
              "ARM 64-bit Windows - 适用于 ARM64 架构的 Windows 设备（如 Surface Pro X、Windows Dev Kit 2023）",
            fun: () => build("bun-windows-arm64"),
          },
        ],
      },
    ],
  },
  {
    name: "biome-fix",
    remark: "Biome 修复代码",
    fun: () => execCmd("bunx --bun @biomejs/biome check --write ."),
  },
  {
    name: "generate",
    remark: "生成代码",
    children: [
      {
        name: "all",
        remark: "路由 + Drizzle 迁移",
        fun: () => execCmd("bun --parallel 'generate_*'"),
      },
      {
        name: "script",
        remark: "生成路由",
        fun: () => execCmd("bun ./support/script/index.ts"),
      },
    ],
  },
  {
    name: "drizzle",
    remark: "Drizzle 相关",
    children: [
      {
        name: "studio",
        remark: "✅ 数据库可视化管理",
        fun: () => execCmd("bun --bun run drizzle-kit studio"),
      },
      {
        name: "generate",
        remark: "✅ 仅生成迁移文件（不执行）",
        fun: () => execCmd("bun --bun run drizzle-kit generate"),
      },
      {
        name: "migrate",
        remark: "✅ 执行已生成的迁移（生产用）",
        fun: () => execCmd("bun --bun run drizzle-kit migrate"),
      },
      {
        name: "generate+migrate",
        remark: "✅ 生成 + 执行迁移",
        fun: () =>
          execCmd(
            "bun --bun run drizzle-kit generate && bun --bun run drizzle-kit migrate",
          ),
      },
      {
        name: "push",
        remark: "⚠️ 直接同步结构，不生成迁移",
        fun: () => execCmd("bun --bun run drizzle-kit push"),
      },
      {
        name: "drop",
        remark: "⚠️ 删除无效/旧迁移文件",
        fun: () => execCmd("bun --bun run drizzle-kit drop"),
      },
      {
        name: "check",
        remark: "✅ 检查迁移是否合法",
        fun: () => execCmd("bun --bun run drizzle-kit check"),
      },
      {
        name: "up",
        remark: "✅ 应用最新迁移（等价 migrate）",
        fun: () => execCmd("bun --bun run drizzle-kit up"),
      },
    ],
  }
];

// ── 入口 ─────────────────────────────────────────────────────

await entry(menuItems);
