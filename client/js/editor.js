import pdfjsDist from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8/+esm';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs";

const editorCanvas = $("editor");
const ectx = editorCanvas.getContext("2d");

editorCanvas.width = 612;
editorCanvas.height = 792;

//account stuff
if (localStorage.getItem("username") != null) {
    $("username").innerHTML = localStorage.getItem("username");
    $("logout").style.display = "block";
    $("login").style.display = "none";
}

window.editor = {
    pages: [],
    pdfImages: [],
    layers: [[]],
    editLayer: 0,
    tool: "pointer",
    mousedown: false,
    activeElement: null,
    add: (x) => {
        editor.layers[editor.editLayer].push(x);
        editor.activeElement = x;
    },
    activeLayer: () => {
        return editor.layers[editor.editLayer];
    },
    drawPage: (x) => {
        if(editor.pdfImages.length > 0)
            ectx.drawImage(editor.pdfImages[x], 0, 0);
    },
    lastElem: () => {
        let layer = editor.layers[editor.editLayer];
        return layer[layer.length - 1];
    },
    active: () => {
        return editor.activeElement;
    },
    mouse: {
        x: 0,
        y: 0
    },
    brushSize: 1,
    fontSize: 20
}

class Element {
    constructor(color) {
        this.data = [];
        this.color = color;
    }
    add(x) {
        this.data.push(x);
    }
    render() {

    }
    //check if point intersects with the element
    contains() {
        return false;
    }
    collides(box) {
        return false;
    }
}

class Stroke extends Element {
    constructor(color, thickness, x, y) {
        super(color);
        this.thickness = thickness;
        super.add({ x: x, y: y });
    }
    add(pos) {
        if (this.data.length > 0 && Math.hypot(this.data[this.data.length - 1].x - pos.x, this.data[this.data.length - 1].y - pos.y) < 1.4) return;
        pos.x = Math.round(pos.x); pos.y = Math.round(pos.y);
        super.add(pos);
    }
    render() {
        ectx.lineCap = "round";
        ectx.lineJoin = "round";
        ectx.strokeStyle = this.color;
        ectx.lineWidth = this.thickness;
        ectx.beginPath();
        ectx.moveTo(this.data[0].x, this.data[0].y);
        for (let i = 1; i < this.data.length; i++) {
            ectx.quadraticCurveTo((this.data[i].x + this.data[i - 1].x) / 2, (this.data[i].y + this.data[i - 1].y) / 2, this.data[i].x, this.data[i].y);
        }
        ectx.stroke();
    }
    collides(box) {
        for (let i = 1; i < this.data.length; i++) {
            let p1 = this.data[i];
            let p2 = this.data[i - 1];
            //doing X pattern here instead of box cuz lazy
            let res = intersects(p1.x, p1.y, p2.x, p2.y, box.left, box.top, box.right, box.bottom)
                || intersects(p1.x, p1.y, p2.x, p2.y, box.left, box.bottom, box.right, box.top);
            if (res) return true;
        }
    }
}
class Text extends Element {
    constructor(color, size, x, y) {
        super(color);
        this.size = size;
        this.text = "";
        this.data = [x, y];
        this.active = true;
        this.width = 0;
        this.height = 0;
    }
    add(x) {
        if(this.active)
            this.text += x;
    }
    delete() {
        if(this.text.length > 0)
            this.text = this.text.substring(0, this.text.length - 1);
    }
    render(active) {
        ectx.fillStyle = this.color;
        ectx.font = `${this.size}px arial`;
        ectx.fillText(this.text, this.data[0], this.data[1]);
        if (active) {
            ectx.strokeStyle = "#3333FF";
            let a = ectx.measureText(this.text);
            ectx.lineWidth = 2;
            let h = a.actualBoundingBoxAscent + a.actualBoundingBoxDescent;
            this.width = a.width;
            this.height = h;
            ectx.strokeRect(this.data[0] - 2, this.data[1] - 2 - h, a.width + 4, h + 4);
        }
    }
    contains(p) {
        return (this.data[0] < p.x && p.x < this.data[0] + this.width && this.data[1] - this.height < p.y && p.y < this.data[1]);
    }
    collides(box) {
        return !(box.left > this.data[0] + this.width || box.right < this.data[0] || box.top > this.data[1] || box.bottom < this.data[1] - this.height);    
    }
}

if (window.location.hash == "#upload") {
    $("uploader").style.display = "flex";
}
if (window.location.href.split("/")[4]?.length > 2) {
    let project = window.location.href.split("/")[4];
    openLoading();
    let url = `https://r2.alupoaei.com/pdfapp/files/${project}/`;
    let pdf = new Image();
    pdf.src = url + "base.png";
    editor.pdfImages.push(pdf);
    pdf.onload = () => {
        renderEditor();
        closeLoading();
    }
}   
window.closeUploader = () => {
    $("uploader").style.display = "none";
    window.location.hash = "";
}

