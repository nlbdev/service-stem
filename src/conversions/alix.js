#!/usr/bin/env node
/*jshint esversion: 8 */

/**
 * ALIX Calculation:
 * Each type of element has a ALIX modifier, this modifier is multiplied with the amount of items of that type
 * resulting in a number that gives an idea of the complexity of the expression.
 *
 * ALIX = num * modifier
 */

module.exports = {
  GetDefaultIndexes: () => {
    return {
      'mn': 0,
      'mo': 0,
      'mi': 0,
      'mtext': 0,
      'mfrac': 0,
      'mroot': 0,
      'msqrt': 0,
      'mrow': 0,
      'mfenced': 0,
      'msubsup': 0,
      'munderover': 0,
      'munder': 0,
      'mover': 0,
      'msup': 0,
      'msub': 0,
      'mtd': 0,
      'mlabeledtr': 0,
      'mtr': 0,
      'mtable': 0,
      'mmultiscripts': 0
    };
  },
  GetDefaultModifiers: () => {
    return {
      // Not used for ALIX
      'mrow': 0,
      'mtd': 0,
      'mlabeledtr': 0,
      'mtr': 0,
      // Low diff
      'mn': 0.01,
      'mtext': 0.01,
      'mo': 0.05,
      'mfenced': 0.05,
      'mi': 0.09,
      // Medium diff
      'munder': 0.15,
      'mover': 0.15,
      'msup': 0.15,
      'msub': 0.15,
      'mmultiscripts': 0.15,
      'mfrac': 0.2,
      // Hard diff
      'mroot': 0.25,
      'msqrt': 0.25,
      'msubsup': 0.4,
      'munderover': 0.4,
      'mtable': 0.5
    };
  },
  GetALIX: (counts, modifiers) => {
    var alix = 0;
    Object.entries(counts).map(item => {
      if (item[1] > 0 || !isNaN(item[1]) || modifiers[item[0]] > 0) {
        alix += (item[1] * modifiers[item[0]]);
      }
    });

    return (alix * 100);
  }
};
