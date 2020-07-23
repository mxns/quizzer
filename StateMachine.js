'use strict'


module.exports = function(nodeRepository, preprocessors, state) {

    var current;

    return {

        setRoot(nodeId) {
            const node = nodeRepository.getNode(nodeId);
            if (!node) {
                throw `Unknown node ID: ${nodeId}`;
            }
            current = node;
            return Promise.resolve();
        },

        getCurrent: function() {
            return {
                id: current.id,
                output: () => current.output(state),
                process: (input) => current.process(state, input),
                next: () => current.next(state),
                hasNext: () => current.next != undefined
            };
        },

        hasNext: function() {
            var node = current;
            if (node.next == undefined) {
                return false;
            }
            const nextId = node.next(state);
            if (nextId == undefined) {
                return false;
            }
            const next = nodeRepository.getNode(nextId);
            if (next == undefined) {
                throw `[${node.id}] No next: ${nextId}`;
            }
            return true;
        },

        next: function() {
            var node = current;
            if (node.next == undefined) {
                return Promise.reject(`${current.id} has no next method`);
            }
            const nextId = node.next(state);
            if (nextId == undefined) {
                return Promise.reject(`${current.id} is not fulfilled`);
            }
            const next = nodeRepository.getNode(nextId);
            if (next == undefined) {
                return Promise.reject(`${current.id}: node does not exist: ${nextId}`);
            }
            current = next;
            return Promise.resolve();
        },

        getOutput: function() {
            if (current.output) {
                return current.output(state);
            }
        },

        processInput: function(input) {
            var node = current;
            if (node.process == undefined) {
                return Promise.resolve();
            }
            const preprocessor = preprocessors[node.type];
            if (!preprocessor) {
                return Promise.resolve(node.process(state, input))
                    .then(v => Promise.resolve());
            }
            return Promise.resolve(preprocessor(state, input))
                .then(processedInput => Promise.resolve(node.process(state, processedInput)))
                .then(v => Promise.resolve());
        },

        getNode: function(nodeId) {
            const node = nodeRepository.getNode(nodeId);
            if (!node) {
                throw `Unknown node ID: ${nodeId}`;
            }
            return {
                id: node.id,
                output: () => node.output(state),
                process: (input) => node.process(state, input),
                next: () => node.next(state)
            };
        }
    };
};
