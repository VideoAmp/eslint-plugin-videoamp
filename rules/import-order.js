/**
 * @see https://videoamp.atlassian.net/wiki/spaces/EN2/pages/1084555358/2019-07-09+FE+Guild+Meeting
 */

/**
 * @constant
 * @function
 */
const resolve = require("eslint-module-utils/resolve").default;

/**
 * @constant
 * @type {string[]}
 */
const groupNames = [
    "React",
    "Third-party",
    "First-party",
    "Local JS",
    "Local non-JS"
];
/**
 * @constant
 * @type {string[]}
 */
const reactPackages = ["react", "react-dom"];
/**
 * @constant
 * @type {string[]}
 */
const firstPartyPackages = ["@preamp", "@videoamp"];
/**
 * @constant
 * @type {string[]}
 */
const thirdPartyDirectories = ["node_modules"];

/**
 * everything before the first slash, if present
 * @constant
 * @function
 * @param {string} source
 * @returns {string}
 */
const getPackageName = source => source.match(/^[^\/]+/)[0];
/**
 * @constant
 * @function
 * @param {string} source
 * @param {string} path
 * @returns {function}
 */
const isInDirectory = (source, path) =>
    /**
     * @param {string} directory
     * @returns {boolean}
     */
    directory => path.includes(`${directory}/${source}`);
/**
 * in whitelist
 * @constant
 * @function
 * @param {string} source
 * @returns {boolean}
 */
const isReact = source => reactPackages.includes(getPackageName(source));
/**
 * in node_modules and not first-party
 * @constant
 * @function
 * @param {string} source
 * @param {string} path
 * @returns {boolean}
 */
const isThirdParty = (source, path) =>
    thirdPartyDirectories.some(isInDirectory(source, path)) &&
    !isFirstParty(source);
/**
 * in whitelist
 * @constant
 * @function
 * @param {string} source
 * @returns {boolean}
 */
const isFirstParty = source =>
    firstPartyPackages.includes(getPackageName(source));
/**
 * not in node_modules and file extension not present
 * @constant
 * @function
 * @param {string} source
 * @param {string} path
 * @returns {boolean}
 */
const isLocal = (source, path) =>
    !thirdPartyDirectories.some(isInDirectory(source, path)) &&
    !Boolean(source.match(/\.\w+$/));
/**
 * not in node_modules and file extension present
 * @constant
 * @function
 * @param {string} source
 * @param {string} path
 * @returns {boolean}
 */
const isLocalNonJs = (source, path) =>
    !thirdPartyDirectories.some(isInDirectory(source, path)) &&
    Boolean(source.match(/\.\w+$/));

/**
 * @constant
 * @function
 * @param {object} node
 * @param {object} node.source
 * @param {string} node.source.value
 * @param {string} path
 * @returns {number}
 */
const getGroupIndex = ({ source: { value } }, path) => {
    if (isReact(value)) {
        return 0;
    }

    if (isThirdParty(value, path)) {
        return 1;
    }

    if (isFirstParty(value)) {
        return 2;
    }

    if (isLocalNonJs(value, path)) {
        return 4;
    }

    return 3;
};

/**
 * @type {object}
 */
module.exports = {
    meta: {
        docs: {
            recommended: true,
        },
        fixable: "code",
        schema: [],
        type: "layout",
    },
    /**
     * @function
     * @param {object} context
     * @param {function} context.report
     * @returns {object}
     */
    create: context => {
        /**
         * @type {?object}
         */
        let previousImportDeclaration = null;

        return {
            /**
             * @function
             * @param {object} node
             * @param {object} node.source
             * @param {string} node.source.value
             */
            ImportDeclaration: node => {
                if (previousImportDeclaration) {
                    /**
                     * @constant
                     * @type {string}
                     */
                    const currentSource = node.source.value;
                    /**
                     * @constant
                     * @type {string}
                     */
                    const previousSource = previousImportDeclaration.source.value;
                    /**
                     * @constant
                     * @type {string}
                     */
                    const path = resolve(currentSource, context) || "";
                    /**
                     * @constant
                     * @type {number}
                     */
                    const currentGroupIndex = getGroupIndex(node, path);
                    /**
                     * @constant
                     * @type {string}
                     */
                    const currentGroupName = groupNames[currentGroupIndex];
                    /**
                     * @constant
                     * @type {number}
                     */
                    const previousGroupIndex = getGroupIndex(
                        previousImportDeclaration,
                        path
                    );
                    /**
                     * @constant
                     * @type {string}
                     */
                    const previousGroupName = groupNames[previousGroupIndex];
                    /**
                     * @constant
                     * @type {number}
                     */
                    const linesBetween =
                        node.loc.start.line - 1 - previousImportDeclaration.loc.end.line;

                    if (currentGroupIndex < previousGroupIndex) {
                        context.report({
                            fix: fixer => {
                                //
                            },
                            message: `${currentGroupName} imports must be declared before ${previousGroupName} imports`,
                            node
                        });
                    }

                    if (currentGroupIndex !== previousGroupIndex && linesBetween === 0) {
                        context.report({
                            /**
                             * @function
                             * @param {object} fixer
                             * @param {function} fixer.insertTextBeforeRange
                             * @returns {object}
                             */
                            fix: ({ insertTextBeforeRange }) => {
                                /**
                                 * @constant
                                 * @type {number[]}
                                 */
                                const { range } = node;

                                return insertTextBeforeRange(range, '\n');
                            },
                            message: `There must be an empty line between ${currentGroupName} imports and ${previousGroupName} imports`,
                            node
                        });
                    }

                    if (currentGroupIndex === previousGroupIndex && linesBetween !== 0) {
                        context.report({
                            fix: fixer => {
                                //
                            },
                            message: `There must be no empty lines within the ${currentGroupName} import group`,
                            node
                        });
                    }

                    if (currentGroupIndex === previousGroupIndex && currentSource < previousSource) {
                        context.report({
                            /**
                             * @function
                             * @param {object} fixer
                             * @param {function} fixer.replaceTextRange
                             * @returns {object[]}
                             */
                            fix: ({ replaceTextRange }) => {
                                /**
                                 * @constant
                                 * @type {object}
                                 */
                                const sourceCode = context.getSourceCode();
                                /**
                                 * @constant
                                 * @type {string}
                                 */
                                const previousText = sourceCode.getText(previousImportDeclaration);
                                /**
                                 * @constant
                                 * @type {string}
                                 */
                                const currentText = sourceCode.getText(node);
                                /**
                                 * @constant
                                 * @type {number[]}
                                 */
                                const { range: previousRange } = previousImportDeclaration;
                                /**
                                 * @constant
                                 * @type {number[]}
                                 */
                                const { range: currentRange } = node;

                                return [
                                    replaceTextRange(previousRange, currentText),
                                    replaceTextRange(currentRange, previousText),
                                ];
                            },
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
