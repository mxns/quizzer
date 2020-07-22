'use strict'

module.exports = [
    {
        id: "AdditionalData",

        process: function (state, input) {
            state.AdditionalData = "SomethingSomething";
        },

        next: function (state) {
            if (state.AdditionalData) {
                return "End"
            }
        }

    },

    {
        id: "End",

        output: function (state) {
            return {
                text: `Bye, ${state.Name}....`
            }
        },
    }
];
