'use strict'

module.exports = [
    {
        id: "DepartEuAirport",

        type: "YesNo",

        output: function (state) {
            return {
                type: "Question",
                text: `Did you depart from an EU airport, ${state.Name}?`
            }
        },

        process: function (state, input) {
            switch (input) {
                case "yes":
                    state.DepartEuAirport = true;
                    break;
                case "no":
                    state.DepartEuAirport = false;
                    break;
            }
        },

        next: function (state) {
            if (state.DepartEuAirport == true) {
                return "PresentAtCheckin";
            }
            if (state.DepartEuAirport == false) {
                return "ArriveEuAirport";
            }
        }
    },

    {
        id: "ArriveEuAirport",

        type: "YesNo",

        output: function (state) {
            return {
                type: "Question",
                text: `Did you arrive to an EU airport, ${state.Name}?`
            }
        },

        process: function (state, input) {
            switch (input) {
                case "yes":
                    state.ArriveEuAirport = true;
                    break;
                case "no":
                    state.ArriveEuAirport = false;
                    break;
            }
        },

        next: function (state) {
            if (state.ArriveEuAirport == true) {
                return "PresentAtCheckin";
            }
            if (state.ArriveEuAirport == false) {
                return "End";
            }
        }
    },

    {
        id: "PresentAtCheckin",

        type: "YesNo",

        output: function (state) {
            return {
                type: "Question",
                text: `Did you present yourself at checkin, ${state.Name}?`
            }
        },

        process: function (state, input) {
            switch (input) {
                case "yes":
                    state.PresentAtCheckin = true;
                    break;
                case "no":
                    state.PresentAtCheckin = false;
                    break;
            }
        },

        next: function (state) {
            if (state.PresentAtCheckin == true) {
                return "AdditionalData";
            }
            if (state.PresentAtCheckin == false) {
                return "AdditionalData";
            }
        }
    }
];
