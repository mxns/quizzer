'use strict'


module.exports = function(nodes, preprocessors, state) {

    var current = [nodes.root];

    const getNext = function (node, path, resolve, reject) {
        path.push(node);
        if (node.next === undefined) {
            resolve(path);
            return;
        }
        const nextId = node.next(state);
        if (nextId === undefined) {
            resolve(path);
            return;
        }
        const next = nodes[nextId];
        if (next === undefined) {
            reject(`[${node.id}] No next: ${nextId}`);
            return;
        }
        getNext(next, path, resolve, reject);
    };

    return {

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
            return new Promise((resolve, reject) => {
                getNext(next, [], resolve, reject)
            }).then(path => {
                current = path;
                return Promise.resolve();
            });
        },

        process: function (input) {
            var node = current[current.length - 1]
            if (node.process === undefined) {
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
        }
    }
};
