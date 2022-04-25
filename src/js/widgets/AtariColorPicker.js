const palettePAL = [
  'rgb(0,0,0);','rgb(37,37,37);','rgb(70,70,70);','rgb(107,107,107);','rgb(131,131,131);','rgb(168,168,168);',
  'rgb(202,202,202);','rgb(238,238,238);',
  'rgb(60,0,0);','rgb(96,27,0);','rgb(130,60,0);','rgb(166,97,0);','rgb(191,122,25);','rgb(228,158,62);',
  'rgb(255,192,95);','rgb(255,228,132);',
  'rgb(75,0,0);','rgb(112,11,0);','rgb(145,45,3);','rgb(182,81,39);','rgb(207,106,64);','rgb(243,143,101);',
  'rgb(255,176,134);','rgb(255,213,171);',
  'rgb(80,0,21);','rgb(116,0,58);','rgb(150,25,91);','rgb(187,62,128);','rgb(211,87,152);','rgb(248,123,189);',
  'rgb(255,157,223);','rgb(255,193,255);',
  'rgb(61,0,103);','rgb(98,0,140);','rgb(131,19,174);','rgb(168,56,210);','rgb(193,80,235);','rgb(229,117,255);',
  'rgb(255,150,255);','rgb(255,187,255);',
  'rgb(40,0,132);','rgb(76,0,169);','rgb(110,24,203);','rgb(147,61,239);','rgb(171,85,255);','rgb(208,122,255);',
  'rgb(241,156,255);','rgb(255,192,255);',
  'rgb(15,0,148);','rgb(51,0,185);','rgb(85,34,218);','rgb(121,71,255);','rgb(146,95,255);','rgb(183,132,255);',
  'rgb(216,166,255);','rgb(253,202,255);',
  'rgb(0,0,134);','rgb(0,30,171);','rgb(32,63,204);','rgb(69,100,241);','rgb(94,125,255);','rgb(130,161,255);',
  'rgb(164,195,255);','rgb(200,231,255);',
  'rgb(0,10,106);','rgb(0,46,143);','rgb(11,80,176);','rgb(47,116,213);','rgb(72,141,238);','rgb(108,178,255);',
  'rgb(142,211,255);','rgb(179,248,255);',
  'rgb(0,25,68);','rgb(0,62,104);','rgb(0,95,138);','rgb(31,132,174);','rgb(56,157,199);','rgb(93,193,236);',
  'rgb(126,227,255);','rgb(163,255,255);',
  'rgb(0,45,0);','rgb(0,81,16);','rgb(0,115,49);','rgb(27,151,86);','rgb(52,176,110);','rgb(88,213,147);',
  'rgb(122,246,181);','rgb(158,255,217);',
  'rgb(0,46,0);','rgb(0,83,0);','rgb(30,116,0);','rgb(67,153,0);','rgb(92,177,0);','rgb(128,214,36);',
  'rgb(162,248,69);','rgb(198,255,106);',
  'rgb(0,36,0);','rgb(22,73,0);','rgb(56,106,0);','rgb(92,143,0);','rgb(117,168,0);','rgb(154,204,20);',
  'rgb(187,238,54);','rgb(224,255,90);',
  'rgb(12,23,0);','rgb(49,59,0);','rgb(82,93,0);','rgb(119,129,0);','rgb(144,154,0);','rgb(180,191,19);',
  'rgb(214,224,53);','rgb(251,255,90);',
  'rgb(38,7,0);','rgb(74,43,0);','rgb(108,77,0);','rgb(145,113,0);','rgb(169,138,0);','rgb(206,175,34);',
  'rgb(239,208,67);','rgb(255,245,104);',
  'rgb(60,0,0);','rgb(96,27,0);','rgb(130,60,0);','rgb(166,97,0);','rgb(191,122,25);','rgb(228,158,62);',
  'rgb(255,192,95);','rgb(255,228,132);',
];

