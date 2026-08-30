;(function () {
  'use strict';

  /*@3.NOCJ2.5*/
  var LANG = {
    java: {
      kw: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    python: {
      kw: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self match case',
      line: '#', tri: ['"""', "'''"], q: '"\'', ty: 1
    },
    js: {
      kw: 'await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return static super switch this throw try typeof var void while with yield async of true false null undefined',
      line: '//', block: ['/*', '*/'], q: '"\'`', ty: 1
    },
    c: {
      kw: 'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL include define ifdef ifndef endif pragma',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    csharp: {
      kw: 'abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while async await record yield nameof',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    go: {
      kw: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false iota make new len cap append copy delete panic recover string int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float32 float64 bool byte rune error',
      line: '//', block: ['/*', '*/'], q: '"\'`', ty: 1
    },
    rust: {
      kw: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while union macro_rules',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    swift: {
      kw: 'associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public rethrows static struct subscript typealias var where while repeat guard defer do else fallthrough for if in return switch case break continue default catch throw throws try as Any false is nil self Self super true async await actor some any',
      line: '//', block: ['/*', '*/'], q: '"', ty: 1
    },
    kotlin: {
      kw: 'as break class continue do else false for fun if in interface is null object package return super this throw true try typealias typeof val var when while by catch constructor delegate dynamic field file finally get import init param property receiver set setparam value where abstract actual annotation companion const crossinline data enum expect external final infix inline inner internal lateinit noinline open operator out override private protected public reified sealed suspend tailrec vararg',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    php: {
      kw: 'abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield true false null',
      line: '//', alt: '#', block: ['/*', '*/'], q: '"\'', sig: '$', ty: 1
    },
    ruby: {
      kw: 'alias and begin break case class def defined? do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield attr_accessor attr_reader attr_writer require require_relative puts lambda proc',
      line: '#', q: '"\'`', sig: '@$', ty: 1
    },
    powershell: {
      kw: 'begin break catch class continue data define do dynamicparam else elseif end enum exit filter finally for foreach from function hidden if in inlinescript parallel param process return static switch throw trap try until using var while workflow true false null not and or xor band bor bnot bxor eq ne gt ge lt le like notlike match notmatch contains notcontains in notin replace split join is isnot as ceq cne clike cmatch',
      line: '#', block: ['<#', '#>'], q: '"\'@', sig: '$', ci: 1, dash: 1, ty: 1
    },
    bash: {
      kw: 'if then else elif fi case esac for while until do done in function select time coproc return break continue local export readonly declare typeset unset shift eval exec exit trap set source alias unalias echo printf read cd pwd test true false let',
      line: '#', q: '"\'`', sig: '$', ty: 0
    },
    sql: {
      kw: 'select from where insert update delete create table drop alter add primary key foreign references join inner left right outer full cross on group by order having limit offset union all as and or not null distinct count sum avg min max between like ilike in values set index view default constraint unique check cascade with recursive case when then else end exists any some into truncate begin commit rollback transaction procedure function trigger returning',
      line: '--', block: ['/*', '*/'], q: '"\'', ci: 1, ty: 0
    },
    css: {
      kw: 'important media supports keyframes import charset font-face layer container property from to and not only screen print all',
      line: '//', block: ['/*', '*/'], q: '"\'', dash: 1, ty: 0
    },
    json: { kw: 'true false null', q: '"', ty: 0, key: ':' },
    yaml: { kw: 'true false null yes no on off ~', line: '#', q: '"\'', ty: 0, key: ':' },
    toml: { kw: 'true false', line: '#', q: '"\'', ty: 0, key: '=' },
    r: {
      kw: 'if else repeat while function for next break TRUE FALSE NULL Inf NaN NA NA_integer_ NA_real_ NA_character_ in library require return invisible',
      line: '#', q: '"\'', ty: 0
    },
    matlab: {
      kw: 'break case catch classdef continue else elseif end for function global if otherwise parfor persistent return spmd switch try while true false end methods properties events arguments',
      line: '%', block: ['%{', '%}'], q: '"\'', ty: 0
    },
    perl: {
      kw: 'my our local sub if elsif else unless while until for foreach do last next redo return use require package no BEGIN END and or not eq ne lt gt le ge cmp defined undef print printf say scalar wantarray ref bless',
      line: '#', q: '"\'`', sig: '$@%', ty: 0
    },
    lua: {
      kw: 'and break do else elseif end false for function goto if in local nil not or repeat return then true until while self',
      line: '--', block: ['--[[', ']]'], q: '"\'', ty: 0
    },
    dart: {
      kw: 'abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for get hide if implements import in interface is late library mixin new null on operator part required rethrows return sealed set show static super switch sync this throw true try typedef var void when while with yield',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    scala: {
      kw: 'abstract case catch class def do else extends false final finally for forSome if implicit import lazy match new null object override package private protected return sealed super this throw trait try true type val var while with yield given using enum export',
      line: '//', block: ['/*', '*/'], q: '"\'', ty: 1
    },
    haskell: {
      kw: 'case class data default deriving do else foreign if import in infix infixl infixr instance let module newtype of then type where forall',
      line: '--', block: ['{-', '-}'], q: '"\'', ty: 1
    },
    asm: {
      kw: 'mov add sub mul div inc dec push pop call ret jmp je jne jg jge jl jle cmp test and or xor not shl shr lea nop int section global extern db dw dd dq resb resw resd equ byte word dword qword ptr eax ebx ecx edx esi edi esp ebp rax rbx rcx rdx rsi rdi rsp rbp',
      line: ';', q: '"\'', ci: 1, ty: 0
    },
    ini: { kw: 'true false yes no on off', line: ';', alt: '#', q: '"\'', ty: 0, key: '=' },
    docker: {
      kw: 'FROM RUN CMD LABEL MAINTAINER EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL AS',
      line: '#', q: '"\'', ty: 0
    },
    make: {
      kw: 'ifeq ifneq ifdef ifndef else endif include define endef export unexport override vpath .PHONY .DEFAULT .PRECIOUS .SUFFIXES',
      line: '#', q: '"\'', sig: '$', ty: 0
    },
    latex: { kw: '', line: '%', q: '', sig: '\\', ty: 0 },
    /*@3.NOCJ2.6*/
    mermaid: {
      kw: 'flowchart graph subgraph end direction classDef class style linkStyle click href call callback ' +
          'sequenceDiagram participant actor activate deactivate note over left right loop alt else opt ' +
          'par and critical option break rect autonumber box ' +
          'classDiagram stateDiagram stateDiagram-v2 state erDiagram journey gantt pie mindmap timeline ' +
          'gitGraph commit branch checkout merge cherry-pick tag ' +
          'quadrantChart xychart bar line sankey block columns requirementDiagram requirement element ' +
          'C4Context C4Container Person System Boundary Rel ' +
          'title section dateFormat axisFormat excludes todayMarker accTitle accDescr ' +
          'TB TD BT RL LR of as',
      line: '%%', q: '"`', ty: 0
    },
    html: { html: 1 }
  };

  var ALIAS = {
    'javascript': 'js', 'jsx': 'js', 'ts': 'js', 'typescript': 'js', 'tsx': 'js',
    'node': 'js', 'mjs': 'js', 'cjs': 'js',
    'py': 'python', 'python3': 'python', 'ipython': 'python',
    'c++': 'c', 'cpp': 'c', 'cc': 'c', 'h': 'c', 'hpp': 'c', 'objc': 'c',
    'cs': 'csharp', 'c#': 'csharp', 'dotnet': 'csharp',
    'golang': 'go', 'rs': 'rust',
    'kt': 'kotlin', 'kts': 'kotlin',
    'rb': 'ruby', 'gemfile': 'ruby',
    'ps': 'powershell', 'ps1': 'powershell', 'pwsh': 'powershell',
    'posh': 'powershell', 'powershell-core': 'powershell',
    'sh': 'bash', 'shell': 'bash', 'zsh': 'bash', 'ksh': 'bash',
    'console': 'bash', 'terminal': 'bash', 'cmd': 'bash', 'bat': 'bash',
    'batch': 'bash', 'dos': 'bash',
    'mysql': 'sql', 'postgres': 'sql', 'postgresql': 'sql', 'psql': 'sql',
    'sqlite': 'sql', 'plsql': 'sql', 'tsql': 'sql', 'oracle': 'sql',
    'scss': 'css', 'less': 'css', 'sass': 'css', 'stylus': 'css',
    'xml': 'html', 'svg': 'html', 'xhtml': 'html', 'vue': 'html',
    'jsonc': 'json', 'json5': 'json', 'geojson': 'json',
    'yml': 'yaml',
    'rlang': 'r', 'rscript': 'r',
    'octave': 'matlab', 'm': 'matlab',
    'pl': 'perl',
    'hs': 'haskell',
    'nasm': 'asm', 'assembly': 'asm', 'x86': 'asm', 'masm': 'asm',
    'cfg': 'ini', 'conf': 'ini', 'properties': 'ini', 'editorconfig': 'ini',
    'dockerfile': 'docker', 'containerfile': 'docker',
    'makefile': 'make', 'mk': 'make',
    'tex': 'latex', 'bibtex': 'latex',
    'php3': 'php', 'php7': 'php', 'php8': 'php',
    'mmd': 'mermaid', 'mermaidjs': 'mermaid', 'mermaid-js': 'mermaid',
    'flowchart': 'mermaid', 'graph': 'mermaid', 'sequencediagram': 'mermaid',
    'classdiagram': 'mermaid', 'statediagram': 'mermaid', 'erdiagram': 'mermaid',
    'gantt': 'mermaid', 'mindmap': 'mermaid', 'gitgraph': 'mermaid',
    'diagram': 'mermaid', 'mermade': 'mermaid'
  };

  function norm(lang) {
    var l = String(lang || '').trim().toLowerCase();
    if (ALIAS[l]) l = ALIAS[l];
    return LANG.hasOwnProperty(l) ? l : '';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var CACHE = {};
  function keywords(lang) {
    if (!CACHE[lang]) {
      var cfg = LANG[lang] || {}, m = {};
      var parts = (cfg.kw || '').split(' ');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i]) m[cfg.ci ? parts[i].toLowerCase() : parts[i]] = 1;
      }
      CACHE[lang] = m;
    }
    return CACHE[lang];
  }

  function tokHtml(s) {
    var out = '', i = 0, n = s.length;
    function push(cls, txt) {
      out += cls ? ('<span class="cd-' + cls + '">' + esc(txt) + '</span>') : esc(txt);
    }
    while (i < n) {
      if (s.substr(i, 4) === '<!--') {
        var ce = s.indexOf('-->', i + 4);
        ce = ce < 0 ? n : ce + 3;
        push('cm', s.slice(i, ce)); i = ce; continue;
      }
      if (s.charAt(i) === '<') {
        var te = s.indexOf('>', i);
        te = te < 0 ? n : te + 1;
        var tag = s.slice(i, te);
        var mt = tag.match(/^<\/?\s*([A-Za-z0-9_:.-]+)/);
        var j = 0;
        push('pn', mt ? tag.slice(0, mt[0].length - mt[1].length) : '<');
        if (mt) {
          push('ty', mt[1]);
          j = mt[0].length;
          var rest = tag.slice(j), k = 0, rn = rest.length;
          while (k < rn) {
            var ch = rest.charAt(k);
            if (ch === '"' || ch === "'") {
              var qe = rest.indexOf(ch, k + 1);
              qe = qe < 0 ? rn : qe + 1;
              push('st', rest.slice(k, qe)); k = qe; continue;
            }
            if (/[A-Za-z_:@#]/.test(ch)) {
              var w = k;
              while (w < rn && /[A-Za-z0-9_:.@#-]/.test(rest.charAt(w))) w++;
              push('kw', rest.slice(k, w)); k = w; continue;
            }
            if (/[=/>]/.test(ch)) { push('pn', ch); k++; continue; }
            push('', ch); k++;
          }
        }
        i = te; continue;
      }
      var lt = s.indexOf('<', i);
      if (lt < 0) lt = n;
      push('', s.slice(i, lt));
      i = lt;
    }
    return out;
  }

  function isKey(s, a, b, mark) {
    var i = a - 1;
    while (i >= 0 && (s.charAt(i) === ' ' || s.charAt(i) === '\t' ||
                      s.charAt(i) === '-' || s.charAt(i) === '"' ||
                      s.charAt(i) === "'")) i--;
    if (i >= 0 && s.charAt(i) !== '\n') return false;
    var j = b;
    while (j < s.length && (s.charAt(j) === ' ' || s.charAt(j) === '"' ||
                            s.charAt(j) === "'")) j++;
    return s.charAt(j) === mark;
  }

  /*@3.NOCJ2.1*/
  function tokenize(src, lang) {
    var s = String(src == null ? '' : src);
    var cfg = LANG[lang];
    if (!cfg) return esc(s);
    if (cfg.html) return tokHtml(s);
    var kw = keywords(lang);
    var out = '';
    var i = 0, n = s.length;
    var lineA = cfg.line || '', lineB = cfg.alt || '';
    var bo = cfg.block ? cfg.block[0] : '', bc = cfg.block ? cfg.block[1] : '';
    var quotes = cfg.q || '';
    var tri = cfg.tri || null;
    var sig = cfg.sig || '';
    var wordRe = cfg.dash ? /[A-Za-z0-9_$#-]/ : /[A-Za-z0-9_$#]/;

    function push(cls, txt) {
      out += cls ? ('<span class="cd-' + cls + '">' + esc(txt) + '</span>') : esc(txt);
    }

    /*@3.NOCJ2.4*/
    var last = -1;
    while (i < n) {
      if (i === last) { push('', s.charAt(i)); i++; continue; }
      last = i;
      var ch = s.charAt(i);

      if (lineA && s.substr(i, lineA.length) === lineA &&
          !(bo && s.substr(i, bo.length) === bo)) {
        var e = s.indexOf('\n', i);
        if (e < 0) e = n;
        push('cm', s.slice(i, e)); i = e; continue;
      }
      if (lineB && s.substr(i, lineB.length) === lineB) {
        var e2 = s.indexOf('\n', i);
        if (e2 < 0) e2 = n;
        push('cm', s.slice(i, e2)); i = e2; continue;
      }
      if (bo && s.substr(i, bo.length) === bo) {
        var be = s.indexOf(bc, i + bo.length);
        be = be < 0 ? n : be + bc.length;
        push('cm', s.slice(i, be)); i = be; continue;
      }
      if (tri) {
        var hit = null, t;
        for (t = 0; t < tri.length; t++) {
          if (s.substr(i, tri[t].length) === tri[t]) { hit = tri[t]; break; }
        }
        if (hit) {
          var te2 = s.indexOf(hit, i + hit.length);
          te2 = te2 < 0 ? n : te2 + hit.length;
          push('st', s.slice(i, te2)); i = te2; continue;
        }
      }
      if (ch === '@' && quotes.indexOf('@') >= 0 &&
          (s.charAt(i + 1) === '"' || s.charAt(i + 1) === "'")) {
        var hq = s.charAt(i + 1);
        var he = s.indexOf(hq + '@', i + 2);
        he = he < 0 ? n : he + 2;
        push('st', s.slice(i, he)); i = he; continue;
      }
      if (ch !== '@' && quotes.indexOf(ch) >= 0) {
        var j = i + 1;
        while (j < n) {
          if (s.charAt(j) === '\\') { j += 2; continue; }
          if (s.charAt(j) === ch) { j++; break; }
          if (s.charAt(j) === '\n' && ch !== '`') break;
          j++;
        }
        push('st', s.slice(i, j)); i = j; continue;
      }

      if (/[0-9]/.test(ch) && !/[A-Za-z_$]/.test(s.charAt(i - 1) || ' ')) {
        var k2 = i;
        while (k2 < n && /[0-9a-fA-FxXbBoO._]/.test(s.charAt(k2))) k2++;
        push('nu', s.slice(i, k2)); i = k2; continue;
      }

      if (sig && sig.indexOf(ch) >= 0 && /[A-Za-z_{(]/.test(s.charAt(i + 1) || '')) {
        var v = i + 1;
        while (v < n && wordRe.test(s.charAt(v))) v++;
        push('ty', s.slice(i, v)); i = v; continue;
      }

      /*@3.NOCJ2.3*/
      if (/[A-Za-z_$@#.]/.test(ch)) {
        if (ch === '.' && !/[A-Za-z_]/.test(s.charAt(i + 1) || '')) {
          push('pn', ch); i++; continue;
        }
        var w2 = i;
        if (ch === '@' || ch === '.') w2++;
        while (w2 < n && wordRe.test(s.charAt(w2))) w2++;
        var word = s.slice(i, w2);
        var bare = /^[@.]/.test(word) ? word.slice(1) : word;
        var low = cfg.ci ? bare.toLowerCase() : bare;
        if (cfg.key && isKey(s, i, w2, cfg.key)) push('ty', word);
        else if (kw[low] || kw[bare]) push('kw', word);
        else if (cfg.dash && bare.indexOf('-') > 0) push('fn', word);
        else if (s.charAt(w2) === '(') push('fn', word);
        else if (cfg.ty && /^[A-Z]/.test(bare)) push('ty', word);
        else push('', word);
        i = w2; continue;
      }

      if (/[+\-*/%=<>!&|^~?:]/.test(ch)) {
        var o = i;
        while (o < n && /[+\-*/%=<>!&|^~?:]/.test(s.charAt(o))) o++;
        push('op', s.slice(i, o)); i = o; continue;
      }

      if (/[{}()[\];,.]/.test(ch)) { push('pn', ch); i++; continue; }

      push('', ch);
      i++;
    }
    return out;
  }

  /*@3.NOCJ2.2*/
  function paint(host, src, lang) {
    if (!host) return false;
    var l = norm(lang);
    if (!l) { host.textContent = String(src == null ? '' : src); return false; }
    host.innerHTML = tokenize(src, l);
    return true;
  }

  function languages() {
    return Object.keys(LANG).filter(function (k) { return k !== 'html'; });
  }

  function isMermaid(lang) { return norm(lang) === 'mermaid'; }

  /*@3.NOCJ2.7*/
  var MMD_HEAD = new RegExp('^(?:graph|flowchart|sequenceDiagram|classDiagram|' +
    'stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|' +
    'quadrantChart|xychart-beta|sankey-beta|block-beta|kanban|packet-beta|' +
    'C4(?:Context|Container|Component|Dynamic|Deployment)|requirementDiagram|' +
    'architecture-beta|radar-beta|treemap-beta|zenuml)\\b', 'i');

  function looksMermaid(text) {
    var raw = String(text == null ? '' : text).replace(/\r\n?/g, '\n').trim();
    if (!raw || raw.length > 400000) return false;
    var lines = raw.split('\n');
    var head = '', i, ln;
    for (i = 0; i < lines.length; i++) {
      ln = lines[i].trim();
      if (!ln || ln.indexOf('%%') === 0) continue;
      head = ln;
      break;
    }
    if (!head || !MMD_HEAD.test(head)) return false;
    for (i = i + 1; i < lines.length; i++) if (lines[i].trim()) return true;
    return false;
  }

  window.GardenNotesCode = {
    paint: paint,
    tokenize: tokenize,
    norm: norm,
    isMermaid: isMermaid,
    looksMermaid: looksMermaid,
    languages: languages,
    ALIAS: ALIAS
  };
})();
