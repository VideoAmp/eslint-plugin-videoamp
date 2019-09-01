const resolve = require("eslint-module-utils/resolve").default;

const groupNames = [
    "React",
    "Third-party",
    "First-party",
    "Local JS",
    "Local non-JS"
];
const reactPackages = ["react", "react-dom"];
const firstPartyPackages = ["@preamp", "@videoamp", "@videoamp-private"];
const thirdPartyDirectories = ["node_modules"];

const getPackageName = source => source.match(/^[^\/]+/)[0];
const isInDirectory = (source, path) => directory => path.includes(`${directory}/${source}`);
const isReact = source => reactPackages.includes(getPackageName(source));
const isThirdParty = (source, path) => thirdPartyDirectories.some(isInDirectory(source, path)) && !isFirstParty(source);
const isFirstParty = source => firstPartyPackages.includes(getPackageName(source));
const isLocalNonJs = (source, path) => !thirdPartyDirectories.some(isInDirectory(source, path)) && Boolean(source.match(/\.\w+$/));
const getGroupIndex = (source, context) => {
    const path = resolve(source, context) || "";

    if (isReact(source)) {
        return 0;
    }

    if (isThirdParty(source, path)) {
        return 1;
    }

    if (isFirstParty(source)) {
        return 2;
    }

    if (isLocalNonJs(source, path)) {
        return 4;
    }

    return 3;
};
const fixerSwapImportDeclarations = (currentNode, previousNode, context) => ({ replaceTextRange }) => {
    const sourceCode = context.getSourceCode();
    const previousText = sourceCode.getText(previousNode);
    const currentText = sourceCode.getText(currentNode);
    const { range: previousRange } = previousNode;
    const { range: currentRange } = currentNode;

    return [
        replaceTextRange(previousRange, currentText),
        replaceTextRange(currentRange, previousText),
    ];
};
const fixerRemoveEmptyLines = (currentNode, previousNode) => ({ replaceTextRange }) => {
    const { range: [_, previousEnd] } = previousNode;
    const { range: [currentStart] } = currentNode;
    const range = [previousEnd, currentStart];

    return replaceTextRange(range, '\n');
};
const fixerAddEmptyLine = (currentNode) => ({ insertTextBeforeRange }) => {
    const { range } = currentNode;

    return insertTextBeforeRange(range, '\n');
};

module.exports = {
    meta: {
        docs: {
            recommended: true,
        },
        fixable: "code",
        schema: [],
        type: "layout",
    },
    create: context => {
        let previousImportDeclaration = null;

        return {
            ImportDeclaration: node => {
                if (previousImportDeclaration) {
                    const currentSource = node.source.value;
                    const currentGroupIndex = getGroupIndex(currentSource, context);
                    const currentGroupName = groupNames[currentGroupIndex];
                    const previousSource = previousImportDeclaration.source.value;
                    const previousGroupIndex = getGroupIndex(previousSource, context);
                    const previousGroupName = groupNames[previousGroupIndex];
                    const linesBetween = node.loc.start.line - 1 - previousImportDeclaration.loc.end.line;

                    if (currentGroupIndex < previousGroupIndex) {
                        context.report({
                            fix: fixerSwapImportDeclarations(node, previousImportDeclaration, context),
                            message: `${currentGroupName} imports must be declared before ${previousGroupName} imports`,
                            node
                        });
                    }

                    if (currentGroupIndex !== previousGroupIndex && linesBetween === 0) {
                        context.report({
                            fix: fixerAddEmptyLine(node),
                            message: `There must be an empty line between ${currentGroupName} imports and ${previousGroupName} imports`,
                            node
                        });
                    }

                    if (currentGroupIndex === previousGroupIndex && linesBetween !== 0) {
                        context.report({
                            fix: fixerRemoveEmptyLines(node, previousImportDeclaration),
                            message: `There must be no empty lines within the ${currentGroupName} import group`,
                            node
                        });
                    }

                    if (currentGroupIndex === previousGroupIndex && currentSource < previousSource) {
                        context.report({
                            fix: fixerSwapImportDeclarations(node, previousImportDeclaration, context),
                            message: `Import declarations within the ${currentGroupName} import group must be ordered alphabetically`,
                            node
                        });
                    }
                }

                previousImportDeclaration = node;
            }
        };
    },
};
