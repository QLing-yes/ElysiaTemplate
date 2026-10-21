import { join } from "node:path";
import { aot } from "elysia/plugin/aot/bun";

/** 项目根目录（当前脚本位于 support/script，需上溯两级） */
const root = join(import.meta.dir, "../..");
/** 应用入口文件绝对路径 */
export const main = join(root, "app/cluster.ts");
/** AOT 预编译指向文件绝对路径 */
const aotEntry = join(root, "app/index.ts");
/** 构建产物输出目录（项目根目录，已由 .gitignore 忽略 bun-*.*） */
export const outdir = root;

/**
 * Bun 跨平台单文件可执行文件构建函数
 * 将 TypeScript/JavaScript 项目编译为独立的二进制可执行文件，支持多目标平台
 *
 * @param target - 编译目标平台，格式为 bun-{os}-{arch}，如 "bun-linux-x64"
 * @param outDir - 可选自定义输出目录，不提供则输出到项目根目录
 * @param fileName - 可选自定义输出文件名，不提供则使用 target 名称
 * @returns Bun 构建结果 Promise
 */
export async function build(
  target: Bun.Build.CompileTarget,
  outDir: string = outdir,
  fileName: string = target,
) {
  console.log("\n\x1b[33m🔄 构建中...\x1b[0m\n");
  // 输出关键路径，便于排查入口解析问题
  const outfile = join(outDir, fileName);
  // 判断是否为 Windows 平台，用于条件应用 Windows 专属配置
  // const isWindows = target.includes("windows");
  await Bun.build({
    // AOT 预编译：指向真实的 Elysia 实例导出文件
    plugins: [aot(aotEntry)],
    // 入口文件路径：指定应用的启动文件
    entrypoints: [main],
    // 输出模块格式：使用 ES Module 格式
    format: "esm",
    // Source Map 配置：生成链接式源码映射，便于生产环境调试
    sourcemap: "linked",
    // 开启树摇优化，移除未使用的代码
    treeShaking: true,
    // 字节码缓存：启用构建时预编译，可提升 2-4 倍启动速度
    bytecode: true,
    // 单文件编译核心配置
    compile: {
      // 目标平台：指定跨编译的目标操作系统和架构
      target,
      // 输出文件路径：自定义文件名或使用目标平台名称，Windows 自动添加 .exe
      outfile,
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
  console.log(`\x1b[32m✅ 构建完成 : ${outfile}\x1b[0m\n`);
  process.exit(0);
}