$("pdf").onchange = async () => {
    let fileReader = new FileReader();
    openLoading();
    fileReader.onload = async () => {
        pdfjsLib.getDocument(fileReader.result).promise.then(async (pdf) => {
            closeUploader();

            let n = pdf.numPages;
            for (let i = 1; i < 1+1; i++) {
                let page = await pdf.getPage(i);
                let viewport = page.getViewport({ scale: 1 });
                let outputScale = 1;// window.devicePixelRatio || 1;
                editorCanvas.width = Math.floor(viewport.width * outputScale);
                editorCanvas.height = Math.floor(viewport.height * outputScale);
                editorCanvas.style.aspectRatio = viewport.width + "/" + viewport.height;

                let o = new OffscreenCanvas(editorCanvas.width, editorCanvas.height);
                let octx = o.getContext("2d");

                let transform = [outputScale, 0, 0, outputScale, 0, 0];
                let renderContext = { canvasContext: octx, viewport: viewport, transform: null };
                editor.pages.push({ page: page, renderContext: renderContext });
                //$("pages").innerHTML += `<button class="glass" onclick=viewPage(${i - 1})>${i}</button>`;
                
                page.render(renderContext);
                editor.pdfImages.push(o);
                closeLoading();
                
            }
            renderEditor();
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


function renderLayer(layer) {
    for (let i in layer) {
        layer[i].render(layer[i] == editor.active());
    }
}
function renderEditor() {
    ectx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    editor.drawPage(0);

    for (let i in editor.layers)
        renderLayer(editor.layers[i]);

    if (editor.tool == "eraser" || editor.tool == "brush") {
        ectx.lineWidth = 1;
        ectx.strokeStyle = "gray";
        ectx.beginPath();
        ectx.arc(editor.mouse.x, editor.mouse.y, editor.brushSize, 0, Math.PI * 2);
        ectx.stroke();
    }
}
function color() {
    return $("color").value;
}

$("brushSize").onchange = () => {
    let value = parseInt($("brushSize").value);
    editor.brushSize = value;
}
$("fontSize").onchange = () => {
    let value = parseInt($("fontSize").value);
    editor.fontSize = value;

    let currentElem = editor.active();
    if (currentElem instanceof Text) {
        currentElem.size = editor.fontSize;
        renderEditor();
    }
}

//switch tools
document.addEventListener("mousedown", (e) => {
    let tool = e.target.getAttribute("tool");
    if (tool == null) return;
    document.querySelector(`i[tool=${editor.tool}]`).classList.remove("active");
    document.querySelector(`i[tool=${tool}]`).classList.add("active");
    editor.tool = tool;

    if (tool == "brush" || tool == "eraser") {
        $("brushTools").style.display = "flex";
    } else {
        $("brushTools").style.display = "none";
    }
    if (tool == "text") {
        $("textTools").style.display = "flex";
    } else {
        $("textTools").style.display = "none";
    }
});

function erase() {
    let layer = editor.activeLayer();
    let m = editor.mouse;
    let sz = editor.brushSize;
    if (sz < 10) sz = 10;
    let eraserBox = { left: m.x - sz, top: m.y - sz, right: m.x + sz, bottom: m.y + sz };
    for (let i = 0; i < layer.length; i++) {
        if (layer[i].collides(eraserBox)) {
            layer.splice(i, 1);
            i--;
        }
    }
}

editorCanvas.addEventListener("mousedown", (e) => {
    let pos = toCanvasSpace({ x: e.clientX, y: e.clientY });
    editor.mouse = pos;
    if (editor.tool == "brush") {
        //make new stroke
        editor.add(new Stroke(color(), editor.brushSize*2, pos.x, pos.y));
    }
    if (editor.tool == "text") {
        editor.add(new Text(color(), editor.fontSize, pos.x, pos.y));
    }
    if (editor.tool == "pointer") {
        let layer = editor.activeLayer();
        for (let i in layer) {
            if (layer[i] instanceof Text && layer[i].contains(pos)) {
                editor.activeElement = layer[i];
                renderEditor();
            }
        }
    }
    if (editor.tool == "eraser")
        erase();
    editor.mousedown = true;
});
document.addEventListener("mouseup", (e) => {
    editor.mousedown = false;
});

document.addEventListener("mousemove", (e) => {
    let pos = toCanvasSpace({ x: e.clientX, y: e.clientY });
    if(editor.mousedown && editor.tool == "brush")
        editor.active().add(pos);

    if (editor.mousedown && editor.tool == "eraser")
        erase();

    editor.mouse = pos;
    renderEditor();
});
document.addEventListener("keydown", (e) => {
    if (document.activeElement == $("projectTitle")) return;
    if (editor.lastElem() instanceof Text) {
        if (e.key.length == 1)
            editor.active().add(e.key);
        if (e.key == "Backspace")
            editor.active().delete();
        renderEditor();
    }


});

window.upload = async () => {
    let title = $("projectTitle").value;
    if (title.trim().length == 0) title = "Untitled Project";

    editorCanvas.toBlob((blob) => {

        fetch(`/uploadFile?title=${title}`, {
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



// :(
function intersects(a, b, c, d, p, q, r, s) {
    let det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
};