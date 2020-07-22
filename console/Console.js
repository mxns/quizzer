const tree = require('../programs/DecisionTree');
const preprocessors = require('../programs/PreProcessors.js');
const state = {};

const nodeRepository = require('../NodeRepository')();
nodeRepository
    .load('./programs/DecisionTree')
    .load('./programs/Reception')
    .load('./programs/Exit');

const stateMachine = require('../StateMachine')(nodeRepository, preprocessors, state);

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

        view: (output) => {
            if (output.length == 0) {
                return Promise.resolve();
            }
            const head = output[output.length - 1];
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
            return ui.view(stateMachine.getOutput())
                        .then(input => resolve(input))
                        .catch(error => reject(error));
        }
        ui.view(stateMachine.getOutput())
            .then(input => stateMachine.processInput(input))
            .then(v => loop(resolve, reject))
            .catch(error => reject(error));
    } catch (error) {
        reject(error);
    }
}

stateMachine.setRoot("Name")
    .then(v => new Promise((resolve, reject) => loop(resolve, reject)))
    .then(v => {
        console.log(JSON.stringify(state, null, 2));
        ui.close();
    })
    .catch(error => {
        console.error(error);
        ui.close();
    });
