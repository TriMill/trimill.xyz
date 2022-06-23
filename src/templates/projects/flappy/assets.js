function loadAssets() {
  loadImage('/static/i/flappy/background1.png', function(img) {
    bgImage1 = img;
    console.log('Loaded image assets/background1.png')
  }, function(evt) {
    console.error('Failed to load image assets/background1.jpg: ', evt);
    bgImage1 = createImage(160, 32);
  });
  loadImage('/static/i/flappy/background2.png', function(img) {
    bgImage2 = img;
    console.log('Loaded image assets/background2.png')
  }, function(evt) {
    console.error('Failed to load image assets/background2.jpg: ', evt);
    bgImage2 = createImage(160, 32);
  });
  loadImage('/static/i/flappy/bird.png', function(img) {
    birdImage = img;
    console.log('Loaded image assets/bird.png')
  }, function(evt) {
    console.error('Failed to load image assets/bird.jpg: ', evt);
    birdImage = createImage(32, 32);
  });
}
