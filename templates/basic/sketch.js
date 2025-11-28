function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Draw a simple circle that follows the mouse
  fill(100, 150, 255);
  noStroke();
  ellipse(mouseX, mouseY, 50, 50);
}