var palettePALinRGB;        // This will store the RGB values from the above palette

(function () {
  var ns = $.namespace('pskl.widgets');

  ns.AtariColorPicker = function (container, colorUpdatedCallback) {
    this.container = container;
    this.colorUpdatedCallback = colorUpdatedCallback;

    this.tinyColor = null;
    this.hsvColor = null;
    this.rgbColor = null;

    this.lastInputTimestamp_ = 0;
  };

  ns.AtariColorPicker.prototype.init = function () {
    var isFirefox = pskl.utils.UserAgent.isFirefox;
    var isChrome = pskl.utils.UserAgent.isChrome;

    var changeEvent = (isChrome || isFirefox) ? 'input' : 'change';
    pskl.utils.Event.addEventListener(this.container, changeEvent, this.onPickerChange_, this);
    pskl.utils.Event.addEventListener(this.container, 'keydown', this.onPickerChange_, this);

    // Cannot use pskl.utils.Event with useCapture for now ...
    this.onBlur_ = this.onBlur_.bind(this);
    this.container.addEventListener('blur', this.onBlur_, true);

    this.spectrumEl = this.container.querySelector('.atari-color-picker-spectrum');

    // Build palette array
    var palette = [];
    var idx = 0;
    for (var row = 0; row < 16; ++row) {
      var info = [];
      for (var col = 0; col < 8; ++col, ++idx) {
        info.push(palettePAL[idx]);
      }
      palette.push(info);
    }
    // Build the RGB color values from the palette
    if (!palettePALinRGB) {
      palettePALinRGB = [];
      for (var idx = 0; idx < palettePAL.length; ++idx) {
        var tinyColor = this.toTinyColor_(palettePAL[idx]);
        var rgbColor = tinyColor.toRgb();
        palettePALinRGB[idx] = rgbColor;
      }
    }

    $(this.spectrumEl).spectrum({
      flat: true,
      showButtons: false,
      move : this.setColor.bind(this),
      change : this.setColor.bind(this),
      showPaletteOnly: true,
      showPalette:true,
      palette: palette,
    });

    //this.setColor('#101010');

    // Hook up the three review panes
    this.atariCol1El = this.container.querySelector('.atari-color-preview1');
    this.atariCol2El = this.container.querySelector('.atari-color-preview2');
    this.atariCol3El = this.container.querySelector('.atari-color-preview3');
    this.atariText1El = this.container.querySelector('.atari-color-preview-part1');
    this.atariText2El = this.container.querySelector('.atari-color-preview-part2');
    this.atariText3El = this.container.querySelector('.atari-color-preview-part3');
  };

  ns.AtariColorPicker.prototype.destroy = function () {
    // Remove event listeners.
    pskl.utils.Event.removeAllEventListeners(this);
    this.container.removeEventListener('blur', this.onBlur_, true);

    // Destroy spectrum widget.
    $(this.spectrumEl).spectrum('destroy');

    this.container = null;
    this.spectrumEl = null;
    this.atariCol1El = null;
    this.atariCol1E2 = null;
    this.atariCol3El = null;
    this.atariText1El = null;
    this.atariText2El = null;
    this.atariText3El = null;
  };

  /**
   * Handle change event on all color inputs
   */
  ns.AtariColorPicker.prototype.onPickerChange_ = function (evt) {
    var target = evt.target;
    if (target.dataset.dimension) {
      var model = target.dataset.model;
      var dimension = target.dataset.dimension;
      var value = target.value;

      this.updateColor_(value, model, dimension);
    }
  };

  /**
   * Handle up/down arrow keydown on text inputs
   */
  ns.AtariColorPicker.prototype.onKeydown_ = function (evt) {
    var target = evt.target;

    var isInputText = target.getAttribute('type').toLowerCase() === 'text';
    if (isInputText && target.dataset.dimension) {
      var model = target.dataset.model;

      if (model === 'rgb' || model === 'hsv') {
        var increment = this.getIncrement_(evt);
        if (increment) {
          var dimension = target.dataset.dimension;
          var value = parseInt(target.value, 10);
          this.updateColor_(value + increment, model, dimension);
        }
      }
    }
  };

  ns.AtariColorPicker.prototype.getIncrement_ = function (evt) {
    var increment = 0;
    var key = pskl.service.keyboard.KeycodeTranslator.toChar(evt.keyCode);
    if (key === 'up') {
      increment = 1;
    } else if (key === 'down') {
      increment = -1;
    }

    if (evt.shiftKey) {
      increment = increment * 5;
    }

    return increment;
  };

  ns.AtariColorPicker.prototype.updateColor_ = function (inputValue, model, dimension) {
    var value = this.toModelValue_(inputValue, model, dimension);
    if (model === 'hsv' || model === 'rgb') {
      if (!isNaN(value)) {
        var color = this.getColor_(model);
        color[dimension] = this.normalizeDimension_(value, dimension);
        this.setColor(color);
      }
    } else if (model === 'hex') {
      if (/^#([a-f0-9]{3}){1,2}$/i.test(value)) {
        this.setColor(value);
      }
    }
  };

  ns.AtariColorPicker.prototype.onBlur_ = function (evt) {
    var target = evt.target;

    var isInputText = target.getAttribute('type').toLowerCase() === 'text';
    if (isInputText && target.dataset.dimension) {
      var model = target.dataset.model;
      var dimension = target.dataset.dimension;
      target.value = this.toInputValue_(model, dimension);
    }
  };

  ns.AtariColorPicker.prototype.setColor = function (inputColor, colorIndex) {
    if (!this.unplugged) {
      this.unplugged = true;

      this.hsvColor = this.toHsvColor_(inputColor);
      this.tinyColor = this.toTinyColor_(inputColor);
      this.rgbColor = this.tinyColor.toRgb();

      this.updateInputs();
      $('.atari-color-picker-spectrum').spectrum('set', this.tinyColor);

      this.colorUpdatedCallback(this.tinyColor);

      this.unplugged = false;
    }
  };

  ns.AtariColorPicker.prototype.updateInputs = function () {
    var inputs = this.container.querySelectorAll('input');

    for (var i = 0 ; i < inputs.length ; i++) {
      var input = inputs[i];
      var dimension = input.dataset.dimension;
      var model = input.dataset.model;

      var value = this.toInputValue_(model, dimension);
      if (input.value != value) {
        input.value = value;
      }
      if (input.getAttribute('type') === 'range') {
        this.updateSliderBackground(input);
      }
    }
  };

  ns.AtariColorPicker.prototype.toInputValue_ = function (model, dimension) {
    var value;

    if (model === 'rgb' || model === 'hsv') {
      var color = this.getColor_(model);
      value = color[dimension];

      if (dimension === 'v' || dimension === 's') {
        value = 100 * value;
      }
      value = Math.round(value);
    } else if (model === 'hex') {
      value = this.tinyColor.toHexString(true);
    }

    return value;
  };

  ns.AtariColorPicker.prototype.toModelValue_ = function (value, model, dimension) {
    var modelValue;

    if (model === 'rgb' || model === 'hsv') {
      modelValue = parseInt(value, 10);
      if (dimension === 'v' || dimension === 's') {
        modelValue = modelValue / 100;
      }
    } else if (model === 'hex') {
      modelValue = value;
    }

    return modelValue;
  };

  ns.AtariColorPicker.prototype.toTinyColor_ = function (color) {
    var isTinyColor = typeof color == 'object' && color.hasOwnProperty('_tc_id');
    if (isTinyColor) {
      return color;
    } else {
      return window.tinycolor(pskl.utils.copy(color));
    }
  };

  ns.AtariColorPicker.prototype.toHsvColor_ = function (color) {
    var isHsvColor = ['h', 's', 'v'].every(color.hasOwnProperty.bind(color));
    if (isHsvColor) {
      return {
        h : this.normalizeDimension_(color.h, 'h'),
        s : this.normalizeDimension_(color.s, 's'),
        v : this.normalizeDimension_(color.v, 'v')
      };
    } else {
      return this.toTinyColor_(color).toHsv();
    }
  };

  ns.AtariColorPicker.prototype.normalizeDimension_ = function (value, dimension) {
    var range = this.getDimensionRange_(dimension);
    return Math.max(range[0], Math.min(range[1], value));
  };

  /**
   * Update background colors for range inputs
   */
  ns.AtariColorPicker.prototype.updateSliderBackground = function (slider) {
    var dimension = slider.dataset.dimension;
    var model = slider.dataset.model;

    var start;
    var end;
    var isHueSlider = dimension === 'h';
    if (!isHueSlider) {
      var colors = this.getSliderBackgroundColors_(model, dimension);
      slider.style.backgroundImage = 'linear-gradient(to right, ' + colors.start + ' 0, ' + colors.end + ' 100%)';
    }
  };

  ns.AtariColorPicker.prototype.getSliderBackgroundColors_ = function (model, dimension) {
    var color = this.getColor_(model);
    var start = pskl.utils.copy(color);
    var end = pskl.utils.copy(color);

    var range = this.getDimensionRange_(dimension);
    start[dimension] = range[0];
    end[dimension] = range[1];

    return {
      start : window.tinycolor(start).toRgbString(),
      end : window.tinycolor(end).toRgbString()
    };
  };

  ns.AtariColorPicker.prototype.getDimensionRange_ = function (d) {
    if (d === 'h') {
      return [0, 359];
    } else if (d === 's' || d === 'v') {
      return [0, 1];
    } else if (d === 'r' || d === 'g' || d === 'b') {
      return [0, 255];
    }
  };

  ns.AtariColorPicker.prototype.getColor_ = function (model) {
    var color;
    if (model === 'hsv') {
      color = this.hsvColor;
    } else if (model === 'rgb') {
      color = this.rgbColor;
    }
    return color;
  };

  ns.AtariColorPicker.prototype.updateORColors = function (palette) {
    if (palette && palette.colors.length >= 2) {
      var colors = palette.colors;
      // Show color 0 and 1, find their index in the palette
      // and calculate the OR of the two colors
      // Set the color 1 and 2 preview colors
      var col1 = this.findClosetColor(colors[0]);
      this.atariCol1El.style.background = col1.rgb;
      this.atariText1El.innerText = col1.index;

      var col2 = this.findClosetColor(colors[1]);
      this.atariCol2El.style.background = col2.rgb;
      this.atariText2El.innerText = col2.index;

      // color 3 = col1 index | col2 index
      var color3Index = col1.index | col2.index;
      var col3 = window.tinycolor(palettePAL[color3Index / 2]);
      this.atariCol3El.style.background = col3.toRgbString();
      this.atariText3El.innerText = color3Index;
      // console.log("OR of ", col1.index, col2.index, "=", color3Index, col3);
      return col3;
    }
  };

  ns.AtariColorPicker.prototype.findClosetColor = function (colorVal) {
    var tinyColor = this.toTinyColor_(colorVal);
    var rgb = tinyColor.toRgb();
    var smallestDistance = 255 * 255 * 3 + 1;
    var bestFit = palettePALinRGB[0];
    var bestIdx = 0;

    for (var idx = 0; idx < palettePALinRGB.length; ++idx) {
      var col = palettePALinRGB[idx];
      var dist = (rgb.r - col.r) * (rgb.r - col.r) +
        (rgb.g - col.g) * (rgb.g - col.g) +
        (rgb.b - col.b) * (rgb.b - col.b);
      if (dist < smallestDistance) {
        smallestDistance = dist;
        bestFit = col;
        bestIdx = idx;
      }
    }
    return {rgb: window.tinycolor(bestFit).toRgbString(), index: bestIdx * 2};
  };


})();
