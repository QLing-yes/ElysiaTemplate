import { filePathTree, write } from "@/app/utils/file";

interface DirInfo {
  idx: number;
  name: string;
  fullPath: string;
}

interface Config {
  /** 控制器目录 */
  fromDir: string;
  /** 生成路由文件路径 */
  target: string;
  /** 文件后缀匹配顺序 */
  suffix?: string[];
  /** 输出格式 */
  output?: {
    comment?: string;
    import?: string;
    pluginPrefix?: string;
    exportDefault?: string;
  };
}

/** 生成插件代码 */
function generatePlugin(
  idx: number,
  name: string,
  fullPath: string,
  mods: number[],
  childs: number[],
  prefix: string,
): string {
  const str_prefix = `prefix: "${name}"`;
  const str_name = `name: "${fullPath}" + __filename`;
  const str_tags = `tags:["${fullPath}"]`;
  const str_detail = `detail: { ${str_tags} }`;

  const opts = name
    ? `{ ${str_prefix}, ${str_detail}, ${str_name} }`
    : `{ ${str_name} }`;

  let code = `\nconst ${prefix}${idx} = () => new Elysia(${opts})`;
  mods.forEach((i) => (code += `\n\t.use(mod_${i})`));
  childs.forEach((id) => (code += `\n\t.use(${prefix}${id}())`));
  return code;
}

/** 获取目录相对路径 */
function toRelative(dir: string, base: string): string {
  return dir.slice(base.length + 1);
}

/** 获取目录深度 */
function getDepth(dir: string, base: string): number {
  const rel = toRelative(dir, base);
  return rel ? rel.split("/").length : 0;
}

/** 构建目录信息 */
function buildDirInfo(dirKeys: string[], base: string): Map<string, DirInfo> {
  const map = new Map<string, DirInfo>();
  dirKeys.forEach((dir, i) => {
    const rel = toRelative(dir, base);
    const parts = rel.split("/");
    map.set(dir, {
      idx: i,
      name: rel ? (parts.at(-1) ?? "") : "",
      fullPath: rel || "/",
    });
  });
  return map;
}

/** 获取模块索引 */
function getMods(
  tree: Record<string, Record<string, number[]>>,
  dir: string,
  suffix: string[],
): number[] {
  const obj = tree[dir];
  if (!obj) return [];
  const indexes: number[] = [];
  suffix.forEach((k) => indexes.push(...(obj[k] ?? [])));
  return indexes;
}

/** 构建父子关系 */
function buildChildren(
  dirKeys: string[],
  dirInfo: Map<string, DirInfo>,
  base: string,
): Map<string, number[]> {
  const childrenOf = new Map<string, number[]>();

  dirKeys.forEach((dir) => {
    const rel = toRelative(dir, base);
    if (!rel) return;

    const parent = dir.slice(0, dir.lastIndexOf("/"));
    const info = dirInfo.get(dir);
    if (!info) return;

    const children = childrenOf.get(parent) ?? [];
    children.push(info.idx);
    childrenOf.set(parent, children);
  });

  return childrenOf;
}

const DEFAULT_CONFIG = {
  suffix: ["ctrl.ts"],
  output: {
    comment: "//auto generated",
    import: 'import Elysia from "elysia";',
    pluginPrefix: "plug_",
    exportDefault: "plug_0()",
  },
};

export default function generate(op: Config) {
  const config = {
    ...DEFAULT_CONFIG,
    ...op,
    output: { ...DEFAULT_CONFIG.output, ...op.output },
  };
  const { suffix, output } = config;

  const { list: fileList, tree: fileTree } = filePathTree(
    suffix,
    suffix.map((k) => `${config.fromDir}/**/*${k}`),
  );

  const file = write(config.target);
  file.write(`${output.comment}\n${output.import}\n`);
  fileList.forEach((uri, i) => file.write(`import mod_${i} from "${uri}";\n`));

  const dirKeys = Object.keys(fileTree).sort();
  const dirInfo = buildDirInfo(dirKeys, config.fromDir);
  const childrenOf = buildChildren(dirKeys, dirInfo, config.fromDir);

  const maxDepth = Math.max(...dirKeys.map((d) => getDepth(d, config.fromDir)));

  for (let depth = maxDepth; depth >= 0; depth--) {
    dirKeys
      .filter((d) => getDepth(d, config.fromDir) === depth)
      .forEach((dir) => {
        const info = dirInfo.get(dir);
        if (!info) return;

        const mods = getMods(fileTree, dir, suffix);
        const childs = childrenOf.get(dir) ?? [];

        file.write(
          generatePlugin(
            info.idx,
            info.name,
            info.fullPath,
            mods,
            childs,
            output.pluginPrefix,
          ),
        );
        file.write("\n");
      });
  }

  file.write(`\nexport default ${output.exportDefault};\n`);
  file.end();
}
