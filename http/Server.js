const tree = require('../programs/DecisionTree');
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
    var data = req.cookies.quizzer;
    if (!data) {
        data = { state: {} };
    }
    const sm = stateMachine(nodeRepository, preprocessors, data.state);
    data.root = data.root || "Name";
    const wrapper = {
        getData: function () {
            return JSON.parse(JSON.stringify(data));
        },
        getOutput: function () {
            return sm.getOutput();
        },
        processInput: function (input) {
            return sm.processInput(input).then(v => {
                data.root = sm.getCurrent();
                return Promise.resolve();
            })
        }
    };
    return sm.setRoot(data.root).then(v => wrapper);
}

function get(req, res) {
    createStateMachine(req)
        .then(sm => {
            res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
            res.send(sm.getOutput());
        })
        .catch(error => console.error(error));
}

function put(req, res) {
    const input = req.body.input;
    createStateMachine(req)
        .then(sm => sm.processInput(input).then(v => sm))
        .then(sm => {
            res.cookie('quizzer', sm.getData(), { maxAge: 900000, httpOnly: true });
            res.send(sm.getOutput());
        })
        .catch(error => console.error(error));
}


app.get('/sm', (req, res) => {
    get(req, res);
});

app.put('/sm', jsonParser, (req, res) => {
    put(req, res);
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
