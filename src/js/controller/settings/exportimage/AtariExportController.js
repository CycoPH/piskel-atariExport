(function () {
	var ns = $.namespace('pskl.controller.settings.exportimage');

	var BLACK = '#000000';

	ns.AtariExportController = function (piskelController) {
		this.piskelController = piskelController;
	};

	pskl.utils.inherit(ns.AtariExportController, pskl.controller.settings.AbstractSettingController);

	ns.AtariExportController.prototype.init = function () {
		this.atariSpritePrefixInput = document.querySelector('.atari-prefix-name');
		this.atariSpritePrefixInput.value = 'PM_';

		this.atariSpriteFramePrefixInput = document.querySelector('.atari-frame-prefix-name');
		this.atariSpriteFramePrefixInput.value = 'frm_';

		this.splitByColorIndex =  document.querySelector('.asm-from-pallete-checkbox');

		var asmDownloadButton = document.querySelector('.atasm-download-button')
		this.addEventListener(asmDownloadButton, 'click', this.onDownloadAsmFileClick_);
	};

	ns.AtariExportController.prototype.onDownloadAsmFileClick_ = function () {

		if (this.splitByColorIndex.checked) {
			this.fromPaletteExport_();
		} else {
			this.fromLayersExport_();
		}
	};

	/**
	 * Each image is converted into a 2-bit color index and each bit is exported into
	 * a player.
	 */
	ns.AtariExportController.prototype.fromPaletteExport_ = function () {
		var width = this.piskelController.getWidth();
		var height = this.piskelController.getHeight();
		var numPixels = width*height;

		// Find the color RGB values for color 1, 2 & 3
		var colorPalette = pskl.app.palettesListController.getSelectedPaletteColors_(); 		// Get the current color palette
		// If the palette contains just one color then that is taken to be the reference color that will be used for creating the bit plane
		// if the palette contains 3 (or more) colors then colors 0,1,2 are taken to be the bit values (0 = plane 1, 1 = plane 2, 2 = both planes)


		// Don't have enough colors to split into 3 bits,
		// Each non-zero pixel is taken to be bit 1
		var oneColorMode = true;
		var colors = [
			{r:0, g: 0, b: 0},
			{r:0, g: 0, b: 0},
			{r:0, g: 0, b: 0},
		];
		if (colorPalette.length >= 3) {
			oneColorMode = false;
			// Parse the RGB of the first three colors and setup the bit masks
			colors[0] = window.tinycolor(colorPalette[0]).toRgb();
			colors[1] = window.tinycolor(colorPalette[1]).toRgb();
			colors[2] = window.tinycolor(colorPalette[2]).toRgb();
		}

		var allFrames = [];

		// For each frame get the image bytes and map them into a bit pattern in layers
		// oneColorMode = true => 1 layer
		// oneColorMode = false > 2 layers (3 colors)
		for (var frameNr = 0; frameNr < this.piskelController.getFrameCount(); ++frameNr) {
			var canvas = this.piskelController.renderFrameAt(frameNr, true);
			var img = pskl.utils.CanvasUtils.getImageDataFromCanvas(canvas);

			var pixels = new Uint8Array(numPixels);
			allFrames[frameNr] = pixels;
			
			var idx = 0;
			for (var i = 0; i < numPixels; idx+=4, ++i)
			{
				pixels[i] = 0;

				if (oneColorMode) {
					if (img[idx] !== 0 || img[idx+1] !== 0 || img[idx+2] !== 0)
					{
						pixels[i] = 1;
					}
				} else {
					// Match one of the colors in colors[]
					for (var c = 0; c < 3; ++c) {
						if (img[idx] === colors[c].r && img[idx+1] === colors[c].g && img[idx+2] === colors[c].b)
						{
							pixels[i] = c+1;
							break;
						}
					}
				}
			}
		}

		this.generateFromPixelInfo_(allFrames, frameNr, oneColorMode ? 1 : 2);
	}

	/**
	 * Each bit set in a layer (no matter what color) is taken into account
	 * Each layer forms a new player
	 */
	ns.AtariExportController.prototype.fromLayersExport_ = function () {
		var width = this.piskelController.getWidth();
		var height = this.piskelController.getHeight();
		var numPixels = width * height;

		var allFrames = [];
		var layerValue = 1;
		for (var layerNr = 0; this.piskelController.hasLayerAt(layerNr); layerNr++) {
			if (layerNr >= 2) break;			// Too many layers! We only look at the first 2

			var layer = this.piskelController.getLayerAt(layerNr);

			for (var frameNr = 0; frameNr < this.piskelController.getFrameCount(); ++frameNr) {
				if (layerNr === 0) {
					allFrames[frameNr] = new Uint8Array(numPixels);
				}
				var canvas = pskl.utils.LayerUtils.renderFrameAt(layer, frameNr, true);
				var img = pskl.utils.CanvasUtils.getImageDataFromCanvas(canvas);

				var pixels = allFrames[frameNr];

				var idx = 0;
				for (var i = 0; i < numPixels; idx += 4, ++i) {
					if (img[idx] !== 0 || img[idx + 1] !== 0 || img[idx + 2] !== 0) {
						pixels[i] |= layerValue;
					}
				}
			}

			layerValue = layerValue << 1;
		}

		this.generateFromPixelInfo_(allFrames, this.piskelController.getFrameCount(), layerNr);
	}

	/**
	 * Generate the assmbler source code to represent the pixel bit planes.
	 * Players are 8 bits wide, so the output is done in batches of 8 pixels
	 * @param {array} allFrames All the bit information for each frame of the animation. 0,1,2,3 are the only valid values
	 * @param {number} nrFrames How many frames are there to this anymation
	 * @param {number} nrLayers Hoew many bit planes/layers are used. 1 or 2
	 */
	ns.AtariExportController.prototype.generateFromPixelInfo_ = function(allFrames, nrFrames, nrLayers) {
		var width = this.piskelController.getWidth();
		var height = this.piskelController.getHeight();
		// Get the name that each .byte sequence that is exported will start with
		var basename = this.atariSpritePrefixInput.value;
		var asmName = basename + this.getPiskelName_().replace(' ', '_');
		var fileName = this.getPiskelName_() + '.asm';

		var frameBaseName = this.atariSpriteFramePrefixInput.value.replace(' ','');
		// Some output naming conventions used
		// One column players use Frm
		// Two column players use Left and Right
		// Three column players use Left, Mid, Right
		// Four column players use 0,1,2,3

		// How many columns of data are to be generated. Depends on the width
		// 1-8 = 1, 9-16 = 2
		var nrColumns = ~~((width-1)/8)+1;

		var columnName = [];
		switch (nrColumns) {
			case 1: columnName[0] = 'Frm'; break;
			case 2: columnName[0] = 'Left'; columnName[1] = 'Right'; break;
			case 3: columnName[0] = 'Left'; columnName[1] = 'Mid'; columnName[2] = 'Right'; break;
			default:
				for (var columnNr = 0; columnNr < nrColumns; ++columnNr) {
					columnName[columnNr] = 'Frm'+columnNr;
				}
		}

		var pmStr = '; asm export of piskel sprite:' + this.getPiskelName_() + '\n';
		pmStr += '; # frames = ' + nrFrames + '\n';
		pmStr += '; # nrLayers = ' + nrLayers + '\n';
		pmStr += '; # columns = ' + nrColumns + '\n';
		pmStr += '; width = ' + width + '\n';
		pmStr += '; height = ' + height + '\n';
		pmStr += asmName + '    ; player data for each layer per column follows\n'

		for (var layerNr = 0; layerNr < nrLayers; ++layerNr) {
			pmStr += '\n; Layer ' + layerNr + '\n';

			var layerBit = 1 << layerNr;
			// The sprite it output in columns from left to right
			for (var columnNr = 0; columnNr < nrColumns; ++columnNr) {
				for (var frameNr = 0; frameNr < nrFrames; ++frameNr) {
					var frameName = frameBaseName + columnName[columnNr] + frameNr + '_lvl' + layerNr + '_col' + columnNr;
					pmStr += frameName + ' .byte ';

					var pixels = allFrames[frameNr];

					for (var y = 0; y < height; ++y) {
						var idx = columnNr*8 + y * width;

						var byte = 0;			// Convert the bits from the pixel data into this store
						var or = 128;
						for (var bitpos = 0; bitpos < 8; ++bitpos) {
							var hit = pixels[idx] & layerBit;
							++idx;
							if (hit)
								byte |= or;
							or = or >> 1;
						}
						if (y > 0)
							pmStr += ","
						pmStr += this.asmHex(byte);
					}
					pmStr += '\n';
				}
				pmStr += '\n';
			}
		}

		pskl.utils.BlobUtils.stringToBlob(pmStr, function (blob) {
			pskl.utils.FileUtils.downloadAsFile(blob, fileName);
		}.bind(this), 'application/text');
	}

	ns.AtariExportController.prototype.getPiskelName_ = function () {
		return this.piskelController.getPiskel().getDescriptor().name;
	};

	ns.AtariExportController.prototype.rgbToCHex = function (r, g, b, a) {
		var hexStr = '0x';
		hexStr += ('00' + a.toString(16)).substr(-2);
		hexStr += ('00' + b.toString(16)).substr(-2);
		hexStr += ('00' + g.toString(16)).substr(-2);
		hexStr += ('00' + r.toString(16)).substr(-2);
		return hexStr;
	};
	ns.AtariExportController.prototype.asmHex = function (byte) {
		var hexStr = '$';
		hexStr += ('00' + byte.toString(16)).substr(-2);
		return hexStr;
	};
})();
