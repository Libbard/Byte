/*@4.LAPIJ.1*/
(function (host) {
  'use strict';

  function inspect(value, depth, seen) {
    depth = depth || 0;
    seen = seen || [];
    var type = typeof value;

    if (value === null) return 'null';
    if (type === 'undefined') return 'undefined';
    if (type === 'number') return Object.is(value, -0) ? '-0' : String(value);
    if (type === 'boolean') return String(value);
    if (type === 'bigint') return String(value) + 'n';
    if (type === 'symbol') return String(value);
    if (type === 'string') return depth === 0 ? value : quote(value);
    if (type === 'function') {
      var name = value.name;
      /*@4.LAPIJ.2*/
      var isClass = /^\s*class\s/.test(Function.prototype.toString.call(value));
      return isClass ? '[class ' + (name || '(anonymous)') + ']'
        : name ? '[Function: ' + name + ']' : '[Function (anonymous)]';
    }

    for (var i = 0; i < seen.length; i += 1) if (seen[i] === value) return '[Circular *1]';
    if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';

    var next = seen.concat([value]);
    var tag = Object.prototype.toString.call(value);

    if (tag === '[object Date]') return isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
    if (tag === '[object RegExp]') return String(value);
    if (value instanceof Error) return String(value.stack ? String(value.stack).split('\n')[0] : value);

    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      var items = value.map(function (item) { return inspect(item, depth + 1, next); });
      return '[ ' + items.join(', ') + ' ]';
    }
    if (tag === '[object Map]') {
      if (!value.size) return 'Map(0) {}';
      var pairs = [];
      value.forEach(function (mapValue, mapKey) {
        pairs.push(inspect(mapKey, depth + 1, next) + ' => ' + inspect(mapValue, depth + 1, next));
      });
      return 'Map(' + value.size + ') { ' + pairs.join(', ') + ' }';
    }
    if (tag === '[object Set]') {
      if (!value.size) return 'Set(0) {}';
      var members = [];
      value.forEach(function (member) { members.push(inspect(member, depth + 1, next)); });
      return 'Set(' + value.size + ') { ' + members.join(', ') + ' }';
    }

    /*@4.LAPIJ.3*/
    var prefix = '';
    var proto = Object.getPrototypeOf(value);
    if (proto && proto.constructor && proto.constructor.name && proto.constructor.name !== 'Object') {
      prefix = proto.constructor.name + ' ';
    } else if (!proto) prefix = '[Object: null prototype] ';

    var keys = Object.keys(value);
    if (!keys.length) return prefix + '{}';
    var entries = keys.map(function (key) {
      var label = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : quote(key);
      return label + ': ' + inspect(value[key], depth + 1, next);
    });
    return prefix + '{ ' + entries.join(', ') + ' }';
  }

  function quote(text) {
    var escaped = String(text)
      .replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r');
    /*@4.LAPIJ.4*/
    return escaped.indexOf("'") === -1 ? "'" + escaped + "'" : '"' + escaped.replace(/"/g, '\\"') + '"';
  }

  host.GardenPLInspect = {
    inspect: inspect,
    /*@4.LAPIJ.5*/
    source: '(function(){var quote=' + quote.toString() + ';var inspect=' + inspect.toString() + ';return inspect;}())'
  };
})(typeof window !== 'undefined' ? window : globalThis);
