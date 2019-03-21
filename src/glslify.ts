import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as p from 'pify';

const newlineRE = /\r\n|\r|\n/;
const includeRE = /#include "(.*)"/;

export default async function glslify(
    shader: string,
    basedir: string,
): Promise<[string, number]> {
    const lines = shader.split(newlineRE);
    const newLines: string[] = [];
    let offset = 0;

    await Promise.all(
        lines.map(async (line: string, i: number) => {
            const m = line.match(includeRE);
            if (m) {
                const filepath = path.resolve(basedir, m[1]);
                const mod = await p(fs.readFile)(filepath, 'utf8');
                offset += mod.split(newlineRE).length - 1;
                newLines[i] = mod;
            } else {
                newLines[i] = line;
            }
        }),
    );

    const newShader = newLines.join(os.EOL);
    return [newShader, offset];
}
