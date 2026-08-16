/*@4.LAPSJ3.1*/
(function () {
  'use strict';

  function set(words) {
    var out = {};
    String(words).split(/\s+/).forEach(function (word) { if (word) out[word] = 1; });
    return out;
  }
  function merge() {
    var out = {};
    for (var i = 0; i < arguments.length; i += 1) {
      var source = arguments[i] || {};
      for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
    }
    return out;
  }

  var NUM_C = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:[uUlLfFdDmM]{0,3})/;
  var NUM_PLAIN = /^(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/;

  var DQ = { open: '"', esc: true };
  var SQ = { open: "'", esc: true };
  var BQ = { open: '`', esc: true };
  /*@4.LAPSJ3.2*/
  var SQL_STR = { open: "'", esc: false, double: true };

  function rules(over) {
    return merge({
      line: ['//'], block: [['/*', '*/']], strings: [DQ, SQ],
      number: NUM_C, ident: /[A-Za-z_]/, identPart: /[A-Za-z0-9_]/,
      keywords: {}, types: {}, literals: set('true false null'), builtins: {},
      capitalType: false, fold: false, annotation: null, sigil: null,
      preproc: false, stringPrefix: null, semicolons: false, blockOpener: null
    }, over);
  }

  /*@4.LAPSJ3.3*/
  var CTRL = 'if else for while do switch case default break continue return goto try catch finally throw throws';

  var LANG = {};

  LANG.java = rules({
    keywords: set(CTRL + ' abstract assert class const enum extends final implements import instanceof interface native new package private protected public static strictfp super synchronized this transient volatile var yield record sealed permits'),
    types: set('boolean byte char double float int long short void String Integer Double Boolean Character Long Float Short Byte Object'),
    literals: set('true false null'),
    builtins: {},   /*@4.LAPSJ3.4*/
    capitalType: true, annotation: '@', semicolons: true
  });

  LANG.c = rules({
    keywords: set(CTRL + ' auto const extern inline register restrict sizeof static struct typedef union volatile _Bool'),
    types: set('char double float int long short signed unsigned void size_t FILE bool'),
    literals: set('NULL true false'),
    builtins: set('printf scanf malloc calloc realloc free strlen strcpy strcmp strcat memcpy memset fopen fclose fgets fputs puts putchar getchar sprintf sscanf qsort abs pow sqrt'),
    preproc: true, semicolons: true
  });

  LANG.cpp = rules({
    keywords: set(CTRL + ' auto class const constexpr delete explicit friend inline mutable namespace new noexcept nullptr operator private protected public register sizeof static static_cast dynamic_cast const_cast reinterpret_cast struct template this throw typedef typename union using virtual volatile'),
    types: set('bool char double float int long short signed unsigned void wchar_t string vector map set pair queue stack deque list array size_t ostream istream'),
    literals: set('true false nullptr NULL'),
    builtins: {},
    capitalType: true, preproc: true, semicolons: true
  });

  LANG.javascript = rules({
    keywords: set(CTRL + ' async await class const debugger delete export extends from function get import in instanceof let new of set static super this typeof var void with yield'),
    types: set('Array Object String Number Boolean Symbol Promise Map Set WeakMap WeakSet Date RegExp Error JSON Math BigInt'),
    literals: set('true false null undefined NaN Infinity'),
    builtins: {},
    strings: [DQ, SQ, BQ], capitalType: true
  });
  LANG.typescript = rules(merge(LANG.javascript, {
    keywords: merge(LANG.javascript.keywords, set('abstract as declare enum implements interface is keyof namespace private protected public readonly type any unknown never')),
    types: merge(LANG.javascript.types, set('string number boolean any void never unknown object'))
  }));

  LANG.php = rules({
    keywords: set(CTRL + ' abstract and array as class clone const declare echo elseif empty enddeclare endfor endforeach endif endswitch endwhile extends final fn foreach function global implements include include_once instanceof insteadof interface isset list namespace new or print private protected public require require_once static trait unset use var xor yield match'),
    types: set('int float string bool array object callable iterable mixed void self parent'),
    literals: set('true false null TRUE FALSE NULL'),
    builtins: set('count strlen str_replace substr explode implode array_map array_filter array_merge sprintf printf print_r var_dump in_array sort usort json_encode json_decode number_format date trim strtolower strtoupper'),
    sigil: '$', capitalType: true, semicolons: true
  });

  LANG.python = rules({
    line: ['#'], block: [], strings: [
      { open: '"""', esc: true }, { open: "'''", esc: true }, DQ, SQ
    ],
    keywords: set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'),
    types: set('int float str bool list dict set tuple bytes complex frozenset object type'),
    literals: set('True False None NotImplemented Ellipsis self cls'),
    builtins: set('print len range enumerate zip map filter sorted reversed sum min max abs round input open format join split strip append extend insert remove pop keys values items get isinstance super __init__ __name__ __main__'),
    stringPrefix: /^[rRbBuUfF]{1,2}$/, annotation: '@', capitalType: true, blockOpener: true
  });

  LANG.ruby = rules({
    line: ['#'], block: [['=begin', '=end']],
    keywords: set('alias and begin break case class def defined do each else elsif end ensure for if in module next nil not or redo rescue retry return self super then undef unless until when while yield attr_accessor attr_reader require'),
    types: set('Integer String Array Hash Symbol Float Range Proc'),
    literals: set('true false nil'),
    builtins: set('puts print p gets map select reject each_with_index length size push pop first last sort sort_by inject reduce to_s to_i to_a'),
    capitalType: true
  });

  LANG.lua = rules({
    line: ['--'], block: [['--[[', ']]']],
    keywords: set('and break do else elseif end for function goto if in local not or repeat return then until while'),
    types: set(''), literals: set('true false nil'),
    builtins: set('print type pairs ipairs tostring tonumber table string math io os insert remove concat sort len sub gsub find format floor ceil random'),
    number: NUM_PLAIN
  });

  LANG.r = rules({
    line: ['#'], block: [],
    keywords: set('if else for while repeat function return break next in TRUE FALSE NULL Inf NaN NA library require'),
    types: set('numeric character logical integer double vector list matrix data.frame factor'),
    literals: set('TRUE FALSE NULL NA Inf NaN T F'),
    builtins: set('cat print paste paste0 length sum mean median sd seq rep c sapply lapply vapply apply nrow ncol head tail sort order which max min round'),
    number: NUM_PLAIN
  });

  LANG.perl = rules({
    line: ['#'], block: [],
    keywords: set('use strict warnings my our local sub if elsif else unless while until for foreach do last next redo return package require BEGIN END'),
    types: set(''), literals: set('undef'),
    builtins: set('print printf say push pop shift unshift splice keys values exists delete defined scalar sort reverse join split length substr index sprintf uc lc chomp die warn'),
    sigil: '$@%'
  });

  LANG.elixir = rules({
    line: ['#'], block: [],
    keywords: set('def defmodule defp defmacro do end if else unless case cond when fn for with try rescue catch after raise import alias require use receive send spawn'),
    types: set(''), literals: set('true false nil'),
    builtins: set('IO puts inspect Enum map filter reduce reverse sort each String List Map Integer Kernel length'),
    capitalType: true
  });

  LANG.go = rules({
    keywords: set('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'),
    types: set('bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr'),
    literals: set('true false nil iota'),
    builtins: set('append cap close copy delete len make new panic print println recover'),
    strings: [DQ, SQ, BQ], capitalType: false
  });

  LANG.rust = rules({
    keywords: set('as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while'),
    types: set('bool char f32 f64 i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize str String Vec Option Result HashMap Box'),
    literals: set('true false None Some Ok Err'),
    builtins: set('println print format vec push pop len iter collect map filter unwrap expect new to_string'),
    capitalType: true, annotation: '#', semicolons: false
  });

  LANG.kotlin = rules({
    keywords: set(CTRL + ' as by class companion const constructor data delegate enum external fun get import in infix init inline interface internal is lateinit noinline null object open operator out override package private protected public reified sealed set super suspend tailrec this typealias val var vararg when where'),
    types: set('Int Long Short Byte Double Float Boolean Char String Unit Any Nothing List Map Set Array MutableList'),
    literals: set('true false null'),
    builtins: set('println print listOf mutableListOf mapOf setOf arrayOf forEach map filter fold reduce sortedBy first last size main'),
    capitalType: true, annotation: '@'
  });

  LANG.csharp = rules({
    keywords: set(CTRL + ' abstract as base checked class const delegate enum event explicit extern fixed foreach implicit in interface internal is lock namespace new operator out override params private protected public readonly ref sealed sizeof stackalloc static struct this typeof unchecked unsafe using var virtual volatile where yield async await get set'),
    types: set('bool byte char decimal double float int long object sbyte short string uint ulong ushort void dynamic List Dictionary Array String Int32'),
    literals: set('true false null'),
    builtins: {},
    capitalType: true, annotation: '[', semicolons: true
  });

  LANG.scala = rules({
    keywords: set(CTRL + ' abstract case class def extends final forSome implicit import lazy match new object override package private protected sealed super this trait type val var with yield'),
    types: set('Int Long Double Float Boolean Char String Unit Any AnyRef Nothing List Map Set Array Option Some None Seq Vector'),
    literals: set('true false null'),
    builtins: set('println print map filter foldLeft reduce head tail length size sorted toList mkString main'),
    capitalType: true, annotation: '@'
  });

  LANG.groovy = rules({
    keywords: set(CTRL + ' abstract as assert class def enum extends final implements import in instanceof interface new package private protected public static super this trait'),
    types: set('boolean byte char double float int long short void String List Map Set BigDecimal'),
    literals: set('true false null'),
    builtins: set('println print each collect findAll inject sort size length toString it'),
    strings: [DQ, SQ, BQ], capitalType: true, annotation: '@'
  });

  LANG.haskell = rules({
    line: ['--'], block: [['{-', '-}']],
    keywords: set('case class data default deriving do else foreign if import in infix infixl infixr instance let module newtype of then type where'),
    types: set('Int Integer Float Double Char String Bool Maybe Either IO Ordering'),
    literals: set('True False Nothing Just LT EQ GT'),
    builtins: set('putStrLn putStr print show read map filter foldr foldl zip length head tail reverse sum product concat mapM_ return main'),
    capitalType: true, number: NUM_PLAIN
  });

  LANG.lisp = rules({
    line: [';'], block: [['#|', '|#']], strings: [DQ],
    keywords: set('defun defvar defparameter defmacro let let* lambda if cond when unless setq setf loop do dolist dotimes progn return-from case and or not'),
    types: set(''), literals: set('t nil'),
    builtins: set('format print princ write-line list car cdr cons append length reverse mapcar apply funcall first rest nth remove sort'),
    ident: /[A-Za-z_*+\-\/<>=!?]/, identPart: /[A-Za-z0-9_*+\-\/<>=!?]/, number: NUM_PLAIN
  });

  LANG.pascal = rules({
    line: ['//'], block: [['{', '}'], ['(*', '*)']], strings: [SQ],
    keywords: set('and array begin case const div do downto else end file for function goto if in label mod nil not of or packed procedure program record repeat set then to type until var while with uses'),
    types: set('integer real boolean char string byte word longint double text'),
    literals: set('true false nil'),
    builtins: set('write writeln read readln length copy pos inc dec abs sqr sqrt round trunc ord chr'),
    fold: true, number: NUM_PLAIN, semicolons: false
  });

  LANG.sql = rules({
    line: ['--'], block: [['/*', '*/']], strings: [SQL_STR, DQ],
    keywords: set('select from where insert into values update set delete create table drop alter add column primary key foreign references constraint unique check default not null distinct order by group having join inner left right outer full cross on as and or in between like limit offset union all exists case when then else end with recursive begin commit rollback transaction index view trigger procedure if is asc desc'),
    types: set('int integer smallint bigint decimal numeric real double float char varchar text blob date time datetime timestamp boolean serial'),
    literals: set('true false null'),
    builtins: set('count sum avg min max round abs coalesce ifnull nullif upper lower substr substring length trim replace cast strftime date julianday row_number rank dense_rank over partition'),
    fold: true, number: NUM_PLAIN, semicolons: true
  });

  /*@4.LAPSJ3.5*/

  LANG.bash = rules({
    line: ['#'], block: [], strings: [DQ, SQ],
    keywords: set('if then elif else fi for while until do done case esac function in select break continue return exit local export readonly declare typeset shift source eval exec trap set unset shopt'),
    types: set(''), literals: set('true false'),
    builtins: set('echo printf read cd pwd ls cat grep sed awk cut sort uniq head tail wc test expr let mkdir rm cp mv touch chmod find xargs tr date basename dirname seq sleep wait kill'),
    sigil: '$', number: NUM_PLAIN
  });

  /*@4.LAPSJ3.6*/
  LANG.erlang = rules({
    line: ['%'], block: [], strings: [DQ],
    keywords: set('after and andalso band begin bnot bor bsl bsr bxor case catch cond div end fun if let not of or orelse receive rem try when xor module export import define record behaviour spec'),
    types: set(''), literals: set('true false undefined ok error nil'),
    builtins: set('io format lists maps length hd tl reverse map filter foldl foldr seq sort sum nth spawn self setopts atom_to_list integer_to_list list_to_integer binary_to_list'),
    capitalType: false, number: NUM_PLAIN
  });

  LANG.fortran = rules({
    line: ['!'], block: [], strings: [DQ, SQ],
    keywords: set('program end subroutine function module use implicit none parameter dimension allocatable allocate deallocate if then else elseif endif do enddo while select case default exit cycle call return contains intent result stop print read write open close format data common save recursive pure elemental type interface public private'),
    types: set('integer real complex character logical double precision'),
    literals: set('true false'),
    builtins: set('print write read allocate size sum product maxval minval abs sqrt exp log sin cos tan mod trim adjustl len index reshape matmul dot_product achar iachar'),
    number: NUM_PLAIN
  });

  LANG.ocaml = rules({
    line: [], block: [['(*', '*)']], strings: [DQ],
    keywords: set('and as assert begin class do done downto else end exception external for fun function if in include inherit initializer lazy let match method module mutable new nonrec object of open private rec sig struct then to try type val virtual when while with'),
    types: set('int float string bool char unit list array option ref exn bytes'),
    literals: set('true false None Some'),
    builtins: set('print_endline print_string print_int print_newline Printf printf sprintf List Array String Hashtbl map filter fold_left fold_right length rev iter compare ignore failwith'),
    capitalType: true, number: NUM_PLAIN
  });

  LANG.octave = rules({
    line: ['%', '#'], block: [['%{', '%}']], strings: [SQ, DQ],
    keywords: set('function endfunction return if elseif else end endif for endfor while endwhile do until switch case otherwise endswitch break continue global persistent try catch end_try_catch unwind_protect unwind_protect_cleanup'),
    types: set(''), literals: set('true false Inf NaN NA pi e eps'),
    builtins: set('disp printf fprintf sprintf size length numel zeros ones eye rand randn linspace sum prod cumsum mean median mode std var max min sort find any all abs sqrt exp log floor ceil round mod rem num2str str2num strcat strsplit strrep isempty error input fflush'),
    number: NUM_PLAIN
  });

  /*@4.LAPSJ3.7*/
  LANG.cobol = rules({
    line: ['*>'], block: [], strings: [DQ, SQ],
    keywords: merge(
      set('IDENTIFICATION DIVISION PROGRAM-ID ENVIRONMENT DATA WORKING-STORAGE PROCEDURE SECTION FILE CONFIGURATION INPUT-OUTPUT PIC PICTURE VALUE OCCURS TIMES DISPLAY ACCEPT MOVE TO FROM ADD SUBTRACT MULTIPLY DIVIDE COMPUTE GIVING BY IF ELSE END-IF PERFORM VARYING UNTIL END-PERFORM STOP RUN GO EVALUATE WHEN END-EVALUATE OPEN CLOSE READ WRITE CALL USING EXIT REDEFINES'),
      set('identification division program-id environment data working-storage procedure section pic picture value occurs times display accept move to from add subtract multiply divide compute giving by if else end-if perform varying until end-perform stop run evaluate when end-evaluate open close read write call using exit')),
    types: set('COMP COMP-3 BINARY comp comp-3 binary'),
    literals: set('ZERO ZEROS ZEROES SPACE SPACES HIGH-VALUES LOW-VALUES TRUE FALSE zero zeros space spaces true false'),
    builtins: {},
    ident: /[A-Za-z]/, identPart: /[A-Za-z0-9-]/, number: NUM_PLAIN
  });

  /*@4.LAPSJ3.8*/
  LANG.marie = rules({
    line: ['/'], block: [], strings: [],
    keywords: set('load store add subt input output halt skipcond jump jns jumpi loadi storei addi clear'),
    types: set('dec hex org end'), literals: {},
    fold: true, number: /^[0-9A-Fa-f]+/, ident: /[A-Za-z_]/, identPart: /[A-Za-z0-9_]/
  });

  var HTML = { line: [], block: [['<!--', '-->']] };

  /*@4.LAPSJ3.9*/
  function scan(source, R) {
    var tokens = [], at = 0, n = source.length;
    var issues = [];
    var previous = '', beforePrevious = '';

    function push(type, start, end) {
      if (end <= start) return;
      tokens.push({ t: type, s: start, e: end });
      if (type !== 'sp' && type !== 'com') {
        beforePrevious = previous;
        previous = source.slice(start, end);
      }
    }
    function startsWith(text) { return source.substr(at, text.length) === text; }

    while (at < n) {
      var ch = source[at];

      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        var space = at + 1;
        while (space < n && /\s/.test(source[space])) space += 1;
        push('sp', at, space); at = space; continue;
      }

      var handled = false;

      /*@4.LAPSJ3.10*/
      if (R.sigil === '$' && ch === '<' && source.substr(at, 5) === '<?php') {
        push('ann', at, at + 5); at += 5; continue;
      }
      if (R.sigil === '$' && ch === '?' && source.substr(at, 2) === '?>') {
        push('ann', at, at + 2); at += 2; continue;
      }

      for (var l = 0; l < R.line.length; l += 1) {
        if (startsWith(R.line[l])) {
          var endLine = source.indexOf('\n', at);
          if (endLine < 0) endLine = n;
          push('com', at, endLine); at = endLine; handled = true; break;
        }
      }
      if (handled) continue;

      for (var b = 0; b < R.block.length; b += 1) {
        if (startsWith(R.block[b][0])) {
          var closer = R.block[b][1];
          var endBlock = source.indexOf(closer, at + R.block[b][0].length);
          if (endBlock < 0) {
            issues.push({ start: at, end: n, kind: 'unterminated-comment' });
            push('com', at, n); at = n;
          } else {
            push('com', at, endBlock + closer.length); at = endBlock + closer.length;
          }
          handled = true; break;
        }
      }
      if (handled) continue;

      /*@4.LAPSJ3.11*/
      var prefixLength = 0;
      if (R.stringPrefix && R.ident.test(ch)) {
        var scanPrefix = at;
        while (scanPrefix < n && R.identPart.test(source[scanPrefix])) scanPrefix += 1;
        var word = source.slice(at, scanPrefix);
        if (R.stringPrefix.test(word) && scanPrefix < n && (source[scanPrefix] === '"' || source[scanPrefix] === "'")) {
          prefixLength = word.length;
        }
      }

      var quoteAt = at + prefixLength;
      for (var s = 0; s < R.strings.length; s += 1) {
        var style = R.strings[s];
        if (source.substr(quoteAt, style.open.length) !== style.open) continue;
        var cursor = quoteAt + style.open.length;
        var closed = false;
        while (cursor < n) {
          if (style.esc && source[cursor] === '\\') { cursor += 2; continue; }
          if (source.substr(cursor, style.open.length) === style.open) {
            /*@4.LAPSJ3.12*/
            if (style.double && source.substr(cursor + style.open.length, style.open.length) === style.open) {
              cursor += style.open.length * 2; continue;
            }
            cursor += style.open.length; closed = true; break;
          }
          /*@4.LAPSJ3.13*/
          if (source[cursor] === '\n' && style.open.length === 1) break;
          cursor += 1;
        }
        if (!closed) issues.push({ start: at, end: cursor, kind: 'unterminated-string' });
        push('str', at, cursor); at = cursor; handled = true; break;
      }
      if (handled) continue;

      if (R.preproc && ch === '#' && (at === 0 || source[at - 1] === '\n' || /^[ \t]*$/.test(source.slice(source.lastIndexOf('\n', at - 1) + 1, at)))) {
        var endDirective = source.indexOf('\n', at);
        if (endDirective < 0) endDirective = n;
        push('ann', at, endDirective); at = endDirective; continue;
      }

      if (R.annotation && ch === R.annotation && R.annotation !== '[') {
        var endAnn = at + 1;
        while (endAnn < n && R.identPart.test(source[endAnn])) endAnn += 1;
        if (endAnn > at + 1) { push('ann', at, endAnn); at = endAnn; continue; }
      }

      if (R.sigil && R.sigil.indexOf(ch) !== -1) {
        var endVar = at + 1;
        while (endVar < n && R.identPart.test(source[endVar])) endVar += 1;
        if (endVar > at + 1) { push('var', at, endVar); at = endVar; continue; }
      }

      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source[at + 1] || ''))) {
        var numMatch = R.number.exec(source.slice(at));
        if (numMatch) { push('num', at, at + numMatch[0].length); at += numMatch[0].length; continue; }
      }

      if (R.ident.test(ch)) {
        var endWord = at;
        while (endWord < n && R.identPart.test(source[endWord])) endWord += 1;
        var text = source.slice(at, endWord);
        push(classify(text, source, endWord, R, previous, beforePrevious), at, endWord);
        at = endWord; continue;
      }

      if ('+-*/%=<>!&|^~?:'.indexOf(ch) !== -1) {
        var endOp = at;
        while (endOp < n && '+-*/%=<>!&|^~?:'.indexOf(source[endOp]) !== -1) endOp += 1;
        push('op', at, endOp); at = endOp; continue;
      }

      push('punc', at, at + 1); at += 1;
    }
    return { tokens: tokens, issues: issues };
  }

  /*@4.LAPSJ3.14*/
  var DECLARE = set('class interface struct enum new extends implements record trait object instanceof typedef namespace defmodule data type');
  function classify(word, source, after, R, previous, beforePrevious) {
    var key = R.fold ? word.toLowerCase() : word;
    if (R.keywords[key]) {
      /*@4.LAPSJ3.15*/
      return 'kw';
    }
    if (R.types[key]) return 'type';
    if (R.literals[key]) return 'lit';

    var cursor = after;
    while (cursor < source.length && (source[cursor] === ' ' || source[cursor] === '\t')) cursor += 1;
    var next = source[cursor];

    /*@4.LAPSJ3.16*/
    if (next === '(') return 'fn';
    /*@4.LAPSJ3.17*/
    if (previous === 'def' || previous === 'fun' || previous === 'func' || previous === 'sub' || previous === 'fn') return 'fn';
    if (DECLARE[previous] || (R.fold && DECLARE[String(previous).toLowerCase()])) return 'type';
    if (R.capitalType && /^[A-Z]/.test(word)) return 'type';
    if (R.builtins[word]) return 'fn';
    if (beforePrevious === 'import' || previous === 'import' || previous === 'package') return 'type';
    return 'id';
  }

  /*@4.LAPSJ3.18*/
  function scanHtml(source) {
    var tokens = [], at = 0, n = source.length, issues = [];
    function push(type, start, end) { if (end > start) tokens.push({ t: type, s: start, e: end }); }

    while (at < n) {
      if (source.substr(at, 4) === '<!--') {
        var endComment = source.indexOf('-->', at);
        if (endComment < 0) { push('com', at, n); at = n; continue; }
        push('com', at, endComment + 3); at = endComment + 3; continue;
      }
      if (source[at] === '<') {
        var endTag = source.indexOf('>', at);
        if (endTag < 0) { push('tag', at, n); at = n; continue; }
        scanTag(source, at, endTag + 1, push);
        var head = source.slice(at, endTag + 1);
        var name = (/^<\s*([A-Za-z][A-Za-z0-9-]*)/.exec(head) || [])[1];
        /*@4.LAPSJ3.19*/
        var opening = head.charAt(1) !== '/' && head.slice(-2) !== '/>';
        at = endTag + 1;
        /*@4.LAPSJ3.20*/
        if (opening && (name === 'script' || name === 'style')) {
          var close = source.toLowerCase().indexOf('</' + name, at);
          if (close < 0) close = n;
          var inner = source.slice(at, close);
          var sub = name === 'script' ? scan(inner, LANG.javascript) : scanCss(inner);
          sub.tokens.forEach(function (token) { push(token.t, at + token.s, at + token.e); });
          at = close;
        }
        continue;
      }
      var nextTag = source.indexOf('<', at);
      if (nextTag < 0) nextTag = n;
      push('id', at, nextTag); at = nextTag;
    }
    return { tokens: tokens, issues: issues };
  }
  function scanTag(source, from, to, push) {
    var at = from;
    var head = /^<\/?\s*[A-Za-z][A-Za-z0-9-]*|^<!\w+/.exec(source.slice(from, to));
    if (!head) { push('punc', from, to); return; }
    push('tag', from, from + head[0].length);
    at = from + head[0].length;
    while (at < to) {
      var ch = source[at];
      if (/\s/.test(ch)) { at += 1; continue; }
      if (ch === '"' || ch === "'") {
        var end = source.indexOf(ch, at + 1);
        if (end < 0 || end >= to) { push('str', at, to); return; }
        push('str', at, end + 1); at = end + 1; continue;
      }
      if (/[A-Za-z_:@]/.test(ch)) {
        var endName = at;
        while (endName < to && /[A-Za-z0-9_:.\-]/.test(source[endName])) endName += 1;
        push('attr', at, endName); at = endName; continue;
      }
      push(ch === '>' || ch === '/' ? 'tag' : 'op', at, at + 1); at += 1;
    }
  }
  function scanCss(source) {
    var tokens = [], at = 0, n = source.length;
    function push(type, start, end) { if (end > start) tokens.push({ t: type, s: start, e: end }); }
    while (at < n) {
      if (source.substr(at, 2) === '/*') {
        var endComment = source.indexOf('*/', at);
        if (endComment < 0) endComment = n - 2;
        push('com', at, endComment + 2); at = endComment + 2; continue;
      }
      if (source[at] === '"' || source[at] === "'") {
        var quote = source[at], endString = source.indexOf(quote, at + 1);
        if (endString < 0) endString = n - 1;
        push('str', at, endString + 1); at = endString + 1; continue;
      }
      if (source[at] === '{' || source[at] === '}' || source[at] === ';' || source[at] === ':') {
        push('punc', at, at + 1); at += 1; continue;
      }
      var chunk = /^[^{};:"'\/]+/.exec(source.slice(at));
      if (!chunk) { push('punc', at, at + 1); at += 1; continue; }
      var text = chunk[0];
      /*@4.LAPSJ3.21*/
      var before = source.lastIndexOf('{', at) > source.lastIndexOf('}', at);
      push(before ? (source.lastIndexOf(':', at) > source.lastIndexOf(';', at) ? 'num' : 'attr') : 'tag', at, at + text.length);
      at += text.length;
    }
    return { tokens: tokens, issues: [] };
  }

  /*@4.LAPSJ3.22*/
  function esc(text) {
    return String(text).replace(/[&<>]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
    });
  }
  var CLASS = {
    kw: 'tok-key', type: 'tok-typ', lit: 'tok-lit', num: 'tok-num', str: 'tok-str',
    com: 'tok-com', fn: 'tok-fn', op: 'tok-op', var: 'tok-var', ann: 'tok-ann',
    tag: 'tok-tag', attr: 'tok-attr', punc: '', id: '', sp: ''
  };

  /**
   * @param {string} source
   * @param {string} langId
   * @param {Array<{start:number,end:number,severity:string}>} marks
   */
  function render(source, langId, marks) {
    var R = LANG[langId];
    var result = langId === 'web' ? scanHtml(source) : scan(source, R || LANG.javascript);
    var ranges = (marks || []).filter(function (mark) { return mark.end > mark.start; });
    var html = '';
    /*@4.LAPSJ3.23*/
    var cursor = 0;
    var tokens = result.tokens.slice().sort(function (a, b) { return a.s - b.s; });
    var filled = [];
    tokens.forEach(function (token) {
      if (token.s > cursor) filled.push({ t: 'gap', s: cursor, e: token.s });
      if (token.e > cursor) { filled.push(token); cursor = token.e; }
    });
    if (cursor < source.length) filled.push({ t: 'gap', s: cursor, e: source.length });
    filled.forEach(function (token) {
      var className = CLASS[token.t] || '';
      /*@4.LAPSJ3.24*/
      var cuts = [token.s, token.e];
      ranges.forEach(function (mark) {
        if (mark.start > token.s && mark.start < token.e) cuts.push(mark.start);
        if (mark.end > token.s && mark.end < token.e) cuts.push(mark.end);
      });
      cuts = cuts.sort(function (a, b) { return a - b; });
      for (var i = 0; i < cuts.length - 1; i += 1) {
        var from = cuts[i], to = cuts[i + 1];
        if (to <= from) continue;
        var hit = null;
        for (var m = 0; m < ranges.length; m += 1) {
          if (ranges[m].start <= from && ranges[m].end >= to) { hit = ranges[m]; break; }
        }
        var badge = !hit ? '' : hit.severity === 'warn' ? 'pl-sq-warn' : hit.severity === 'flash' ? 'pl-flash' : 'pl-sq';
        var classes = className + (badge ? (className ? ' ' : '') + badge : '');
        var text = esc(source.slice(from, to));
        html += classes ? '<span class="' + classes + '">' + text + '</span>' : text;
      }
    });
    return html;
  }

  /*@4.LAPSJ3.25*/
  var OPEN = { '(': ')', '[': ']', '{': '}' };
  var CLOSE = { ')': '(', ']': '[', '}': '{' };

  function lineOf(source, offset) {
    var line = 1;
    for (var i = 0; i < offset && i < source.length; i += 1) if (source[i] === '\n') line += 1;
    return line;
  }

  function diagnose(source, langId) {
    var out = [];
    if (!source.trim()) return out;
    var R = LANG[langId];
    var result = langId === 'web' ? scanHtml(source) : scan(source, R || LANG.javascript);

    result.issues.forEach(function (issue) {
      out.push({
        start: issue.start, end: Math.min(issue.end, issue.start + 40), severity: 'err',
        line: lineOf(source, issue.start),
        ar: issue.kind === 'unterminated-string' ? 'نصٌّ لم يُغلق — ينقص علامةُ اقتباسٍ في آخره' : 'تعليقٌ لم يُغلق — ينقص `*/`',
        en: issue.kind === 'unterminated-string' ? 'Unterminated string — a closing quote is missing' : 'Unterminated comment — `*/` is missing'
      });
    });

    /*@4.LAPSJ3.26*/
    if (langId !== 'web' && langId !== 'marie') {
      var stack = [];
      result.tokens.forEach(function (token) {
        if (token.t !== 'punc' && token.t !== 'op') return;
        var text = source.slice(token.s, token.e);
        if (text.length !== 1) return;
        if (OPEN[text]) stack.push({ ch: text, at: token.s });
        else if (CLOSE[text]) {
          if (!stack.length) {
            out.push({ start: token.s, end: token.s + 1, severity: 'err', line: lineOf(source, token.s),
              ar: 'قوسُ إغلاقٍ زائدٌ «' + text + '» بلا قوسٍ يفتحه',
              en: 'Extra closing “' + text + '” with nothing it closes' });
          } else if (stack[stack.length - 1].ch !== CLOSE[text]) {
            var top = stack.pop();
            out.push({ start: token.s, end: token.s + 1, severity: 'err', line: lineOf(source, token.s),
              ar: 'قوسٌ غيرُ متطابق: فُتح «' + top.ch + '» وأُغلق بـ«' + text + '»',
              en: 'Mismatched bracket: “' + top.ch + '” closed with “' + text + '”' });
          } else stack.pop();
        }
      });
      stack.forEach(function (item) {
        out.push({ start: item.at, end: item.at + 1, severity: 'err', line: lineOf(source, item.at),
          ar: 'قوسٌ «' + item.ch + '» لم يُغلق',
          en: 'Bracket “' + item.ch + '” is never closed' });
      });
    }

    /*@4.LAPSJ3.27*/
    var lines = source.split('\n');
    var starts = [], running = 0;
    lines.forEach(function (text) { starts.push(running); running += text.length + 1; });
    function codeOf(index) {
      var from = starts[index], to = from + lines[index].length, text = '';
      result.tokens.forEach(function (token) {
        if (token.e <= from || token.s >= to) return;
        if (token.t === 'com') return;
        var slice = source.slice(Math.max(token.s, from), Math.min(token.e, to));
        text += token.t === 'str' ? slice.replace(/[^\s]/g, 'x') : slice;
      });
      return text;
    }

    if (langId === 'python') pythonRules(source, lines, starts, codeOf, out);
    if (R && R.semicolons) semicolonRule(source, lines, starts, codeOf, out, langId);
    entryRule(source, langId, out);

    /*@4.LAPSJ3.28*/
    var hardLines = {};
    out.forEach(function (item) { if (item.severity === 'err') hardLines[item.line] = 1; });
    out = out.filter(function (item) { return item.severity === 'err' || !hardLines[item.line]; });

    return out.sort(function (a, b) { return a.start - b.start; });
  }

  var BLOCK_HEADS = /^(if|elif|else|for|while|def|class|try|except|finally|with|match|case)\b/;
  function pythonRules(source, lines, starts, codeOf, out) {
    var depth = 0;
    lines.forEach(function (raw, index) {
      var code = codeOf(index);
      var trimmed = code.trim();
      var openBefore = depth;
      for (var i = 0; i < code.length; i += 1) {
        if (OPEN[code[i]]) depth += 1;
        else if (CLOSE[code[i]]) depth -= 1;
      }
      if (openBefore !== 0 || !trimmed || depth !== 0) return;
      if (!BLOCK_HEADS.test(trimmed)) return;
      if (/:\s*$/.test(trimmed) || /:\s*\S/.test(trimmed)) return;
      if (/\\$/.test(trimmed)) return;
      out.push({
        start: starts[index] + raw.replace(/\s+$/, '').length - 1,
        end: starts[index] + raw.replace(/\s+$/, '').length,
        severity: 'err', line: index + 1,
        ar: 'ينقص «:» في آخر السطر — كلُّ كتلةٍ في بايثون تبدأ بنقطتين',
        en: 'A “:” is missing at the end — every Python block header ends with one'
      });
    });
  }

  var CONTROL_HEAD = /^(if|else|for|while|switch|catch|do|try|finally|foreach|elseif|case|default|public|private|protected|static|final|abstract|class|struct|enum|interface|namespace|using|package|import|template|typedef|union|def|function|fun|func)\b/;
  function semicolonRule(source, lines, starts, codeOf, out, langId) {
    if (langId === 'sql') return sqlRule(lines, starts, codeOf, out);
    for (var index = 0; index < lines.length; index += 1) {
      var code = codeOf(index).trim();
      if (!code || CONTROL_HEAD.test(code)) continue;
      if (/[;{}(\[,:\\+\-*/%=&|<>?.]$/.test(code)) continue;
      /*@4.LAPSJ3.29*/
      var looksComplete = /=/.test(code) || /\)$/.test(code) || /^(return|break|continue|throw|delete|echo|print)\b/.test(code);
      if (!looksComplete) continue;
      var next = '';
      for (var ahead = index + 1; ahead < lines.length; ahead += 1) {
        next = codeOf(ahead).trim();
        if (next) break;
      }
      if (next && /^[.){\]+\-*/%=&|<>?:,]/.test(next)) continue;
      if (!next) continue;
      var end = starts[index] + lines[index].replace(/\s+$/, '').length;
      out.push({
        start: Math.max(starts[index], end - 1), end: end, severity: 'warn', line: index + 1,
        ar: 'يبدو أن «;» ناقصةٌ في آخر هذا السطر',
        en: 'A “;” looks missing at the end of this line'
      });
    }
  }
  function sqlRule(lines, starts, codeOf, out) {
    var statements = 0;
    for (var index = 0; index < lines.length; index += 1) {
      var code = codeOf(index).trim();
      if (/^(select|insert|update|delete|create|drop|alter|with)\b/i.test(code)) statements += 1;
      void statements;
    }
    var last = '';
    for (var back = lines.length - 1; back >= 0; back -= 1) {
      last = codeOf(back).trim();
      if (last) {
        if (!/;$/.test(last)) {
          var end = starts[back] + lines[back].replace(/\s+$/, '').length;
          out.push({ start: Math.max(starts[back], end - 1), end: end, severity: 'warn', line: back + 1,
            ar: 'الاستعلامُ الأخيرُ بلا «;» — أنهِه بفاصلةٍ منقوطة',
            en: 'The last statement has no “;” — end it with a semicolon' });
        }
        break;
      }
    }
  }

  /*@4.LAPSJ3.30*/
  function entryRule(source, langId, out) {
    var mark = function (ar, en) {
      out.push({ start: 0, end: 0, severity: 'warn', line: 1, ar: ar, en: en });
    };
    if (langId === 'java') {
      if (!/\bstatic\s+void\s+main\s*\(/.test(source)) {
        mark('لا توجد دالّةُ `main` — ولن يجد المترجمُ من أين يبدأ',
          'There is no `main` method — the compiler will not know where to start');
      } else if (!/\bclass\s+Main\b/.test(source)) {
        mark('الصنفُ العامُّ يجب أن يُسمّى `Main` هنا — فالملفُّ يُحفظ باسم Main.java',
          'The public class must be named `Main` here — the file is saved as Main.java');
      }
    }
    if ((langId === 'c' || langId === 'cpp') && !/\bmain\s*\(/.test(source)) {
      mark('لا توجد دالّةُ `main` — البرنامجُ لن يُربط',
        'There is no `main` function — the program will not link');
    }
    if (langId === 'php' && !/<\?php/.test(source)) {
      mark('يبدأ ملفُّ PHP بـ`<?php` وإلا طُبع الكودُ نصّاً',
        'A PHP file starts with `<?php`, otherwise the code is printed as text');
    }
    if (langId === 'go' && !/\bpackage\s+main\b/.test(source)) {
      mark('ينقص `package main` في أوّل الملفّ', 'The file must start with `package main`');
    }
  }

  /*@4.LAPSJ3.31*/
  function realJavaScript(source) {
    try {
      /* eslint-disable no-new-func */
      new Function(source);
      return null;
    } catch (error) {
      if (!(error instanceof SyntaxError)) return null;
      var line = 0;
      var stack = String(error.stack || '');
      var found = /<anonymous>:(\d+):(\d+)/.exec(stack);
      /*@4.LAPSJ3.32*/
      if (found) line = Math.max(1, parseInt(found[1], 10) - 2);
      return { line: line, message: String(error.message || '') };
    }
  }

  window.GardenPLSyntax = {
    render: render,
    diagnose: diagnose,
    realJavaScript: realJavaScript,
    supports: function (langId) { return !!LANG[langId] || langId === 'web'; }
  };
})();
