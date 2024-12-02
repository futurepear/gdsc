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

function googleSignIn() {
    const query = {
        client_id: "499910070291-r9eg4fsor7v4arqb2i2h652l4tvodiu3.apps.googleusercontent.com",
        redirect_uri: "http://localhost:3000/auth/google/google-callback/oauth/login",
        response_type: "code",
        scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    };
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams(query).toString();
    window.location.href = url.toString()
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