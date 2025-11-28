function setup(): void {
  createCanvas(400, 400);
}

function draw(): void {
  background(220);

  // Draw a simple circle that follows the mouse
  fill(100, 150, 255);
  noStroke();
  ellipse(mouseX, mouseY, 50, 50);
}
