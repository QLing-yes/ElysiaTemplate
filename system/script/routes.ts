import { filePathTree, writeIfChanged } from "@/app/utils/file";

interface DirInfo {
  idx: number;
  name: string;
  relPath: string;
  fullPath: string;
}

interface Config {
  /** 控制器目录 */
  fromDir: string;
  /** 生成路由文件路径 */
  target: string;
  /** 文件后缀匹配顺序 */
  suffix?: string[];
  /** 生成文件的输出格式 */
  output?: {
    /** 顶部注释 */
    comment?: string;
    /** 顶部导入语句 */
    import?: string;
    /** 插件变量名前缀 */
    pluginPrefix?: string;
    /** 导出的默认插件 */
    exportDefault?: string;
  };
}

/** 生成插件代码 */
function generatePlugin(
  idx: number,
  route_tag: string,
  route_prefix: string,
  val_prefix: string,
  mods: number[],
  childs: number[],
): string {
  const str_prefix = `prefix: "${route_prefix}"`;
  const str_tags = `tags:["/${route_tag}"]`;
  const str_detail = `detail: { ${str_tags} }`;
  const str_name = `name: num()`;

  const opts = `{ ${str_prefix}, ${str_detail}, ${str_name} }`;

  let code = `\nconst ${val_prefix}${idx} = () => new Elysia(${opts})`;
  mods.forEach((i) => (code += `\n\t.use(mod_${i})`));
  childs.forEach((id) => (code += `\n\t.use(${val_prefix}${id}())`));
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
      relPath: rel,
      fullPath: dir,
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
    import: 'import Elysia from "elysia";\nimport * as $g from "@/app/common";',
    pluginPrefix: "plug_",
    exportDefault: "plug_0()",
  },
};

/** 文件路由 生成器 */
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

  const chunks: string[] = [`${output.comment}\n${output.import}\n`];
  fileList.forEach((uri, i) => chunks.push(`import mod_${i} from "${uri}";\n`));

  chunks.push("\nconst num = () => String($g.counter.n);\n")

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

        chunks.push(
          generatePlugin(
            info.idx,
            info.fullPath,
            info.name,
            output.pluginPrefix,
            mods,
            childs,
          ),
        );
        chunks.push("\n");
      });
  }

  chunks.push(`\nexport default ${output.exportDefault};\n`);
  writeIfChanged(config.target, chunks.join(""));
}
