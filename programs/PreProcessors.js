'use strict'

const yes = /(yes|sure|yeah|positive)$/i;
const no = /(no|nope|nah|negative)$/i;

module.exports = (() => {

   return {
       YesNo: function(state, input) {
            if (!input) {
                return;
            }
           if (input.match(yes)) {
               return 'yes';
           } else if (input.match(no)) {
               return 'no';
           }
       }
   };
})();