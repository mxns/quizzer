'use strict'

module.exports = [
    {
        id: "Name",

        output: function (state) {
            return {
                type: "Question",
                text: "What is your name?"
            }
        },

        process: function (state, input) {
            if (input) {
                state.Name = input;
            }
        },

        next: function (state) {
            if (state.Name) {
                return "Hey";
            }
        }
    },

    {
        id: "Hey",

        output: function (state) {
            return {
                text: `Hey ${state.Name}!`
            }
        },

        next: function (state) {
            return "DepartEuAirport"
        }
    }
];
