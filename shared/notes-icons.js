;(function () {
  'use strict';

  function ic(name, weight) {
    return '<i class="fa-' + (weight || 'solid') + ' fa-' + name + '" aria-hidden="true"></i>';
  }

  function stack(main, badge) {
    return '<span class="ni ni-stack">' + ic(main) +
      '<span class="ni-badge">' + ic(badge) + '</span></span>';
  }

  function over(main, mark) {
    return '<span class="ni ni-over">' + ic(main) +
      '<span class="ni-mark">' + ic(mark) + '</span></span>';
  }

  /*@3.NOIJ3.1*/
  function svg(body, box) {
    return '<svg class="ni-svg" viewBox="' + (box || '0 0 16 16') + '" aria-hidden="true"' +
      ' fill="none" stroke="currentColor" stroke-width="1.4"' +
      ' stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  /*@3.NOIJ3.2*/
  var LASSO = svg(
    '<ellipse cx="8" cy="5.9" rx="5.4" ry="3.7"/>' +
    '<path d="M6.9 9.4c-.5 1.5-.2 2.6.6 3.3"/>' +
    '<circle cx="7.9" cy="13.4" r="1.15" fill="currentColor" stroke="none"/>'
  );

  var NI = {
    pen:         ic('pen'),
    hand:        ic('hand'),
    select:      ic('arrow-pointer'),
    lasso:       LASSO,
    shapes:      ic('shapes'),
    colour:      ic('palette'),
    undo:        ic('rotate-left'),
    redo:        ic('rotate-right'),
    exit:        ic('xmark'),

    eraser:      ic('eraser'),
    eraserPen:   ic('eraser'),
    eraserSmart: stack('eraser', 'wand-magic-sparkles'),

    highlight:   ic('highlighter'),
    hiStraight:  stack('highlighter', 'ruler-horizontal'),
    hiWave:      stack('highlighter', 'signature'),

    star:        ic('star', 'regular'),
    starOff:     over('star', 'slash'),

    nibRound:    ic('pen'),
    nibFine:     ic('pen-nib'),
    nibMarker:   ic('marker'),
    nibChisel:   ic('pen-fancy'),
    width:       ic('bars-staggered'),

    palmAuto:    stack('hand', 'pen'),
    palmAlways:  over('hand', 'slash'),
    palmNever:   ic('hand'),
    penBtn:      stack('pen', 'gear'),
    tilt:        stack('pen-fancy', 'angle-right')
  };

  NI.icon = ic;
  NI.stack = stack;
  NI.over = over;

  window.GardenNotesIcons = NI;
})();
