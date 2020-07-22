'use strict'

const stateMachine = (() => {

    const state = {};
    const preprocessors = require('../programs/PreProcessors.js');
    const nodeRepository = require('../NodeRepository')()
        .load('./programs/DecisionTree')
        .load('./programs/Reception')
        .load('./programs/Exit');
    const sm = require('../StateMachine')(nodeRepository, preprocessors, state);

    return {
        output: null,
        setRoot: (nodeId) => sm.setRoot(nodeId),
        hasNext: () => sm.hasNext(),
        getOutput: () => {
            if (this.output) {
                return [{ type: "Command", text: this.output }];
            }
            return sm.getOutput()
        },
        processInput: (input) => {
            this.output = null;
            if (input && input.startsWith('$')) {
                const cmd = input.substring(1).split(' ').filter(item => item);
                switch (cmd[0]) {
                    case 'state':
                        this.output = JSON.stringify(state, null, 2);
                        break;
                    case 'goto':
                        sm.setRoot(cmd[1]);
                        break;
                }
                return Promise.resolve();
            }
            return sm.processInput(input);
        },
        getState: () => JSON.stringify(state, null, 2)
    };
})();

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
        console.log(stateMachine.getState());
        ui.close();
    })
    .catch(error => {
        console.error(error);
        ui.close();
    });
