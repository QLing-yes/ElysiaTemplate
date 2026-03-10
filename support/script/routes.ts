import path from "node:path"
import { filterFile, write } from "@/app/utils/nodejs_file"

/** 自动注册控制器 */
export default function generate(op: {
    /** 控制器目录 */
    fromDir: string,
    /** 生成路由文件路径 */
    target: string,
    /** 路由前缀 */
    prefix?: string
}) {
    const files = filterFile(op.fromDir, /\.ctrl\.tsx?$/)
    console.log(files);
    
    const ctrl = write(op.target)
    const fromDirReg = new RegExp(`^${op.fromDir}`)

    ctrl.write(`//自动生成的文件\n`)
    ctrl.write(`import Elysia from "elysia";\n`)
    let useStr = ""
    files.forEach((str, index) => {
        const info = path.parse(str);
        const imp = path.join(info.dir, info.name).replace(/\\/g, "/")

        const field = `_${index}`
        ctrl.write(`import ${field} from "${imp}";\n`)
        const route = imp
            .replace(fromDirReg, "")
            .replace(/(\/)?\.ctrl$/, "")
        useStr += `\n .group("${route}",app=>app.use(${field}))`
    })
    ctrl.write(`\nconst app = new Elysia({ name: __filename, prefix:"${op.prefix || ''}" })\n`)
    ctrl.write(`\nexport default app${useStr}`)
    ctrl.end()
}