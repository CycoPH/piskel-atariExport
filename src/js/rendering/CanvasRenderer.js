(function () {

  var ns = $.namespace('pskl.rendering');
  ns.CanvasRenderer = function (frame, zoom) {
    this.frame = frame;
    this.zoom = zoom;
    this.opacity_ = 1;
    this.transparentColor_ = 'white';
  };

  /**
   * Decide which color should be used to represent transparent pixels
   * Default : white
   * @param  {String} color the color to use either as '#ABCDEF' or 'red' or 'rgb(x,y,z)' or 'rgba(x,y,z,a)'
   */
  ns.CanvasRenderer.prototype.drawTransparentAs = function (color) {
    this.transparentColor_ = color;
  };

  ns.CanvasRenderer.prototype.setOpacity = function (opacity) {
    this.opacity_ = opacity;
  };

  ns.CanvasRenderer.prototype.render = function  () {
    var canvas = this.createCanvas_();
    var xZoom = this.zoom;
    var yZoom = this.zoom;
    if (xZoom < 0) {
      // -ve zoom means Atari scale zoom
      // Switch -ve => +ve and reduce Y zoom
      xZoom = -xZoom;
      yZoom = xZoom / 1.5;
    }

    // Draw in canvas
    pskl.utils.FrameUtils.drawToCanvas(this.frame, canvas, this.transparentColor_, this.opacity_);

    var scaledCanvas = this.createCanvas_(xZoom);
    var scaledContext = scaledCanvas.getContext('2d');
    pskl.utils.CanvasUtils.disableImageSmoothing(scaledCanvas);
    scaledContext.scale(xZoom, yZoom);
    scaledContext.drawImage(canvas, 0, 0);

    return scaledCanvas;
  };

  ns.CanvasRenderer.prototype.createCanvas_ = function (zoom) {
    zoom = zoom || 1;
    var width = this.frame.getWidth() * zoom;
    var height = this.frame.getHeight() * zoom;
    return pskl.utils.CanvasUtils.createCanvas(width, height);
  };
})();
