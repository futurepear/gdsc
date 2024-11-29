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

function error(x) {
    $("error").innerHTML = x;
}
async function createAccount() {
    let user = $("I-user").value;
    let pass = $("I-pass").value;
    let passC = $("I-passC").value;
    
    if (pass !== passC) return error("Passwords don't match");


    let result = await fetch("/api/createAccount", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: user, name: user, pass: pass })
    });
    result = await result.json();
    if (!result.success) {
        return error(result.reason);
    }
    window.location.reload();
}
async function login() {
    let user = $("I-user").value;
    let pass = $("I-pass").value;
    let result = await fetch("/api/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: user, pass: pass })
    });
    result = await result.json();
    if (!result.success) {
        return error(result.reason);
    }
    error("SUCCESS");
    window.location.href = "/";
}
function makeSignup() {
    let html = `
        <p class="purpletext2 smalltext">Username</p>
        <input class="input" id="I-user"/>
        <p class="purpletext2 smalltext" >Password</p>
        <input class="input" type="password" id="I-pass"/>
        <p class="purpletext2 smalltext" >Confirm Password</p>
        <input class="input" type="password" id="I-passC"/>
        <button class="button2" id="loginbutton" onclick="createAccount()">Sign up</button>
        <p id="error"></p>
    `;
    $("loginbox").innerHTML = html;
    $("action").innerHTML = "Sign up";

}

render(2);  