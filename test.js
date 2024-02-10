import { getMultilineInput } from '@actions/core';

const tests = [[
], [
    'echo foo',
], [
    'echo foo',
    'echo bar',
], [
    'echo foo && \\',
    'echo bar',
], [
    '
]]

function getShellCommands(name) {
    const lines = [];
    let current = '';

    for (const line of getMultilineInput(name)) {
        current += line;

        if (line.endsWith("\\")) {
            current = current.slice(0, -1);
        }
        else {
            lines.push(current);
            current = '';
        }
    }

    return lines;
}

for (const test of tests) {
    process.env.INPUT_TEST = test.join('\n');
    //console.log(getMultilineInput('test'));
    console.log(getShellCommands('test'));
}
