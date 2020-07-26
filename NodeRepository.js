'use strict'

module.exports = function () {

    const nodes = {};

    return {
        getNode: function (nodeId) {
            const node = nodes[nodeId];
            if (!node) {
                throw `Unknown node ID: ${nodeId}`;
            }
            return node;
        },

        load: function (moduleName) {
            const tree = require(moduleName);
            tree.reduce((acc, curr) => {
                if (acc[curr.id]) {
                    throw `Duplicate ID: ${curr.id}`;
                }
                acc[curr.id] = curr;
                return acc;
            }, nodes);
            return this;
        }
    };
}