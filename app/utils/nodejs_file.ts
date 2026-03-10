import fs from "node:fs";
import path from "node:path";

/** 获取目录下所有文件路径
 * @param rootDir 指定目录路径
 * @param reg 正则过滤
 */
export function filterFile(rootDir: string, reg?: RegExp) {
	let files: string[] = [];
	fs.readdirSync(rootDir).forEach((str) => {
		const dir = path.join(rootDir, str);
		if (fs.statSync(dir).isDirectory())
			files = files.concat(filterFile(dir, reg));
		else if (!reg) files.push(dir);
		else if (reg?.test(dir)) files.push(dir);
	});
	return files;
}
/** 流式写入
 *  @param filePath 路径
 *  @param flags https://nodejs.cn/api/fs/file_system_flags.html
 */
export function write(filePath: string, flags = "w") {
	// 确保目录存在
	const dirPath = path.dirname(filePath);
	if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
	// 创建写入流
	return fs.createWriteStream(filePath, {
		flags,
		mode: 0o200,
		encoding: "utf8",
	});
}
/** 创建符号链接
 * @param sourceDir 源文件夹路径
 * @param symlinkDir 符号链接的路径
 */
export async function mklink_junction(sourceDir: string, symlinkDir: string) {
	return new Promise<boolean>((resolve, reject) => {
		const sourceFolder = createDir(path.join(__dirname, sourceDir));
		const symlinkPath = createDir(path.join(__dirname, symlinkDir), true);

		fs.access(symlinkPath, fs.constants.F_OK, (err) => {
			if (!err) return resolve(true);
			fs.symlink(sourceFolder, symlinkPath, "junction", (err) => {
				if (err) reject(err);
				else resolve(true);
			});
		});
	});
}

/** 不存在则创建目录
 * @param pathStr 目录路径
 * @param dirOnly 仅目录
 */
export function createDir(pathStr: string, dirOnly?: boolean) {
	const str = dirOnly ? path.dirname(pathStr) : pathStr;
	if (!fs.existsSync(str)) fs.mkdirSync(str, { recursive: true });
	return pathStr;
}
/**
 * 按完整路径分组
 * @param paths 待分组的路径数组
 * @returns 分组结果：{ 目录路径: 该目录下的有效文件名数组 }
 */
export function groupPathsByDirectory(
	paths: string[],
): Record<string, string[]> {
	// 无原型链对象，属性访问比普通对象快 15%+
	const groups: Record<string, string[]> = Object.create(null);
	// 单次遍历，O(n) 时间复杂度，内联所有逻辑避免函数调用开销
	for (let i = 0, len = paths.length; i < len; i++) {
		const path = paths[i];
		// 1. 快速跳过空路径（最优先判断，避免后续无效计算）
		if (!path) continue;
		// 2. 统一分隔符（仅在有 \ 时才替换，避免不必要的正则遍历）
		let normalized = path;
		if (normalized.indexOf("\\") !== -1) {
			normalized = normalized.replace(/\\/g, "/");
		}
		// 3. 快速跳过纯目录（用 charCodeAt 比 endsWith 快 3 倍+）
		const pathLen = normalized.length;
		if (normalized.charCodeAt(pathLen - 1) === 47) continue; // 47 是 '/' 的 ASCII 码
		// 4. 单次 lastIndexOf 同时获取目录和文件名（核心：避免重复查找）
		const lastSepIndex = normalized.lastIndexOf("/");
		let dir: string;
		let fileName: string;
		if (lastSepIndex === -1) {
			// 纯文件名场景
			dir = "";
			fileName = normalized;
		} else {
			// 正常路径场景：V8 对 slice 有特殊优化，单次提取目录和文件名
			dir = normalized.slice(0, lastSepIndex);
			fileName = normalized.slice(lastSepIndex + 1);
		}
		// 5. 分组操作：减少一次数组初始化判断
		const targetGroup = groups[dir];
		if (targetGroup) targetGroup.push(fileName);
		else groups[dir] = [fileName];
	}
	return groups;
}
