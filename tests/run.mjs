import { readFile } from 'node:fs/promises';
import { runChecks } from './logic.js';
const data = Object.fromEntries(await Promise.all(['alphabet', 'vocabulary', 'sentences', 'grammar', 'quizzes'].map(async name => [name, JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'))])));
const results = runChecks(data);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.message ? ': ' + result.message : ''}`);
console.log(`${results.filter(r => r.passed).length}/${results.length} passed`);
if (results.some(r => !r.passed)) process.exitCode = 1;
