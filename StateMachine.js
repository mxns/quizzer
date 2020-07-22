'use strict'


module.exports = function(nodeRepository, preprocessors, state) {

    var current;

    const next = function () {
        var node = current[current.length - 1];
        if (node.next === undefined) {
            return Promise.resolve();
        }
        const nextId = node.next(state);
        if (nextId === undefined) {
            return Promise.resolve();
        }
        const next = nodeRepository.getNode(nextId);
        if (next === undefined) {
            return Promise.reject(`[${node.id}] No next: ${nextId}`);
        }
        current = [next];
        return Promise.resolve();
    };

    return {

        setRoot(nodeId) {
            if (!nodeRepository.getNode(nodeId)) {
                throw `Unknown node ID: ${nodeId}`;
            }
            current = [nodeRepository.getNode(nodeId)];
            return next();
        },

        getCurrent: function() {
            var node = current[current.length - 1];
            return node.id;
        },

        hasNext: function() {
            var node = current[current.length - 1];
            return node.next !== undefined;
        },

        getOutput: function() {
            return current.filter(node => node.output).map(node => node.output(state));
        },

        processInput: function(input) {
            var node = current[current.length - 1]
            if (node.process === undefined) {
                return next();
            }
            const preprocessor = preprocessors[node.type];
            if (!preprocessor) {
                return Promise.resolve(node.process(state, input))
                    .then(v => next());
            }
            return Promise.resolve(preprocessor(state, input))
                .then(processedInput => Promise.resolve(node.process(state, processedInput)))
                .then(v => next());
        }
    };
};
