'use strict'


module.exports = function(rootId, nodeRepository, preprocessors, state, history) {

    var current = nodeRepository.getNode(rootId);

    return {

        getCurrent: function() {
            return {
                id: current.id,
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
            history.push(current.id);
            current = nodeRepository.getNode(nextId);
        },

        hasPrevious: function() {
            return history.length > 0;
        },

        previous: function() {
            if (history.length == 0) {
                throw `No available history`;
            }
            current = nodeRepository.getNode(history.pop());
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
        }
    };
};
