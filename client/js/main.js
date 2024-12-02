const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 1920;
canvas.height = 1080;

let filePNG = new Image();
filePNG.src = "/img/file.png";
function mix(a, b, t) {
    return a * t + (1 - t) * b;
}
function $(x) {
    return document.getElementById(x);
}
function clamp(x, min, max) {
    if (x < min) return min;
    if (x > max) return max;
    return x;
}
function mod(a, b) {
    return ((a % b) + b) % b;
}
function logout() {
    document.cookie.split(";").forEach(cookie => {
        let a = cookie.indexOf("=");
        let name = a > -1 ? cookie.substring(0, a) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
    });
    localStorage.removeItem("username");
    window.location.reload();
    
}
function gotologin() {
    window.location.href = "/login"
}

function drawCoolThing(x, y, slope = 0, seed = 0, alphaFactor = 3) {
    let t = Date.now() / 1000;

    let max = (canvas.width - x) / 5;
    for (let i = 0; i < max; i++) {
        ctx.beginPath();
        let f = i / max;
        let d = Math.sin(i / 100 + t / 4 + seed * 5.23) * 150 + slope * f;
        let d2 = Math.sin((i+1) / 100 + t / 4 + seed * 5.23) * 150 + slope * (i+1)/max;

        let w = Math.log(i) * 12 + 2;
        let w2 = Math.log(i + 1) * 12 + 2;
        ctx.moveTo(x + i * 5, y - w + d);
        ctx.lineTo(x + (i + 1) * 5, y - w2 + d2);
        ctx.lineTo(x + (i + 1) * 5, y + w2 + d2);
        ctx.lineTo(x + i * 5, y + w + d);

        let colors = [
            `rgb(${mix(130, 45, f)}, 21, ${mix(214, 255, f)})`,
            `rgb(${mix(24, 255, f)}, 21, ${mix(255, 255, f)})`,
        ]
        ctx.fillStyle = colors[seed%(colors.length)];
        ctx.globalAlpha = Math.round(f * 1000) / 1000 / alphaFactor
        ctx.fill();
    }

}

function drawFilesMoving(alpha = 0.25, falloff = 0, v = 20) {

    let t = Date.now() / 1000;

    let n = 20;
    let size = canvas.width / n;
    let rows = canvas.height / (size+20);
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
            ctx.globalAlpha = clamp(alpha - falloff * i, 0, 1);
            let dir = -2 * (i % 2) + 1;
            ctx.drawImage(filePNG, size * i, mod((size+20) * j + t * v*dir, canvas.height + size)-size/2, size, size);
        }
    }
}

function openLoading(){
    $("loading").style.display = "flex";
}
function closeLoading(){
    $("loading").style.display = "none";
}