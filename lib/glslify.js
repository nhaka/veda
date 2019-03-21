"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const p = require("pify");
const newlineRE = /\r\n|\r|\n/;
const includeRE = /#include "(.*)"/;
function glslify(shader, basedir) {
    return __awaiter(this, void 0, void 0, function* () {
        const lines = shader.split(newlineRE);
        const newLines = [];
        let offset = 0;
        yield Promise.all(lines.map((line, i) => __awaiter(this, void 0, void 0, function* () {
            const m = line.match(includeRE);
            if (m) {
                const filepath = path.resolve(basedir, m[1]);
                const mod = yield p(fs.readFile)(filepath, 'utf8');
                offset += mod.split(newlineRE).length - 1;
                newLines[i] = mod;
            }
            else {
                newLines[i] = line;
            }
        })));
        const newShader = newLines.join(os.EOL);
        return [newShader, offset];
    });
}
exports.default = glslify;
//# sourceMappingURL=glslify.js.map