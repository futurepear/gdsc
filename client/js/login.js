function render(alpha) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCoolThing(200, 200, 0, 1, alpha);
    drawCoolThing(400, 800, -20, 4, alpha);
    drawCoolThing(200, 600, -800, 6, alpha);
    drawCoolThing(400, 800, 500, 3, alpha);

    drawFilesMoving(0.15);

    requestAnimationFrame(() => {
        render(alpha)
    });
}
render(2);