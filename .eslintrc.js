module.exports = {
    env: {
        browser: true,
        es6: true
    },
    parser: 'babel-eslint',
    parserOptions: {
        allowImportExportEverywhere: true,
        ecmaVersion: 9,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        semi: "error",
        indent: ['error', 4, {
            ignoredNodes: ['JSXElement *', 'JSXElement'],
            SwitchCase: 1
        }],
        'no-negated-condition': 'warn',
        'no-useless-escape': 'warn',
        camelcase: 'warn'
    }
};
