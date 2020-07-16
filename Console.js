const tree = require('./DecisionTree');
var nodes = tree.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {});
nodes.root = nodes["Name"];
var state = {};
const preprocessors = require('./PreProcessors.js');
var stateMachine = require('./StateMachine')(nodes, preprocessors, state);

const ui = (() => {

    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function displayNode(output) {
        return new Promise((resolve, reject) => {
            try {
                if (output.type === "Question") {
                    rl.question(output.text + ' ', input => {
                        resolve(input);
                    });
                } else {
                    rl.write(output.text + '\n');
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    return {

        view: () => {
            const output = stateMachine.output();
            const head = output[output.length - 1];
            const tail = output.slice(0, output.length - 1);
            tail
                .forEach(function (item) {
                    rl.write(item.text + '\n');
                });
            return displayNode(head);
        },

        close: () => {
            try {
                rl.close();
            } catch(error) {
                console.error(error);
            }
        }
    };
})();

function loop(resolve, reject) {
    try {
        if (!stateMachine.hasNext()) {
            resolve();
            return;
        }
        stateMachine.next()
            .then(v => ui.view())
            .then(input => stateMachine.process(input))
            .then(v => loop(resolve, reject));
    } catch (error) {
        reject(error);
    }
}

(new Promise((resolve, reject) => loop(resolve, reject)))
    .then(v => {
        console.log(JSON.stringify(state, null, 2));
        ui.close();
    })
    .catch(error => {
        console.error(error);
        ui.close();
    });
