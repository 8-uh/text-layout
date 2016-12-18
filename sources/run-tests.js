let ts = require(`@manaflair/term-strings`);
let fs = require(`fs`);
let glob = require(`glob`);
let vm = require(`vm`);

let bindings = require(`./entry-browser`);

class TestSuite {

    constructor() {

        this.tests = [];

    }

    register(label) {

        let test = { label, fn: () => () => {} };
        this.tests.push(test);

        return test;

    }

    run(level = 0) {

        let indent = ` `.repeat(level * 4);

        if (level > 0 && this.tests.length > 0)
            console.log(``);

        for (let test of this.tests) {

            let testsuite = new TestSuite();

            try {
                test.fn(testsuite, makeEnv());
                console.log(`${indent} ${ts.style.color.front(`green`).in}✓${ts.style.color.front.out} ${test.label}`);
            } catch (err) {
                console.log(`${indent} ${ts.style.color.front(`red`).in}✗${ts.style.color.front.out} ${test.label} (${err.message || err})`);
            }

            testsuite.run(level + 1);

        }

        if (level > 0 && this.tests.length > 0) {
            console.log(``);
        }

    }

}

function makeEnv() {

    let str = '';
    let otp = [ '' ];

    let layout = new bindings.TextLayout();

    layout.setCharacterGetter(offset => str.charCodeAt(offset));
    layout.setCharacterCountGetter(() => str.length);

    function APPLY(patch) {

        otp.splice(patch.startingRow, patch.deletedLineCount, ... patch.addedLines);

    }

    function SETUP(newStr) {

        str = newStr;
        APPLY(layout.reset());

    }

    function RESET() {

        APPLY(layout.reset());

    }

    function SPLICE(start, length, replacement) {

        str = str.substr(0, start) + replacement + str.substr(start + length);
        APPLY(layout.update(start, length, replacement.length));

    }

    function APPEND(appendStr) {

        SPLICE(0, str.length, appendStr);

    }

    function LINE_COUNT() {

        return otp.length;

    }

    function TEXT() {

        return otp.join(`\n`);

    }

    function REQUIRE(condition) {

        if (!condition) {
            throw new Error(`Assertion failed!`);
        }

    }

    return { layout, SETUP, RESET, SPLICE, APPEND, LINE_COUNT, TEXT, REQUIRE, Position: (x, y) => new bindings.Position(x, y) };

}

for (let file of glob.sync(`**/*.test.cc`, { cwd: __dirname })) {

    console.log(`Processing ${file}`);

    let content = fs.readFileSync(`${__dirname}/${file}`).toString();

    content = content.replace(/^[ \t]*#.*/gm, ``);
    content = content.replace(/(TEST_CASE|SECTION)\((.*)\)$/gm, `testsuite.register($2).fn = (testsuite, env) =>`);
    content = content.replace(/([A-Z][A-Z_]*)\(/g, `env.$1(`);
    content = content.replace(/==/g, `+''==''+`);
    content = content.replace(/\b(layout|Position)\b/g, `env.$1`);
    content = content.replace(/([0-9])u/g, `$1`);
    content = content.replace(/\bauto\b/g, `let`);

    let testsuite = new TestSuite();
    vm.runInNewContext(content, { console, JSON, testsuite });
    testsuite.run();

}