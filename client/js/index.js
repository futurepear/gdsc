
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

function updateUserInfo(user) {
    $("username").innerHTML = user.name;
    $("logout").style.display = "block";
    $("login").style.display = "none";
}

async function updateUser() {
    let res = await fetch("/api/my-info");
    res = await res.json();
    if (res.loggedin) updateUserInfo(res);
}
function gotologin() {
    window.location.href = "/login"
}
function populateFiles() {
    for (let i = 0; i < 50; i++)
        addFile();
}
function create() {
    window.location.href = "/editor#upload"
}

populateFiles();
updateUser();
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