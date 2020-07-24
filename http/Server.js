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
    data.root = data.root || "Name";
    data.history = data.history || [];
    const sm = stateMachine(data.root, nodeRepository, preprocessors, data.state, data.history);
    const wrapper = {
        getData: () => JSON.parse(JSON.stringify(data)),
        getOutput: () => sm.getOutput(),
        processInput: (input) => sm.processInput(input),
        hasNext: () => sm.hasNext(),
        hasPrevious: () => sm.hasPrevious(),
        next: () => {
                        sm.next();
                        data.root = sm.getCurrent().id;
                        return Promise.resolve();
                    },
        previous: () => {
                        sm.previous();
                        data.root = sm.getCurrent().id;
                        return Promise.resolve();
                    }
    };
    return wrapper;
}

function getOutput(req, res) {
    const sm = createStateMachine(req);
    sm.getOutput()
        .then(output => res.send(output))
        .catch(error => console.error(error));
}

function next(req, res) {
    const sm = createStateMachine(req);
    if (!sm.hasNext()) {
        res.send("not ok");
        return;
    }
    sm.next();
    res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
    res.send(sm.hasNext());
}

function previous(req, res) {
    const sm = createStateMachine(req);
    if (!sm.hasPrevious()) {
        res.send("not ok");
        return;
    }
    sm.previous();
    res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
    res.send(sm.hasPrevious());
}

function getState(req, res) {
    res.send(req.cookies.quizzer ? (req.cookies.quizzer.state || {}) : {});
}

function processInput(req, res) {
    const input = req.body.input;
    const sm = createStateMachine(req);
    sm.processInput(input)
        .then(v => {
            res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
            res.send(sm.hasNext());
        })
        .catch(error => console.error(error));
}


app.get('/sm', (req, res) => {
    getOutput(req, res);
});

app.put('/sm', jsonParser, (req, res) => {
    processInput(req, res);
});

app.get('/sm/state', (req, res) => {
    getState(req, res);
});

app.put('/sm/next', (req, res) => {
    next(req, res);
});

app.put('/sm/previous', (req, res) => {
    previous(req, res);
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
