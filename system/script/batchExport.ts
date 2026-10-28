import { filePathTree, writeIfChanged } from "@/app/utils/file";

const confing = {
  /** 根目录 */
  root: "",
  /** 文件后缀 */
  suffix: [] as string[],
  /** 输出文件 */
  out: "",
  /** 模板字符串,支持 name,path 占位符, 示例 `export * from "{{path}}";` */
  template: ``,
};

/** 批量导出文件 生成器 */
export default function generate(conf: Partial<typeof confing>) {
  const op = { ...confing, ...conf } as typeof confing;

  const filePaths = filePathTree(
    op.suffix,
    op.suffix.map((k) => `${op.root}/**/*${k}`),
  );

  // 构建正则：匹配结尾是数组中任意一项
  const suffix_reg = new RegExp(`(${op.suffix.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`);

  const content = filePaths.list
    .map((path) => {
      const name = path.split("/").at(-1)!
        .replace(suffix_reg, "");

      return op.template
        .replace(/{{path}}/g, path)
        .replace(/{{name}}/g, name)
    })
    .join("\n");

  writeIfChanged(op.out, `// auto generated\n${content}`);
}
