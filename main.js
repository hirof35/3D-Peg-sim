"use strict";
// --- クラス定義 ---
class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    normalize() {
        const x = this.x, y = this.y, z = this.z;
        const scale = 1 / Math.sqrt(x * x + y * y + z * z);
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
        return this;
    }
}
class Surface {
    constructor(polygon, type) {
        this.pos = polygon;
        this.type = type;
        const p1 = polygon[0];
        const p2 = polygon[1];
        const p3 = polygon[2];
        const p = new Vec3(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
        const q = new Vec3(p1.x - p3.x, p1.y - p3.y, p1.z - p3.z);
        const n = new Vec3(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
        this.norm = n.normalize();
        this.cZ = (p1.z + p2.z + p3.z) / 3;
    }
}
class Cube {
    constructor(x, y, z, w, h, d, type) {
        this.pos = [];
        this.type = type;
        this.vertices = [
            { x: x - w, y: y - h, z: z + d },
            { x: x - w, y: y + h, z: z + d },
            { x: x + w, y: y + h, z: z + d },
            { x: x + w, y: y - h, z: z + d },
            { x: x - w, y: y - h, z: z - d },
            { x: x - w, y: y + h, z: z - d },
            { x: x + w, y: y + h, z: z - d },
            { x: x + w, y: y - h, z: z - d },
        ];
        this.polygons = [
            [2, 1, 5, 6],
            [0, 1, 2, 3],
            [4, 5, 1, 0],
            [2, 6, 7, 3],
            [7, 6, 5, 4],
            [0, 3, 7, 4]
        ];
    }
    getSurfaces() {
        const r = [];
        for (let i = 0; i < this.polygons.length; i++) {
            const indices = this.polygons[i];
            const p = [];
            for (let j = 0; j < indices.length; j++) {
                p.push(this.pos[indices[j]]);
            }
            if (this.type === "block" || (this.type !== "block" && i === 4)) {
                r.push(new Surface(p, this.type));
            }
        }
        return r;
    }
    setCamera(cameraX, cameraY, cameraZ, mRotX, mRotY) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        for (let i = 0; i < this.vertices.length; i++) {
            const c = this.vertices[i];
            let x = c.x - cameraX;
            let y = c.y - cameraY;
            let z = c.z;
            const p = ((_a = mRotY[0]) !== null && _a !== void 0 ? _a : 0) * x + ((_b = mRotY[1]) !== null && _b !== void 0 ? _b : 0) * y + ((_c = mRotY[2]) !== null && _c !== void 0 ? _c : 0) * z;
            const q = ((_d = mRotY[3]) !== null && _d !== void 0 ? _d : 0) * x + ((_e = mRotY[4]) !== null && _e !== void 0 ? _e : 0) * y + ((_f = mRotY[5]) !== null && _f !== void 0 ? _f : 0) * z;
            const r = ((_g = mRotY[6]) !== null && _g !== void 0 ? _g : 0) * x + ((_h = mRotY[7]) !== null && _h !== void 0 ? _h : 0) * y + ((_j = mRotY[8]) !== null && _j !== void 0 ? _j : 0) * z;
            x = ((_k = mRotX[0]) !== null && _k !== void 0 ? _k : 0) * p + ((_l = mRotX[1]) !== null && _l !== void 0 ? _l : 0) * q + ((_m = mRotX[2]) !== null && _m !== void 0 ? _m : 0) * r;
            y = ((_o = mRotX[3]) !== null && _o !== void 0 ? _o : 0) * p + ((_p = mRotX[4]) !== null && _p !== void 0 ? _p : 0) * q + ((_q = mRotX[5]) !== null && _q !== void 0 ? _q : 0) * r;
            z = ((_r = mRotX[6]) !== null && _r !== void 0 ? _r : 0) * p + ((_s = mRotX[7]) !== null && _s !== void 0 ? _s : 0) * q + ((_t = mRotX[8]) !== null && _t !== void 0 ? _t : 0) * r;
            this.pos[i] = { x: x, y: y, z: z - cameraZ };
        }
    }
}
// --- グローバル変数 (var で安全に宣言のみを行う) ---
var engine;
var ctx;
var keymap = [];
var cubes = [];
var images = [];
var timer;
var ball;
var sound;
var count = 0;
var rotY = 0;
var rotX = 1.2;
var ballImg;
var pin0Img;
var pin1Img;
var light; // 初期化を init に逃がすことでエラーを防ぐ
function random(v) {
    return Math.floor(Math.random() * v);
}
// --- メインロジック ---
function init() {
    // ライトベクトルの初期化
    light = new Vec3(0.5, -0.8, -0.2).normalize();
    // HTML要素の読み込み
    ballImg = document.getElementById("ballImg");
    pin0Img = document.getElementById("pin0Img");
    pin1Img = document.getElementById("pin1Img");
    sound = new Audio("sound0.mp3");
    const canvas = document.getElementById("field");
    ctx = canvas.getContext("2d");
    ctx.font = "20pt Arial";
    engine = new Engine(-100, -100, 800, 1400, 0, 0);
    const blocks = [
        { x: 25, y: 600, w: 25, h: 600 },
        { x: 575, y: 600, w: 25, h: 600 }
    ];
    blocks.forEach((c) => {
        cubes.push(new Cube(c.x, c.y, 0, c.w, c.h, 25, "block"));
        const r = new RectangleEntity(c.x - c.w, c.y - c.h, c.w * 2, c.h * 2);
        engine.entities.push(r);
    });
    images.push(new Cube(0, 0, 0, 15, 15, 15, "ball"));
    ball = new CircleEntity(random(300) + 100, 1000, 15, BodyDynamic, 0.9);
    engine.entities.push(ball);
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 7 + (y % 2); x++) {
            const xpos = x * 65 + ((y % 2) ? 70 : 100);
            const ypos = y * 150 + 100;
            const cube = new Cube(xpos, ypos, 0, 10, 10, 10, "pin0");
            images.push(cube);
            const pin = new CircleEntity(xpos, ypos, 10, BodyStatic, 0.8);
            pin.cube = cube;
            pin.onhit = function () {
                sound.play();
                if (this.cube && this.cube.type === "pin0") {
                    this.cube.type = "pin1";
                    if (++count === 37) {
                        clearInterval(timer);
                        timer = 0; // タイマークリア
                        paint();
                    }
                }
            };
            engine.entities.push(pin);
        }
    }
    window.onkeydown = (e) => { keymap[e.keyCode] = true; };
    window.onkeyup = (e) => { keymap[e.keyCode] = false; };
    timer = setInterval(tick, 25);
}
function tick() {
    if (keymap[37]) {
        rotY -= 0.01;
    } // left
    if (keymap[39]) {
        rotY += 0.01;
    } // right
    if (keymap[38]) {
        rotX += 0.01;
    } // up
    if (keymap[40]) {
        rotX -= 0.01;
    } // down
    rotX = Math.max(1.0, Math.min(1.3, rotX));
    rotY = Math.max(-0.5, Math.min(0.5, rotY));
    engine.setGravity(-rotY * 20, -rotX * 5);
    engine.step(0.01);
    let c = Math.cos(rotY);
    let s = Math.sin(rotY);
    const MatrixRotY = [c, 0, s, 0, 1, 0, -s, 0, c];
    c = Math.cos(rotX);
    s = Math.sin(rotX);
    const MatrixRotX = [1, 0, 0, 0, c, -s, 0, s, c];
    cubes.forEach((b) => {
        b.setCamera(300, 300, -1500, MatrixRotX, MatrixRotY);
    });
    if (ball.y < 0 || ball.y > 1200) {
        ball.x = random(300) + 100;
        ball.y = 1000;
    }
    images[0] = new Cube(ball.x, ball.y, 0, 10, 10, 10, "ball");
    images.forEach((b) => {
        b.setCamera(300, 300, -1500, MatrixRotX, MatrixRotY);
    });
    paint();
}
function paint() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 600, 600);
    let surfaces = [];
    cubes.forEach((b) => {
        surfaces = surfaces.concat(b.getSurfaces());
    });
    surfaces.sort((a, b) => b.cZ - a.cZ);
    surfaces.forEach((s) => {
        const p = (s.norm.x * light.x + s.norm.y * light.y + s.norm.z * light.z);
        const ratio = (p + 1) / 2;
        const rgb = Math.floor(255 * ratio);
        ctx.fillStyle = "rgba(" + rgb + "," + rgb + "," + rgb + ",255)";
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const v = s.pos[i];
            if (v.z <= 0)
                continue;
            const x = v.x / v.z * 1200 + 300;
            const y = -v.y / v.z * 1200 + 300;
            if (i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    });
    surfaces = [];
    images.forEach((b) => {
        const firstSurface = b.getSurfaces()[0];
        if (firstSurface) {
            surfaces.push(firstSurface);
        }
    });
    surfaces.sort((a, b) => b.cZ - a.cZ);
    surfaces.forEach((s) => {
        const p0 = s.pos[0];
        const p1 = s.pos[1];
        const p3 = s.pos[3];
        let x = (p0.x + p3.x) / 2;
        let y = (p0.y + p1.y) / 2;
        const z = p0.z;
        const w = Math.abs(p3.x - p0.x);
        x = x / z * 1200 + 300;
        y = -y / z * 1200 + 300;
        let img;
        switch (s.type) {
            case "pin0":
                img = pin0Img;
                break;
            case "pin1":
                img = pin1Img;
                break;
            case "ball":
                img = ballImg;
                break;
        }
        ctx.save();
        ctx.translate(x - w / 2, y - w / 2);
        ctx.rotate(-rotY);
        ctx.drawImage(img, 0, 0, w, w);
        ctx.restore();
    });
    if (timer === 0) {
        ctx.fillStyle = "yellow";
        ctx.fillText("GAME OVER", 220, 250);
    }
}
//# sourceMappingURL=main.js.map