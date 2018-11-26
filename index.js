import * as brainjs from 'brainjs';

function DrawCanvas(el) {
    const ctx = el.getContext('2d');
    const pixel = 20;

    let is_mouse_down = false;

    let canv = {};

    canv.width = 500;
    canv.height = 500;

    this.drawLine = function (x1, y1, x2, y2, color = 'gray') {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineJoin = 'miter';
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    this.drawCell = function (x, y, w, h) {
        ctx.fillStyle = 'blue';
        ctx.strokeStyle = 'blue';
        ctx.lineJoin = 'miter';
        ctx.lineWidth = 1;
        ctx.rect(x, y, w, h);
        ctx.fill();
    };

    this.clear = function () {
        el.width = canv.width;
        el.height = canv.height;
        ctx.clearRect(0, 0, canv.width, canv.height);

        document.getElementById('choose-type').style.display = 'none';
    };

    this.drawGrid = function () {
        const w = canv.width;
        const h = canv.height;
        const p = w / pixel;

        const xStep = w / p;
        const yStep = h / p;

        for (let x = 0; x < w; x += xStep) {
            this.drawLine(x, 0, x, h);
        }

        for (let y = 0; y < h; y += yStep) {
            this.drawLine(0, y, w, y);
        }
    };

    this.findFillRectangles = function (draw = false) {
        const w = canv.width;
        const h = canv.height;
        const p = w / pixel;

        const xStep = w / p;
        const yStep = h / p;

        let vector = [];
        let __draw = [];

        for (let x = 0; x < w; x += xStep) {
            for (let y = 0; y < h; y += yStep) {
                const imageData = ctx.getImageData(x, y, xStep, yStep);

                let nonEmptyPixels = 0;
                for (let i = 0; i < imageData.data.length; i += 10) {
                    const isEmptyPixel = imageData.data[i] === 0;

                    if (!isEmptyPixel) {
                        nonEmptyPixels += 1;
                    }
                }

                if (nonEmptyPixels > 1 && draw) {
                    __draw.push([x, y, xStep, yStep]);
                }

                vector.push(nonEmptyPixels > 1 ? 1 : 0);
            }
        }

        if (draw) {
            this.clear();
            this.drawGrid();

            for (let _d in __draw) {
                this.drawCell(
                    __draw[_d][0],
                    __draw[_d][1],
                    __draw[_d][2],
                    __draw[_d][3]
                );
            }
        }

        return vector;
    };

    el.addEventListener('mousedown', function (e) {
        is_mouse_down = true;
        ctx.beginPath();
    });

    el.addEventListener('mouseup', function (e) {
        is_mouse_down = false;
    });

    el.addEventListener('mousemove', function (e) {
        if (is_mouse_down) {
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = pixel;

            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(e.offsetX, e.offsetY, pixel / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        }
    });
}

let vector = [];
let nn = null;
let trainData = [];

const d = new DrawCanvas(document.getElementById('canvas'));
d.clear();

document.getElementById('clear').addEventListener('click', function (e) {
    d.clear();
});

document.getElementById('validate').addEventListener('click', function (e) {
    vector = d.findFillRectangles(true);

    document.getElementById('choose-type').style.display = 'block';
});

document.getElementById('positive').addEventListener('click', function (e) {
    trainData.push({
        input: vector,
        output: {
            positive: 1
        }
    });

    console.log(trainData);
    d.clear();
});
document.getElementById('negative').addEventListener('click', function (e) {
    trainData.push({
        input: vector,
        output: {
            negative: 1
        }
    });

    console.log(trainData);
    d.clear();
});

document.getElementById('build').addEventListener('click', function (e) {
    nn = new brainjs.NeuralNetwork();
    nn.train(trainData, {log: true});

    const res = nn.run(d.findFillRectangles());
    console.log(res);

    let resText = 'Did\'nt detect it...';

    if (res.positive > res.negative) {
        resText = 'Positive';
        document.getElementById('result').color = '#0c0';
    } else if (res.positive < res.negative) {
        resText = 'Negative';
        document.getElementById('result').color = '#c00';
    }

    document.getElementById('result').innerHTML = resText;
    d.clear();
});
