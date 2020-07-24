'use strict'


module.exports = function(rootId, nodeRepository, preprocessors, state) {

    var current = nodeRepository.getNode(rootId);

    return {

        setCurrent(nodeId) {
            current = nodeRepository.getNode(nodeId);
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
            if (current.next == undefined) {
                return false;
            }
            const nextId = current.next(state);
            if (nextId == undefined) {
                return false;
            }
            const next = nodeRepository.getNode(nextId);
            return true;
        },

        next: function() {
            if (current.next == undefined) {
                throw `${current.id} has no next method`;
            }
            const nextId = current.next(state);
            if (nextId == undefined) {
                throw `${current.id} is not fulfilled`;
            }
            const next = nodeRepository.getNode(nextId);
            current = next;
        },

        getOutput: function() {
            if (current.output == undefined) {
                return Promise.resolve();
            }
            return Promise.resolve(current.output(state));
        },

        processInput: function(input) {
            if (current.process == undefined) {
                return Promise.resolve();
            }
            const preprocessor = preprocessors[current.type];
            if (preprocessor == undefined) {
                return Promise.resolve(current.process(state, input))
                    .then(v => Promise.resolve());
            }
            return Promise.resolve(preprocessor(state, input))
                .then(processedInput => Promise.resolve(current.process(state, processedInput)))
                .then(v => Promise.resolve());
        },

        getNode: function(nodeId) {
            const node = nodeRepository.getNode(nodeId);
            return {
                id: node.id,
                output: () => node.output(state),
                process: (input) => node.process(state, input),
                next: () => node.next(state)
            };
        }
    };
};
