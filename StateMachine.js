'use strict'


module.exports = function(nodes, preprocessors, state) {

    var current;

    return {

        setRoot(nodeId) {
            if (!nodes[nodeId]) {
                throw `Unknown node: ${nodeId}`;
            }
            current = [nodes[nodeId]];
            return this.next();
        },

        output: function () {
            return current.filter(node => node.output).map(node => node.output(state));
        },

        hasNext: function() {
            var node = current[current.length - 1];
            return node.next !== undefined;
        },

        next: function () {
            var node = current[current.length - 1];
            if (node.next === undefined) {
                return Promise.resolve();
            }
            const nextId = node.next(state);
            if (nextId === undefined) {
                return Promise.resolve();
            }
            const next = nodes[nextId];
            if (next === undefined) {
                return Promise.reject(`[${node.id}] No next: ${nextId}`);
            }
            current = [next];
            return Promise.resolve();
        },

        process: function (input) {
            var node = current[current.length - 1]
            if (node.process === undefined) {
                return this.next();
            }
            const preprocessor = preprocessors[node.type];
            if (!preprocessor) {
                return Promise.resolve(node.process(state, input))
                    .then(v => this.next());
            }
            return Promise.resolve(preprocessor(state, input))
                .then(processedInput => Promise.resolve(node.process(state, processedInput)))
                .then(v => this.next());
        }
    }
};
