/*@3.NOEJ2.1*/
(function () {
  'use strict';

  /*@3.NOEJ2.2*/
  var T = {
    smile: '😄', smiley: '😃', grin: '😁', grinning: '😀', laughing: '😆',
    joy: '😂', rofl: '🤣', wink: '😉', blush: '😊', slightly_smiling_face: '🙂',
    upside_down_face: '🙃', relaxed: '☺️', heart_eyes: '😍', kissing_heart: '😘',
    thinking: '🤔', neutral_face: '😐', expressionless: '😑', unamused: '😒',
    sweat_smile: '😅', pensive: '😔', confused: '😕', worried: '😟',
    cry: '😢', sob: '😭', angry: '😠', rage: '😡', tired_face: '😫',
    sleepy: '😪', sleeping: '😴', mask: '😷', sunglasses: '😎',
    astonished: '😲', open_mouth: '😮', scream: '😱', flushed: '😳',
    zipper_mouth_face: '🤐', nerd_face: '🤓', partying_face: '🥳',
    exploding_head: '🤯', star_struck: '🤩', pleading_face: '🥺',

    thumbsup: '👍', '+1': '👍', thumbsdown: '👎', '-1': '👎',
    ok_hand: '👌', clap: '👏', raised_hands: '🙌', pray: '🙏',
    muscle: '💪', wave: '👋', point_right: '👉', point_left: '👈',
    point_up: '👆', point_down: '👇', v: '✌️', crossed_fingers: '🤞',
    handshake: '🤝', writing_hand: '✍️', eyes: '👀', brain: '🧠',

    heart: '❤️', orange_heart: '🧡', yellow_heart: '💛', green_heart: '💚',
    blue_heart: '💙', purple_heart: '💜', black_heart: '🖤', white_heart: '🤍',
    broken_heart: '💔', sparkling_heart: '💖', heartpulse: '💗',
    star: '⭐', star2: '🌟', sparkles: '✨', zap: '⚡', boom: '💥',
    fire: '🔥', snowflake: '❄️', droplet: '💧', ocean: '🌊',
    sunny: '☀️', cloud: '☁️', rainbow: '🌈', moon: '🌙', earth_africa: '🌍',

    rocket: '🚀', airplane: '✈️', car: '🚗', bike: '🚲', ship: '🚢',
    house: '🏠', school: '🏫', office: '🏢', hospital: '🏥',
    books: '📚', book: '📖', notebook: '📓', pencil: '📝', pencil2: '✏️',
    memo: '📝', clipboard: '📋', paperclip: '📎', pushpin: '📌',
    calendar: '📅', date: '📆', alarm_clock: '⏰', hourglass: '⌛',
    stopwatch: '⏱️', watch: '⌚', bell: '🔔', no_bell: '🔕',
    mag: '🔍', mag_right: '🔎', key: '🔑', lock: '🔒', unlock: '🔓',
    bulb: '💡', flashlight: '🔦', battery: '🔋', electric_plug: '🔌',
    computer: '💻', desktop_computer: '🖥️', keyboard: '⌨️', printer: '🖨️',
    iphone: '📱', telephone: '☎️', envelope: '✉️', email: '📧',
    inbox_tray: '📥', outbox_tray: '📤', package: '📦', file_folder: '📁',
    open_file_folder: '📂', page_facing_up: '📄', bar_chart: '📊',
    chart_with_upwards_trend: '📈', chart_with_downwards_trend: '📉',
    trophy: '🏆', medal: '🏅', dart: '🎯', game_die: '🎲',
    gift: '🎁', tada: '🎉', confetti_ball: '🎊', balloon: '🎈',
    art: '🎨', musical_note: '🎵', headphones: '🎧', camera: '📷',
    video_camera: '📹', movie_camera: '🎥', tv: '📺', radio: '📻',
    microscope: '🔬', telescope: '🔭', test_tube: '🧪', dna: '🧬',
    gear: '⚙️', wrench: '🔧', hammer: '🔨', nut_and_bolt: '🔩',
    link: '🔗', scissors: '✂️', wastebasket: '🗑️', recycle: '♻️',
    robot: '🤖', alien: '👽', ghost: '👻', skull: '💀',
    coffee: '☕', tea: '🍵', pizza: '🍕', apple: '🍎', bread: '🍞',
    cake: '🎂', candy: '🍬', watermelon: '🍉', grapes: '🍇',
    seedling: '🌱', herb: '🌿', four_leaf_clover: '🍀', maple_leaf: '🍁',
    cherry_blossom: '🌸', rose: '🌹', sunflower: '🌻', cactus: '🌵',
    dog: '🐶', cat: '🐱', mouse: '🐭', rabbit: '🐰', bear: '🐻',
    panda_face: '🐼', fox_face: '🦊', lion: '🦁', tiger: '🐯',
    bird: '🐦', penguin: '🐧', fish: '🐟', whale: '🐳', butterfly: '🦋',
    bee: '🐝', ant: '🐜', bug: '🐛', spider: '🕷️',

    white_check_mark: '✅', heavy_check_mark: '✔️', ballot_box_with_check: '☑️',
    x: '❌', negative_squared_cross_mark: '❎', heavy_multiplication_x: '✖️',
    warning: '⚠️', exclamation: '❗', question: '❓', grey_question: '❔',
    bangbang: '‼️', interrobang: '⁉️', information_source: 'ℹ️',
    no_entry: '⛔', no_entry_sign: '🚫', stop_sign: '🛑',
    heavy_plus_sign: '➕', heavy_minus_sign: '➖', heavy_division_sign: '➗',
    arrow_right: '➡️', arrow_left: '⬅️', arrow_up: '⬆️', arrow_down: '⬇️',
    arrow_upper_right: '↗️', arrow_lower_right: '↘️',
    arrow_right_hook: '↪️', leftwards_arrow_with_hook: '↩️',
    arrows_counterclockwise: '🔄', repeat: '🔁', twisted_rightwards_arrows: '🔀',
    small_blue_diamond: '🔹', small_orange_diamond: '🔸',
    large_blue_circle: '🔵', red_circle: '🔴', white_circle: '⚪',
    black_circle: '⚫', green_circle: '🟢', yellow_circle: '🟡',
    black_square_button: '🔲', white_square_button: '🔳',
    hash: '#️⃣', asterisk: '*️⃣', zero: '0️⃣', one: '1️⃣', two: '2️⃣',
    three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣',
    eight: '8️⃣', nine: '9️⃣', keycap_ten: '🔟',
    100: '💯', ok: '🆗', new: '🆕', free: '🆓', up: '🆙', cool: '🆒',
    soon: '🔜', top: '🔝', back: '🔙', end: '🔚', on: '🔛'
  };

  /*@3.NOEJ2.3*/
  var RE = /^:([a-z0-9_+\-]{1,32}):/i;

  function get(name) {
    if (!name) return '';
    var k = String(name).toLowerCase();
    return Object.prototype.hasOwnProperty.call(T, k) ? T[k] : '';
  }

  /*@3.NOEJ2.4*/
  function replaceIn(text) {
    var s = String(text == null ? '' : text);
    if (s.indexOf(':') < 0) return s;
    return s.replace(/:([a-z0-9_+\-]{1,32}):/gi, function (all, nm) {
      var hit = get(nm);
      return hit || all;
    });
  }

  window.GardenNotesEmoji = { get: get, replaceIn: replaceIn, RE: RE, size: Object.keys(T).length };
})();
