
function addFile() {
    let html = `
    <div class="file">
        <img/>
        <h2 class="purpletext">Title</h2>
        <p class="purpletext">Author</p>
    </div>
    `;
    document.getElementById("files").innerHTML += html;
}


function populateFiles() {
    for (let i = 0; i < 50; i++)
        addFile();
}

populateFiles();

function render(alpha) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCoolThing(200, 200, 0, 1, alpha);
    drawCoolThing(400, 800, -20, 4, alpha);
    drawCoolThing(200, 600, -800, 6, alpha);
    drawCoolThing(400, 800, 500, 3, alpha);

    drawFilesMoving(0.2, 0.04);

    requestAnimationFrame(() => {
        render(alpha)
    });
}
render(3);