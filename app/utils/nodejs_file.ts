import fs from "node:fs";
import path from "node:path";

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/** 流式写入
 * @param filePath 路径
 * @param flags    https://nodejs.cn/api/fs/file_system_flags.html
 */
export function write(filePath: string, flags = "w"): fs.WriteStream {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });

	return fs.createWriteStream(filePath, {
		flags,
		mode: 0o666,
		encoding: "utf8",
	});
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
 * @param suffix 要匹配的文件名结尾
 * @param pattern  glob 模式
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
