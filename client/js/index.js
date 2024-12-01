
function addFile(title, author, src) {
    let id = src;
    console.log(id);
    let html = `
    <div class="file" project=${id}>
        <div class="div" style="background-image: url(https://r2.alupoaei.com/pdfapp/files/${src}/base.png)" project=${id}></div>
        <h2 class="purpletext" project=${id}>${title}</h2>
        <p class="purpletext">By: ${author}</p>
    </div>
    `;
    document.getElementById("files").innerHTML += html;
}

document.addEventListener("click", (e) => {
    let project = e.target.getAttribute("project");
    if (project == null) return;

    window.location.href = "/editor/" + project;
});

function updateUserInfo(user) {
    $("username").innerHTML = user.name;
    $("logout").style.display = "block";
    $("login").style.display = "none";
    $("create").style.display = "block";
}

async function updateUser() {
    let res = await fetch("/api/my-info");
    res = await res.json();
    if (res.loggedin) {
        updateUserInfo(res);
        localStorage.setItem("username", res.name);
    } else {
        localStorage.removeItem("username");
    }
}

async function populateFiles() {
    $("files").innerHTML = "";
    openLoading();
    let files = await fetch("/filesList");
    files = await files.json();
    for (let i in files) {
        addFile(files[i].title, files[i].author, files[i].file);
    }
    closeLoading();
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