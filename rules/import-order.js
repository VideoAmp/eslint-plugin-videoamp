const resolve = require('eslint-module-utils/resolve').default;

const groupNames = [
    'React',
    'Third-party',
    'First-party',
    'Local JS',
    'Local non-JS',
];

const reactPackages = ['react', 'react-dom'];
const firstPartyPackages = ['@preamp', '@videoamp', '@videoamp-private'];
const thirdPartyDirectories = ['node_modules'];

const getPackageName = source => source.match(/^[^/]+/)[0];
const hasFileExtension = source => Boolean(source.match(/\.\w+$/));
const isFirstPartyPackage = source =>
    firstPartyPackages.includes(getPackageName(source));
const isInDirectory = (source, path) => directory =>
    path.includes(`${directory}/${source}`);
const isInThirdPartyDirectory = (source, path) =>
    thirdPartyDirectories.some(isInDirectory(source, path));
const isReactPackage = source => reactPackages.includes(getPackageName(source));

const isReact = source => isReactPackage(source);
const isFirstParty = source => isFirstPartyPackage(source);
const isThirdParty = (source, path) =>
    isInThirdPartyDirectory(source, path) && !isFirstParty(source);
const isLocalNonJs = (source, path) =>
    !isInThirdPartyDirectory(source, path) && hasFileExtension(source);

const getGroupIndex = (source, context) => {
    const path = resolve(source, context) || '';

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

const fixerEmptyLinesBetween = (currentNode, previousNode, numberOfLines) => ({
    replaceTextRange,
}) => {
    const {
        range: [_, previousEnd],
    } = previousNode;
    const {
        range: [currentStart],
    } = currentNode;
    const range = [previousEnd, currentStart];
    const newLines = Array(numberOfLines + 1)
        .fill('\n')
        .join('');

    return replaceTextRange(range, newLines);
};
const fixerSwapImportDeclarations = (currentNode, previousNode, context) => ({
    replaceTextRange,
}) => {
    const sourceCode = context.getSourceCode();
    const previousText = sourceCode.getText(previousNode);
    const currentText = sourceCode.getText(currentNode);

    return [
        replaceTextRange(previousNode.range, currentText),
        replaceTextRange(currentNode.range, previousText),
    ];
};

module.exports = {
    meta: {
        docs: {
            recommended: true,
        },
        fixable: 'code',
        schema: [],
        type: 'layout',
    },
    create: context => {
        let previousImportDeclaration = null;

        return {
            ImportDeclaration: node => {
                if (previousImportDeclaration) {
                    const currentSource = node.source.value;
                    const currentGroupIndex = getGroupIndex(
                        currentSource,
                        context
                    );
                    const currentGroupName = groupNames[currentGroupIndex];
                    const previousSource =
                        previousImportDeclaration.source.value;
                    const previousGroupIndex = getGroupIndex(
                        previousSource,
                        context
                    );
                    const previousGroupName = groupNames[previousGroupIndex];
                    const emptyLinesBeforeCurrentNode =
                        node.loc.start.line -
                        1 -
                        previousImportDeclaration.loc.end.line;

                    if (currentGroupIndex < previousGroupIndex) {
                        context.report({
                            fix: fixerSwapImportDeclarations(
                                node,
                                previousImportDeclaration,
                                context
                            ),
                            message: `${currentGroupName} imports must be declared before ${previousGroupName} imports`,
                            node,
                        });
                    }

                    if (
                        currentGroupIndex !== previousGroupIndex &&
                        emptyLinesBeforeCurrentNode !== 1
                    ) {
                        context.report({
                            fix: fixerEmptyLinesBetween(
                                node,
                                previousImportDeclaration,
                                1
                            ),
                            message: `There must be one empty line between ${currentGroupName} imports and ${previousGroupName} imports`,
                            node,
                        });
                    }

                    if (
                        currentGroupIndex === previousGroupIndex &&
                        emptyLinesBeforeCurrentNode !== 0
                    ) {
                        context.report({
                            fix: fixerEmptyLinesBetween(
                                node,
                                previousImportDeclaration,
                                0
                            ),
                            message: `There must be no empty lines within the ${currentGroupName} import group`,
                            node,
                        });
                    }

                    if (
                        currentGroupIndex === previousGroupIndex &&
                        currentSource < previousSource
                    ) {
                        context.report({
                            fix: fixerSwapImportDeclarations(
                                node,
                                previousImportDeclaration,
                                context
                            ),
                            message: `Import declarations within the ${currentGroupName} import group must be ordered alphabetically by source`,
                            node,
                        });
                    }
                }

                previousImportDeclaration = node;
            },
        };
    },
};
