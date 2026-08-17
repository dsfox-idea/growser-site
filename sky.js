/* Living night sky: star field, gentle twinkle, real circumpolar constellations,
   weak pointer parallax. Self-contained; pages only include this script. */
(function () {
  'use strict';

  var PAD = 16;      // overscan so parallax never reveals layer edges
  var LST = 18.4;    // sidereal time (hours): Big Dipper west of the pole, Cassiopeia east
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // J2000 catalog values: [RA hours, Dec degrees, visual magnitude].
  // Positions are projected around the north celestial pole, so the mutual
  // arrangement (pointers to Polaris, Cassiopeia across the pole) is real.
  var CONSTELLATIONS = [
    {
      stars: {
        dubhe: [11.062, 61.751, 1.79], merak: [11.031, 56.382, 2.37],
        phecda: [11.897, 53.695, 2.44], megrez: [12.257, 57.033, 3.31],
        alioth: [12.900, 55.960, 1.77], mizar: [13.399, 54.925, 2.27],
        alkaid: [13.792, 49.313, 1.86]
      },
      lines: [['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'],
              ['megrez', 'dubhe'], ['megrez', 'alioth'], ['alioth', 'mizar'],
              ['mizar', 'alkaid']]
    },
    {
      stars: {
        polaris: [2.530, 89.264, 1.98], yildun: [17.537, 86.586, 4.36],
        epsUMi: [16.766, 82.037, 4.23], zetaUMi: [15.734, 77.795, 4.32],
        etaUMi: [16.291, 75.755, 4.95], pherkad: [15.345, 71.834, 3.05],
        kochab: [14.845, 74.156, 2.08]
      },
      lines: [['polaris', 'yildun'], ['yildun', 'epsUMi'], ['epsUMi', 'zetaUMi'],
              ['zetaUMi', 'etaUMi'], ['etaUMi', 'pherkad'], ['pherkad', 'kochab'],
              ['kochab', 'zetaUMi']]
    },
    {
      stars: {
        caph: [0.153, 59.150, 2.27], schedar: [0.675, 56.537, 2.24],
        gammaCas: [0.945, 60.717, 2.47], ruchbah: [1.430, 60.235, 2.68],
        segin: [1.907, 63.670, 3.37]
      },
      lines: [['caph', 'schedar'], ['schedar', 'gammaCas'],
              ['gammaCas', 'ruchbah'], ['ruchbah', 'segin']]
    }
  ];

  var TINTS = ['#ffffff', '#ffffff', '#ffffff', '#dbe4ff', '#ffeed6'];

  var style = document.createElement('style');
  style.textContent =
    '#sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;' +
    'opacity:0;transition:opacity 1.6s ease}' +
    '#sky.on{opacity:1}' +
    '#sky svg{position:absolute;left:' + (-PAD) + 'px;top:' + (-PAD) + 'px}' +
    '@keyframes skytw{0%,100%{opacity:var(--hi)}50%{opacity:var(--lo)}}';
  document.head.appendChild(style);

  var sky = document.createElement('div');
  sky.id = 'sky';
  document.body.insertBefore(sky, document.body.firstChild);

  var layers = [];   // {el, k} — k is the max parallax shift in px

  function el(name, attrs) {
    var n = document.createElementNS(SVGNS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    return n;
  }

  function twinkle(node, hi, lo, dur) {
    node.style.setProperty('--hi', hi);
    node.style.setProperty('--lo', lo);
    node.style.animation = 'skytw ' + dur.toFixed(2) + 's ease-in-out ' +
      (-Math.random() * dur).toFixed(2) + 's infinite';
  }

  function project(ra, dec, pole, degPx) {
    var H = (LST - ra) * 15 * Math.PI / 180;  // hour angle; west is screen-left
    var r = (90 - dec) * degPx;
    return { x: pole.x - r * Math.sin(H), y: pole.y - r * Math.cos(H) };
  }

  function fieldStars(svg, W, H, count, rMin, rMax, opMin, opMax, twProb) {
    for (var i = 0; i < count; i++) {
      var r = rMin + Math.pow(Math.random(), 2) * (rMax - rMin);
      var op = opMin + Math.random() * (opMax - opMin);
      var c = el('circle', {
        cx: (Math.random() * W).toFixed(1), cy: (Math.random() * H).toFixed(1),
        r: r.toFixed(2), fill: TINTS[Math.floor(Math.random() * TINTS.length)],
        opacity: op.toFixed(2)
      });
      if (!reduce && Math.random() < twProb) {
        twinkle(c, op.toFixed(2), (op * (0.15 + Math.random() * 0.35)).toFixed(2),
          2.8 + Math.random() * 4.5);
      }
      svg.appendChild(c);
    }
  }

  function constellations(svg, pole, degPx) {
    CONSTELLATIONS.forEach(function (con) {
      var pts = {};
      for (var name in con.stars) {
        var s = con.stars[name];
        pts[name] = project(s[0], s[1], pole, degPx);
        pts[name].mag = s[2];
      }
      con.lines.forEach(function (ln) {
        var a = pts[ln[0]], b = pts[ln[1]];
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 14) return;
        var trim = 6 / len;  // keep hairlines off the stars themselves
        svg.appendChild(el('line', {
          x1: (a.x + dx * trim).toFixed(1), y1: (a.y + dy * trim).toFixed(1),
          x2: (b.x - dx * trim).toFixed(1), y2: (b.y - dy * trim).toFixed(1),
          stroke: '#a9b7dd', 'stroke-opacity': '0.12', 'stroke-width': '1'
        }));
      });
      for (var name2 in pts) {
        var p = pts[name2];
        var rad = Math.max(1, 2.9 - 0.45 * p.mag);
        var op = Math.min(0.92, 1.06 - 0.13 * p.mag);
        if (name2 === 'polaris') {
          svg.appendChild(el('circle', {
            cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: '7',
            fill: '#ffffff', opacity: '0.06'
          }));
        }
        var c = el('circle', {
          cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: rad.toFixed(2),
          fill: '#e9efff', opacity: op.toFixed(2)
        });
        // Polaris stays steady — it is the anchor of the whole sky
        if (!reduce && name2 !== 'polaris') {
          twinkle(c, op.toFixed(2), (op * 0.55).toFixed(2), 4 + Math.random() * 4);
        }
        svg.appendChild(c);
      }
    });
  }

  function build() {
    while (sky.firstChild) sky.removeChild(sky.firstChild);
    layers.length = 0;

    var w = innerWidth, h = innerHeight;
    var W = w + PAD * 2, H = h + PAD * 2;
    var vmin = Math.min(w, h);
    var area = w * h;
    var pole = { x: w * 0.52 + PAD, y: h * 0.38 + PAD };
    var degPx = vmin * 0.0095;

    var defs = [
      { k: 4, make: function (svg) {   // far: constellations + faint dust
          fieldStars(svg, W, H, Math.min(150, Math.max(50, area / 14000)),
            0.4, 1.3, 0.18, 0.55, 0.5);
          constellations(svg, pole, degPx);
        } },
      { k: 8, make: function (svg) {   // mid field
          fieldStars(svg, W, H, Math.min(90, Math.max(30, area / 24000)),
            0.6, 1.7, 0.3, 0.8, 0.65);
        } },
      { k: 14, make: function (svg) {  // a few bright near stars
          fieldStars(svg, W, H, 15, 1.1, 2.2, 0.5, 0.95, 1);
        } }
    ];

    defs.forEach(function (d) {
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H });
      svg.setAttribute('aria-hidden', 'true');
      d.make(svg);
      sky.appendChild(svg);
      layers.push({ el: svg, k: d.k });
    });
  }

  build();
  requestAnimationFrame(function () { sky.classList.add('on'); });

  var resizeT;
  addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(build, 200);
  });

  if (!reduce && matchMedia('(pointer: fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', function (e) {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    (function tick() {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        l.el.style.transform =
          'translate3d(' + (-cx * 2 * l.k).toFixed(2) + 'px,' +
                           (-cy * 2 * l.k).toFixed(2) + 'px,0)';
      }
      requestAnimationFrame(tick);
    })();
  }
})();
