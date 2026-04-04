import fs from "node:fs";
import path from "node:path";

/** 监听选项 */
export interface WatchOptions {
  /** 监听的根目录 */
  dir: string;
  /** 匹配的文件后缀列表，空数组表示匹配全部 */
  suffix?: string[];
  /** 防抖延迟（ms），默认 300 */
  debounce?: number;
  /** 文件变更时的回调，入参为变更文件的完整路径 */
  onChange: (changedFile: string) => void;
}

/** 判断是否匹配后缀列表 */
function matchSuffix(normalized: string, suffix: string[]): boolean {
  if (!suffix.length) return true;
  return suffix.some((s) => normalized.endsWith(s));
}

/**
 * 启动目录监听，文件新增 / 删除时调用 `onChange`
 * @param   options 监听选项 {@link WatchOptions}
 * @returns 停止监听的函数
 * @throws  目录不存在时抛出 Error
 */
export function watchDir(options: WatchOptions): () => void {
  const { dir, suffix = [], debounce = 300, onChange } = options;
  if (!fs.existsSync(dir))
    throw new Error(`[watchDir] directory not found: ${dir}`);
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * fs.watch 原始事件处理
   * @param event    事件类型（rename | change）
   * @param filename 变更的文件名，系统无法识别时为 null
   */
  function onFsEvent(event: string, filename: string | null) {
    if (!filename) return;
    if (event !== "rename" && event !== "change") return;
    const normalized = filename.replaceAll("\\", "/");
    if (!matchSuffix(normalized, suffix)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(event,filename);
      onChange(path.join(dir, normalized));
    }, debounce);
  }
  const watcher = fs.watch(dir, { recursive: true }, onFsEvent);
  return () => watcher.close();
}
