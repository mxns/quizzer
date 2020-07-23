'use strict'

const preprocessors = require('../programs/PreProcessors.js');
const stateMachine = require('../StateMachine');
const nodeRepository = require('../NodeRepository')();
nodeRepository
    .load('./programs/DecisionTree')
    .load('./programs/Reception')
    .load('./programs/Exit');

const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const app = express();
const port = 3000;
app.use(cookieParser());

function createStateMachine(req) {
    var data = JSON.parse(JSON.stringify(req.cookies.quizzer || { state: {} }));
    const sm = stateMachine(nodeRepository, preprocessors, data.state);
    data.root = data.root || "Name";
    const wrapper = {
        getData: () => JSON.parse(JSON.stringify(data)),
        getOutput: () => sm.getOutput(),
        processInput: (input) => sm.processInput(input),
        getNode: (nodeId) => sm.getNode(nodeId),
        hasNext: () => sm.hasNext(),
        next: () => sm.next().then(v => {
            data.root = sm.getCurrent().id;
            return Promise.resolve();
        })
    };
    return sm.setRoot(data.root).then(v => wrapper);
}

function getOutput(req, res) {
    createStateMachine(req)
        .then(sm => {
            res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
            res.send(sm.getOutput());
        })
        .catch(error => console.error(error));
}

function next(req, res) {
    createStateMachine(req)
        .then(sm => {
            if (!sm.hasNext()) {
                res.send("not ok");
                return Promise.resolve();
            }
            return sm.next().then(v => {
                res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
                res.send(sm.hasNext())
            });
        })
        .catch(error => console.error(error));
}

function getState(req, res) {
    res.send(req.cookies.quizzer ? (req.cookies.quizzer.state || {}) : {});
}

function processInput(req, res) {
    const input = req.body.input;
    createStateMachine(req)
        .then(sm => sm.processInput(input).then(v => sm))
        .then(sm => {
            res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
            res.send(sm.hasNext());
        })
        .catch(error => console.error(error));
}


app.get('/sm', (req, res) => {
    getOutput(req, res);
});

app.get('/sm/state', (req, res) => {
    getState(req, res);
});

app.put('/sm/next', (req, res) => {
    next(req, res);
});

app.put('/sm', jsonParser, (req, res) => {
    processInput(req, res);
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
