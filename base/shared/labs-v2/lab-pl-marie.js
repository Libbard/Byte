/*@4.LAPMJ.1*/
(function (global) {
  'use strict';

  var MEMORY_WORDS = 4096;
  var WORD_MASK = 0xFFFF;

  /*@4.LAPMJ.2*/
  var OPCODES = {
    JNS: 0x0, LOAD: 0x1, STORE: 0x2, ADD: 0x3, SUBT: 0x4,
    INPUT: 0x5, OUTPUT: 0x6, HALT: 0x7, SKIPCOND: 0x8, JUMP: 0x9,
    CLEAR: 0xA, ADDI: 0xB, JUMPI: 0xC, LOADI: 0xD, STOREI: 0xE
  };
  /*@4.LAPMJ.3*/
  var NO_OPERAND = { INPUT: 1, OUTPUT: 1, HALT: 1, CLEAR: 1 };

  function toSigned(value) {
    var word = value & WORD_MASK;
    return word & 0x8000 ? word - 0x10000 : word;
  }

  /**
   * يُجمّع نصَّ MARIE إلى ذاكرة.
   * @returns {{ok:boolean, memory?:Int32Array, labels?:Object, lineOf?:Object, errors?:Array}}
   */
  function assemble(source) {
    var lines = String(source).split('\n');
    var errors = [];
    var parsed = [];
    var address = 0;
    var labels = {};

    /*@4.LAPMJ.4*/
    lines.forEach(function (raw, index) {
      var text = raw.replace(/\/.*$/, '').trim();      /*@4.LAPMJ.5*/
      if (!text) return;
      var label = null;
      var comma = text.indexOf(',');
      if (comma !== -1) {
        label = text.slice(0, comma).trim().toUpperCase();
        text = text.slice(comma + 1).trim();
        if (!/^[A-Z_][A-Z0-9_]*$/.test(label)) {
          errors.push({ line: index + 1, message: 'اسمُ علامةٍ غيرُ صالح: ' + label });
          return;
        }
        if (labels[label] !== undefined) {
          errors.push({ line: index + 1, message: 'العلامة ' + label + ' معرَّفةٌ مرّتين' });
          return;
        }
      }
      if (!text) {
        if (label) labels[label] = address;
        return;
      }
      var parts = text.split(/\s+/);
      var mnemonic = parts[0].toUpperCase();
      var operand = parts.length > 1 ? parts.slice(1).join(' ') : null;

      if (mnemonic === 'ORG') {
        var origin = parseNumber(operand, 16);
        if (origin === null) { errors.push({ line: index + 1, message: 'ORG يحتاج عنواناً ست عشرياً' }); return; }
        address = origin;
        return;
      }
      if (label) labels[label] = address;
      parsed.push({ line: index + 1, address: address, mnemonic: mnemonic, operand: operand });
      address += 1;
      if (address > MEMORY_WORDS) errors.push({ line: index + 1, message: 'تجاوزَ البرنامجُ حجمَ الذاكرة' });
    });

    /*@4.LAPMJ.6*/
    var memory = new Int32Array(MEMORY_WORDS);
    var lineOf = {};
    parsed.forEach(function (item) {
      lineOf[item.address] = item.line;
      var mnemonic = item.mnemonic;
      if (mnemonic === 'DEC' || mnemonic === 'HEX') {
        var value = parseNumber(item.operand, mnemonic === 'DEC' ? 10 : 16);
        if (value === null) { errors.push({ line: item.line, message: mnemonic + ' يحتاج قيمةً صالحة' }); return; }
        memory[item.address] = value & WORD_MASK;
        return;
      }
      if (mnemonic === 'END') return;
      var opcode = OPCODES[mnemonic];
      if (opcode === undefined) { errors.push({ line: item.line, message: 'تعليمةٌ غيرُ معروفة: ' + mnemonic }); return; }
      if (NO_OPERAND[mnemonic]) {
        if (item.operand) errors.push({ line: item.line, message: mnemonic + ' لا تأخذ معاملاً' });
        memory[item.address] = opcode << 12;
        return;
      }
      if (!item.operand) { errors.push({ line: item.line, message: mnemonic + ' تحتاج معاملاً' }); return; }
      var target = item.operand.toUpperCase();
      var resolved = labels[target] !== undefined ? labels[target] : parseNumber(item.operand, 16);
      if (resolved === null) { errors.push({ line: item.line, message: 'معاملٌ مجهول: ' + item.operand }); return; }
      memory[item.address] = (opcode << 12) | (resolved & 0x0FFF);
    });

    if (errors.length) return { ok: false, errors: errors };
    return { ok: true, memory: memory, labels: labels, lineOf: lineOf, start: parsed.length ? parsed[0].address : 0 };
  }

  function parseNumber(text, radix) {
    if (text === null || text === undefined) return null;
    var trimmed = String(text).trim();
    var negative = trimmed.charAt(0) === '-';
    if (negative) trimmed = trimmed.slice(1);
    if (!trimmed.length) return null;
    var pattern = radix === 10 ? /^[0-9]+$/ : /^[0-9A-Fa-f]+$/;
    if (!pattern.test(trimmed)) return null;
    var value = parseInt(trimmed, radix);
    return negative ? -value : value;
  }

  /**
   * يُشغّل البرنامج.
   * @param {Int32Array} memory
   * @param {number[]} inputs قِيَمُ INPUT بالترتيب
   * @param {{maxSteps?:number, start?:number}} options
   */
  function run(memory, inputs, options) {
    var settings = options || {};
    /*@4.LAPMJ.7*/
    var maxSteps = settings.maxSteps || 200000;
    var state = {
      ac: 0, pc: settings.start || 0, ir: 0, mar: 0, mbr: 0,
      output: [], steps: 0, halted: false, error: null, inputAt: 0, trace: []
    };
    var queue = (inputs || []).slice();

    while (!state.halted) {
      if (state.steps >= maxSteps) {
        state.error = { kind: 'steps', message: 'تجاوزَ البرنامجُ ' + maxSteps + ' خطوة — غالباً حلقةٌ لا تنتهي.' };
        break;
      }
      if (state.pc < 0 || state.pc >= MEMORY_WORDS) {
        state.error = { kind: 'pc', message: 'عدّادُ البرنامج خرج عن الذاكرة عند ' + state.pc };
        break;
      }
      var pcBefore = state.pc;
      state.ir = memory[state.pc] & WORD_MASK;
      state.pc += 1;
      var opcode = (state.ir >> 12) & 0xF;
      var operand = state.ir & 0x0FFF;
      state.steps += 1;

      switch (opcode) {
        case OPCODES.LOAD:  state.ac = memory[operand] & WORD_MASK; break;
        case OPCODES.STORE: memory[operand] = state.ac & WORD_MASK; break;
        case OPCODES.ADD:   state.ac = (state.ac + memory[operand]) & WORD_MASK; break;
        case OPCODES.SUBT:  state.ac = (state.ac - memory[operand]) & WORD_MASK; break;
        case OPCODES.CLEAR: state.ac = 0; break;
        case OPCODES.INPUT:
          if (state.inputAt >= queue.length) {
            state.error = { kind: 'input', message: 'طلب البرنامجُ إدخالاً ولا مزيدَ في لوح «المدخلات».' };
            state.halted = true;
          } else {
            state.ac = queue[state.inputAt] & WORD_MASK;
            state.inputAt += 1;
          }
          break;
        case OPCODES.OUTPUT: state.output.push(toSigned(state.ac)); break;
        case OPCODES.HALT: state.halted = true; break;
        case OPCODES.SKIPCOND:
          /*@4.LAPMJ.8*/
          var signed = toSigned(state.ac);
          var condition = operand & 0x0C00;
          if ((condition === 0x000 && signed < 0) ||
              (condition === 0x400 && signed === 0) ||
              (condition === 0x800 && signed > 0)) state.pc += 1;
          break;
        case OPCODES.JUMP: state.pc = operand; break;
        case OPCODES.JNS:
          memory[operand] = pcBefore + 1;
          state.pc = operand + 1;
          break;
        case OPCODES.JUMPI: state.pc = memory[operand] & 0x0FFF; break;
        case OPCODES.LOADI: state.ac = memory[memory[operand] & 0x0FFF] & WORD_MASK; break;
        case OPCODES.STOREI: memory[memory[operand] & 0x0FFF] = state.ac & WORD_MASK; break;
        case OPCODES.ADDI: state.ac = (state.ac + memory[memory[operand] & 0x0FFF]) & WORD_MASK; break;
        default:
          state.error = { kind: 'opcode', message: 'رمزُ عمليةٍ غيرُ معروف: ' + opcode.toString(16).toUpperCase() };
          state.halted = true;
      }
      if (state.error && state.error.kind !== 'input') break;
    }
    state.acSigned = toSigned(state.ac);
    return state;
  }

  global.GardenMARIE = { assemble: assemble, run: run, OPCODES: OPCODES, MEMORY_WORDS: MEMORY_WORDS };
})(window);
