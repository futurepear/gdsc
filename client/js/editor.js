import pdfjsDist from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8/+esm';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs";

const editorCanvas = $("editor");
const ectx = editorCanvas.getContext("2d");

const editor = {
    pages: [],
    renderPage: (i) => {
        let page = editor.pages[i];
        page.page.render(page.renderContext);
    },
    layers: []
}

window.viewPage = function (i) {
    editor.renderPage(i);
}

$("pdf").onchange = async () => {
    let fileReader = new FileReader();

    fileReader.onload = async () => {
        pdfjsLib.getDocument(fileReader.result).promise.then(async (pdf) => {

            console.log(pdf);
            let n = pdf.numPages;
            console.log(n);

            for (let i = 1; i < n + 1; i++) {
                let page = await pdf.getPage(i);
                let viewport = page.getViewport({ scale: 1 });
                let outputScale = 1;// window.devicePixelRatio || 1;
                editorCanvas.width = Math.floor(viewport.width * outputScale);
                editorCanvas.height = Math.floor(viewport.height * outputScale);
                editorCanvas.style.aspectRatio = viewport.width + "/" + viewport.height;
                let transform = [outputScale, 0, 0, outputScale, 0, 0];
                let renderContext = { canvasContext: ectx, viewport: viewport, transform: null };
                editor.pages.push({ page: page, renderContext: renderContext });
                $("pages").innerHTML += `<button class="glass" onclick=viewPage(${i - 1})>${i}</button>`;
            }
            viewPage(0);
        });

    }

    fileReader.readAsArrayBuffer($("pdf").files[0]);
}

function toCanvasSpace(pos) {
    return {
        x: (pos.x - editorCanvas.offsetLeft) / editorCanvas.offsetWidth * editorCanvas.width,
        y: (pos.y - editorCanvas.offsetTop) / editorCanvas.offsetHeight * editorCanvas.height
    };
}

let stroke = [];

function renderStroke(s) {
    ectx.beginPath();
    ectx.moveTo(s[0].x, s[1].y);
    for (let i = 1; i < s.length; i++) {
        ectx.quadraticCurveTo((s[i].x + s[i - 1].x) / 2, (s[i].y + s[i - 1].y) / 2, s[i].x, s[i].y);
    }
    ectx.stroke();
}
function draw(pos) {
    if (stroke.length > 0 && Math.hypot(stroke[stroke.length - 1].x - pos.x, stroke[stroke.length - 1].y - pos.y) < 2) return;
    stroke.push(pos);
    renderStroke(stroke);
}

document.addEventListener("mousemove", (e) => {
    draw(toCanvasSpace({ x: e.clientX, y: e.clientY }));
});

window.upload = async () => {
 

    editorCanvas.toBlob((blob) => {
        console.log(blob);
        fetch(`/uploadFile?title=TEST`, {
            method: 'POST',
            headers: {
                'Content-Type': 'image/png'
            },
            body: blob
        })
    });
}


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