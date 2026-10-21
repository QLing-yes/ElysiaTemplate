import fs from "node:fs";
import path from "node:path";

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/** 流式写入
 * @param filePath 路径
 * @param flags    文件系统标志，默认为 "w"（写入模式，文件不存在则创建，存在则清空）
 *                https://nodejs.cn/api/fs/file_system_flags.html
 */
export function write(filePath: string, flags = "w"): fs.WriteStream {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  return fs.createWriteStream(filePath, {
    flags,
    mode: 0o666, // 文件权限：所有者可读写，组和其他用户可读写（rw-rw-rw-）
    encoding: "utf8",
  });
}

/** 内容有变更时才写入文件
 * @description 内容一致时跳过写入，避免无意义的 mtime 变化触发 `bun --watch` 重启
 * @param filePath 目标文件路径
 * @param content  完整文件内容
 * @returns 是否实际写入
 */
export function writeIfChanged(filePath: string, content: string): boolean {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === content) {
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, { encoding: "utf8", mode: 0o666 });
  return true;
}

/** 创建符号链接（junction 类型）
 * @param sourceDir  源文件夹路径（相对于 __dirname）
 * @param symlinkDir 符号链接路径（相对于 __dirname）
 */
export async function mklink_junction(
  sourceDir: string,
  symlinkDir: string,
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const sourceFolder = createDir(path.join(__dirname, sourceDir));
    const symlinkPath = createDir(path.join(__dirname, symlinkDir), true);

    // 直接 symlink，EEXIST 视为成功（链接已存在即满足目标）。
    // 原 fs.access(F_OK) 方案有两个问题：
    //   1. TOCTOU 竞态：access 与 symlink 之间另一进程可能抢先创建链接导致崩溃
    //   2. F_OK 跟随符号链接：悬空链接（目标已删除）会误判为"链接不存在"
    fs.symlink(sourceFolder, symlinkPath, "junction", (err) => {
      if (!err || (err as NodeJS.ErrnoException).code === "EEXIST")
        resolve(true);
      else reject(err);
    });
  });
}

/** 不存在则创建目录
 * @param pathStr 目录路径
 * @param dirOnly 为 true 时只取父目录部分
 */
export function createDir(pathStr: string, dirOnly?: boolean): string {
  fs.mkdirSync(dirOnly ? path.dirname(pathStr) : pathStr, { recursive: true });
  return pathStr;
}

/** 生成文件路径树
 * @param suffix 要匹配的文件名结尾 示例: ['.ext.ts']
 * @param pattern  glob 匹配模式  示例: '*.ts'
 */
export function filePathTree(suffix: string[], pattern: string | string[]) {
  const FilePathList = fs
    .globSync(pattern)
    .map((uri) => uri.replaceAll("\\", "/"));

  type PatternMatchMap = Record<string, number[]>;
  type FileTree = Record<string, PatternMatchMap>;
  const FilePathTree: FileTree = {};

  FilePathList.forEach((uri, uriIndex) => {
    const name = path.basename(uri);
    const dir = path.dirname(uri);

    if (!FilePathTree[dir]) FilePathTree[dir] = {};
    suffix.forEach((key) => {
      if (!name.endsWith(key)) return;
      if (!FilePathTree[dir]![key]) FilePathTree[dir]![key] = [];
      FilePathTree[dir]![key].push(uriIndex);
    });
  });

  return { list: FilePathList, tree: FilePathTree };
}
