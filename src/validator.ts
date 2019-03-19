import { readFile, writeFile } from 'fs';
import * as execa from 'execa';
import * as tmp from 'tmp';
import * as p from 'pify';

export async function validator(
    glslangValidatorPath: string,
    shader: string,
    postfix: string,
): Promise<void> {
    const tmpfile = await p(tmp.file)({
        keep: true,
        postfix,
        discardDescriptor: true,
    });

    await p(writeFile)(tmpfile, shader, 'utf8');

    const result = await execa(glslangValidatorPath, [tmpfile]);
    if (result.stdout.match(/ERROR/)) {
        throw new Error(result.stdout);
    }
}

const VALID_SEVERITY = new Set(['error', 'warning', 'info']);

const getSeverity = (givenSeverity: string): string => {
    const severity = givenSeverity.toLowerCase();
    return VALID_SEVERITY.has(severity) ? severity : 'warning';
};

interface ILintError {
    severity: string;
    excerpt: string;
    location: {
        file: string;
        position: [[number, number], [number, number]];
    };
}

export async function getGlslErrors(
    glslangValidatorPath: string,
    filepath: string,
    shader: string,
    postfix: string,
    glslifyOffset: number,
): Promise<ILintError[]> {
    const compileRegex = '^([\\w \\-]+): (\\d+):(\\d+): (.*)$';
    console.log('getGlslErrors');
    try {
        const tmpfile = await p(tmp.file)({
            keep: true,
            postfix,
            discardDescriptor: true,
        });
        await p(writeFile)(tmpfile, shader, 'utf8');

        const result = await execa(glslangValidatorPath, [tmpfile])
            .then(x => x.stdout)
            .catch(e => e.stdout);

        const errors: ILintError[] = [];
        result.split(/[\n\r]/).forEach((line: string) => {
            const match = new RegExp(compileRegex).exec(line);
            if (match) {
                const lineStart = parseInt(match[3], 10);
                const colStart = parseInt(match[2], 10);
                const lineEnd = lineStart;
                const colEnd = colStart;

                errors.push({
                    severity: getSeverity(match[1]),
                    excerpt: match[4].trim(),
                    location: {
                        file: filepath,
                        position: [
                            [
                                (lineStart > 0 ? lineStart - 1 : 0) -
                                    glslifyOffset,
                                colStart > 0 ? colStart - 1 : 0,
                            ],
                            [
                                (lineEnd > 0 ? lineEnd - 1 : 0) - glslifyOffset,
                                colEnd > 0 ? colEnd - 1 : 0,
                            ],
                        ],
                    },
                });
            }
        });
        return errors;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function loadFile(
    glslangValidatorPath: string,
    filePath: string,
): Promise<string> {
    const result = await execa(glslangValidatorPath, [filePath]);
    if (result.stdout.match(/ERROR/)) {
        throw new Error(result.stdout);
    }

    return await p(readFile)(filePath, 'utf8');
}
