'use strict'

const UI = (() => {

    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return {

        view: (output) => {
            if (!output) {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                try {
                    rl.question(output.text + ' ', input => resolve(input));
                } catch (error) {
                    reject(error);
                }
            });
        },

        print: (output) => {
            rl.write(output + '\n');
        },

        close: () => {
            try {
                rl.close();
            } catch (error) {
                console.error(error);
            }
        }
    };
});

const StateMachine = ((rootId, modules, ui) => {

    const state = {};
    const preprocessors = require('../programs/PreProcessors.js');
    const nodeRepository = require('../NodeRepository')();
    modules.forEach(module => nodeRepository.load(module));
    const sm = require('../StateMachine')(rootId, nodeRepository, preprocessors, state, []);

    return {
        hasNext: () => sm.hasNext(),
        next: () => sm.next(),
        getOutput: () => sm.getOutput(),
        processInput: (input) => {
            if (input && input.startsWith('$')) {
                const cmd = input.substring(1).split(' ').filter(item => item);
                switch (cmd[0]) {
                    case 'state':
                        ui.print(JSON.stringify(state, null, 2));
                        break;
                    case 'next':
                        return sm.next();
                    case 'previous':
                        return sm.previous();
                    default:
                        ui.print(`Unknown command ${cmd[0]}`);
                }
                return Promise.resolve();
            }
            return sm.processInput(input).then(v => sm.hasNext() ? sm.next() : Promise.resolve());
        },
        getState: () => JSON.parse(JSON.stringify(state)),
        getCurrent: () => sm.getCurrent(),
        isHaltingNode: () => sm.isHaltingNode()
    };
});

const Loop = (stateMachine, ui) => {
    function loop(stateMachine, ui, resolve, reject) {
        try {
            if (stateMachine.isHaltingNode()) {
                return stateMachine.getOutput()
                    .then(output => ui.view(output))
                    .then(input => resolve(stateMachine.getState()))
                    .catch(error => reject(error));
            }
            return stateMachine.getOutput()
                .then(output => ui.view(output))
                .then(input => stateMachine.processInput(input))
                .then(v => loop(stateMachine, ui, resolve, reject))
                .catch(error => reject(error));
        } catch (error) {
            reject(error);
        }
    }
    return {
        run: () => new Promise((resolve, reject) => loop(stateMachine, ui, resolve, reject))
    };
}

const startNodeId = process.argv[2];
const modules = process.argv.slice(3);
const ui = UI();
const stateMachine = StateMachine(startNodeId, modules, ui);
const loop = Loop(stateMachine, ui);

loop.run()
    .then(result => {
        console.log(JSON.stringify(result, null, 2));
        ui.close();
    })
    .catch(error => {
        console.error(error);
        ui.close();
    });
