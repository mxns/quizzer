'use strict'

const readline = require("readline");
const nodeData = require('./DecisionTree.js');
const preprocessors = require('./PreProcessors.js');
const nodes = nodeData.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, { root: nodeData[0] });
const Node = require('./Node.js')(id => nodes[id], preprocessors);

const ui = (() => {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function displayNode(node) {
        return new Promise((resolve, reject) => {
            try {
                if (!node.output) {
                    resolve();
                    return;
                }
                const output = Node.output(node);
                if (output.type === "Question") {
                    rl.question(output.text + ' ', input => resolve(input));
                } else {
                    rl.write(output.text + '\n');
                    resolve();
                }
            } catch (error) {
                console.debug(`Error at node ${node ? node.id : 'unknown'}`);
                reject(error);
            }
        });
    }

    return {

        view: (path) => {
            const node = path[path.length - 1];
            const tail = path.slice(0, path.length - 1);
            tail
                .filter(item => item.output)
                .forEach(function (item) {
                    const output = Node.output(item);
                    rl.write(output.text + '\n');
                });
            return displayNode(node);
        },

        close: () =>{ 
            try {
                rl.close();
            } catch(error) {
                console.error(error);
            }
        }
    };
})();

function loop(node, resolve, reject) {
    try {
        if (node.next === undefined) {
            resolve(Node.state());
            return;
        }
        Node.next(node)
            .then(path => processAndLoop(path, resolve, reject))
            .catch(error => {
                reject(error)
            });
    } catch (error) {
        reject(error);
    }
}

function processAndLoop(path, resolve, reject) {
    const node = path[path.length - 1];
    ui.view(path)
        .then(input => Node.process(node, input))
        .then(v => Node.nextNode(node))
        .then(nextNode => loop(nextNode, resolve, reject))
        .catch(error => {
            reject(error);
        });
}

(new Promise((resolve, reject) => {
    loop(nodes.root, resolve, reject)
}))
    .then(finalState => {
        console.log(JSON.stringify(finalState, null, 2));
        ui.close();
    })
    .catch(error => {
        console.error(error);
        ui.close();
    });
