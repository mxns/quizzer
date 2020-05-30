'use strict'


module.exports = function(nodes, preprocessors) {

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
        const next = nodes(nextId);
        if (next === undefined) {
            reject(`[${node.id}] No next: ${nextId}`);
            return;
        }
        getNext(next, path, resolve, reject);
    };

    const state = {};

    return {

        state: () => JSON.parse(JSON.stringify(state)),

        output: function (node) {
            return node.output(state);
        },

        nextNode: function(node) {
            return new Promise((resolve, reject) => {
                if (node.next === undefined) {
                    resolve(node);
                    return;
                }
                const nextId = node.next(state);
                if (nextId === undefined) {
                    resolve(node);
                    return;
                }
                const next = nodes(nextId);
                if (next === undefined) {
                    reject(`[${node.id}] No next: ${nextId}`);
                    return;
                }
                resolve(next);
            })
        },

        next: function (node) {
            return new Promise((resolve, reject) => {
                getNext(node, [], resolve, reject)
            });
        },

        process: function (node, input) {
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
