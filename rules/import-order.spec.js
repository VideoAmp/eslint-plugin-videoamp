const RuleTester = require('eslint').RuleTester;
const rule = require('./import-order');

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            modules: true,
        },
        ecmaVersion: 6,
        sourceType: 'module',
    },
});

describe('import-order', () => {
    const importReact = "import React from 'react';";
    const importLocalJs = [
        "import { Ancestor } from '../Ancestor';",
        "import { Sibling } from './Sibling';",
        "import { A } from 'components/A';",
        "import { B } from 'components/B';",
    ];
    const validOrderOfGroupsCode = `${importReact}\n\n${importLocalJs[0]}`;
    const validLinesBetweenGroupsCode = `${importReact}\n\n${importLocalJs[0]}`;
    const validLinesBetweenGroupsCodeWithSingleLineComment = `${importReact}\n\n// comment\n${
        importLocalJs[0]
    }`;
    const validLinesBetweenGroupsCodeWithMultiLineComment = `${importReact}\n\n/**\n * comment\n */\n${
        importLocalJs[0]
    }`;
    const validLinesBetweenGroupsCodeWithMultiComments = `${importReact}\n\n// comment\n// comment\n${
        importLocalJs[0]
    }`;
    const validLinesWithinGroupCode = `${importLocalJs[0]}\n${
        importLocalJs[1]
    }`;
    const validLinesWithinGroupCodeWithSingleLineComment = `${
        importLocalJs[0]
    }\n// comment\n${importLocalJs[1]}`;
    const validLinesWithinGroupCodeWithMultiLineComment = `${
        importLocalJs[0]
    }\n/**\n * comment\n */\n${importLocalJs[1]}`;
    const validLinesWithinGroupCodeWithMultipleComments = `${
        importLocalJs[0]
    }\n// comment\n// comment\n${importLocalJs[1]}`;
    const validAlphabeticalWithinGroupCode = importLocalJs.join('\n');

    ruleTester.run('Order of groups', rule, {
        invalid: [
            {
                // local js before react
                code: `${importLocalJs[0]}\n\n${importReact}`,
                errors: 1,
                output: validOrderOfGroupsCode,
            },
        ],
        valid: [validOrderOfGroupsCode],
    });

    ruleTester.run('Empty lines between groups', rule, {
        invalid: [
            {
                // 0 empty lines
                code: `${importReact}\n${importLocalJs[0]}`,
                errors: 1,
                output: validLinesBetweenGroupsCode,
            },
            {
                // 2 empty lines
                code: `${importReact}\n\n\n${importLocalJs[0]}`,
                errors: 1,
                output: validLinesBetweenGroupsCode,
            },
            {
                // 0 empty lines with single-line comment
                code: `${importReact}\n// comment\n${importLocalJs[0]}`,
                errors: 1,
                output: validLinesBetweenGroupsCodeWithSingleLineComment,
            },
            {
                // 0 empty lines with multi-line comment
                code: `${importReact}\n/**\n * comment\n */\n${
                    importLocalJs[0]
                }`,
                errors: 1,
                output: validLinesBetweenGroupsCodeWithMultiLineComment,
            },
            {
                // 0 empty lines with multiple comments
                code: `${importReact}\n// comment\n// comment\n${
                    importLocalJs[0]
                }`,
                errors: 1,
                output: validLinesBetweenGroupsCodeWithMultiComments,
            },
            {
                // 2 empty lines with single-line comment
                code: `${importReact}\n\n// comment\n\n${importLocalJs[0]}`,
                errors: 1,
                output: validLinesBetweenGroupsCodeWithSingleLineComment,
            },
            {
                // 2 empty lines with multi-line comment
                code: `${importReact}\n\n/**\n * comment\n */\n\n${
                    importLocalJs[0]
                }`,
                errors: 1,
                output: validLinesBetweenGroupsCodeWithMultiLineComment,
            },
            {
                // 2 empty lines with multi-line comment
                code: `${importReact}\n\n// comment\n// comment\n\n${
                    importLocalJs[0]
                }`,
                errors: 1,
                output: validLinesBetweenGroupsCodeWithMultiComments,
            },
        ],
        valid: [
            validLinesBetweenGroupsCode,
            validLinesBetweenGroupsCodeWithSingleLineComment,
            validLinesBetweenGroupsCodeWithMultiLineComment,
            validLinesBetweenGroupsCodeWithMultiComments,
        ],
    });

    ruleTester.run('No empty lines within group', rule, {
        invalid: [
            {
                // 1 empty line
                code: `${importLocalJs[0]}\n\n${importLocalJs[1]}`,
                errors: 1,
                output: validLinesWithinGroupCode,
            },
            {
                // 1 empty line with single-line comment
                code: `${importLocalJs[0]}\n\n// comment\n${importLocalJs[1]}`,
                errors: 1,
                output: validLinesWithinGroupCodeWithSingleLineComment,
            },
            {
                // 1 empty line with multi-line comment
                code: `${importLocalJs[0]}\n\n/**\n * comment\n */\n${
                    importLocalJs[1]
                }`,
                errors: 1,
                output: validLinesWithinGroupCodeWithMultiLineComment,
            },
            {
                // 1 empty line with multiple comments
                code: `${importLocalJs[0]}\n\n// comment\n// comment\n${
                    importLocalJs[1]
                }`,
                errors: 1,
                output: validLinesWithinGroupCodeWithMultipleComments,
            },
            {
                // same line
                code: `${importLocalJs[0]}${importLocalJs[1]}`,
                errors: 1,
                output: validLinesWithinGroupCode,
            },
        ],
        valid: [
            validLinesWithinGroupCode,
            validLinesWithinGroupCodeWithSingleLineComment,
            validLinesWithinGroupCodeWithMultiLineComment,
            validLinesWithinGroupCodeWithMultipleComments,
        ],
    });

    ruleTester.run('Alphabetical within group', rule, {
        invalid: [
            {
                // sibling before ancestor
                code: `${importLocalJs[1]}\n${importLocalJs[0]}\n${
                    importLocalJs[2]
                }\n${importLocalJs[3]}`,
                errors: 1,
                output: validAlphabeticalWithinGroupCode,
            },
            {
                // absolute before sibling
                code: `${importLocalJs[0]}\n${importLocalJs[2]}\n${
                    importLocalJs[1]
                }\n${importLocalJs[3]}`,
                errors: 1,
                output: validAlphabeticalWithinGroupCode,
            },
            {
                // directory names in same path
                code: `${importLocalJs[0]}\n${importLocalJs[1]}\n${
                    importLocalJs[3]
                }\n${importLocalJs[2]}`,
                errors: 1,
                output: validAlphabeticalWithinGroupCode,
            },
            {
                // sibling before ancestor and directory names in same path
                code: `${importLocalJs[1]}\n${importLocalJs[0]}\n${
                    importLocalJs[3]
                }\n${importLocalJs[2]}`,
                errors: 2,
                output: validAlphabeticalWithinGroupCode,
            },
            {
                // absolute before sibling, sibling before ancestor, and directory names in same path
                code: `${importLocalJs[3]}\n${importLocalJs[2]}\n${
                    importLocalJs[1]
                }\n${importLocalJs[0]}`,
                errors: 3,
                output: `${importLocalJs[2]}\n${importLocalJs[3]}\n${
                    importLocalJs[0]
                }\n${importLocalJs[1]}`,
            },
        ],
        valid: [validAlphabeticalWithinGroupCode],
    });
});
