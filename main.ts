// --- Tiny2Dライブラリの型定義（コンパイルエラー回避用） ---
declare var Engine: any;
declare var CircleEntity: any;
declare var RectangleEntity: any;
declare var BodyDynamic: any;
declare var BodyStatic: any;

// --- 型定義とインターフェース ---
interface Point3D {
    x: number;
    y: number;
    z: number;
}

// Tiny2Dオブジェクト用の拡張インターフェース
interface ExtendedCircleEntity {
    x: number;
    y: number;
    radius: number;
    cube?: Cube;
    onhit?: () => void;
}

// --- クラス定義 ---
class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    normalize(): this {
        const x = this.x, y = this.y, z = this.z;
        const scale = 1 / Math.sqrt(x * x + y * y + z * z);
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
        return this;
    }
}

class Surface {
    pos: Point3D[];
    type: string;
    norm: Vec3;
    cZ: number;

    constructor(polygon: Point3D[], type: string) {
        this.pos = polygon;
        this.type = type;

        const p1 = polygon[0]!;
        const p2 = polygon[1]!;
        const p3 = polygon[2]!;
        const p = new Vec3(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
        const q = new Vec3(p1.x - p3.x, p1.y - p3.y, p1.z - p3.z);
        const n = new Vec3(
            p.y * q.z - p.z * q.y,
            p.z * q.x - p.x * q.z,
            p.x * q.y - p.y * q.x
        );
        this.norm = n.normalize();
        this.cZ = (p1.z + p2.z + p3.z) / 3;
    }
}

class Cube {
    pos: Point3D[] = [];
    type: string;
    vertices: Point3D[];
    polygons: number[][];

    constructor(x: number, y: number, z: number, w: number, h: number, d: number, type: string) {
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

    getSurfaces(): Surface[] {
        const r: Surface[] = [];
        for (let i = 0; i < this.polygons.length; i++) {
            const indices = this.polygons[i]!;
            const p: Point3D[] = [];
            for (let j = 0; j < indices.length; j++) {
                p.push(this.pos[indices[j]!]!);
            }
            if (this.type === "block" || (this.type !== "block" && i === 4)) {
                r.push(new Surface(p, this.type));
            }
        }
        return r;
    }

    setCamera(cameraX: number, cameraY: number, cameraZ: number, mRotX: number[], mRotY: number[]): void {
        for (let i = 0; i < this.vertices.length; i++) {
            const c = this.vertices[i]!;

            let x = c.x - cameraX;
            let y = c.y - cameraY;
            let z = c.z;

            const p = (mRotY[0] ?? 0) * x + (mRotY[1] ?? 0) * y + (mRotY[2] ?? 0) * z;
            const q = (mRotY[3] ?? 0) * x + (mRotY[4] ?? 0) * y + (mRotY[5] ?? 0) * z;
            const r = (mRotY[6] ?? 0) * x + (mRotY[7] ?? 0) * y + (mRotY[8] ?? 0) * z;

            x = (mRotX[0] ?? 0) * p + (mRotX[1] ?? 0) * q + (mRotX[2] ?? 0) * r;
            y = (mRotX[3] ?? 0) * p + (mRotX[4] ?? 0) * q + (mRotX[5] ?? 0) * r;
            z = (mRotX[6] ?? 0) * p + (mRotX[7] ?? 0) * q + (mRotX[8] ?? 0) * r;

            this.pos[i] = { x: x, y: y, z: z - cameraZ };
        }
    }
}

// --- グローバル変数 (var で安全に宣言のみを行う) ---
var engine: any;
var ctx: CanvasRenderingContext2D;
var keymap: boolean[] = [];
var cubes: Cube[] = [];
var images: Cube[] = [];
var timer: number;
var ball: any & ExtendedCircleEntity;
var sound: HTMLAudioElement;
var count = 0;
var rotY = 0;
var rotX = 1.2;

var ballImg: HTMLImageElement;
var pin0Img: HTMLImageElement;
var pin1Img: HTMLImageElement;
var light: Vec3; // 初期化を init に逃がすことでエラーを防ぐ

function random(v: number): number {
    return Math.floor(Math.random() * v);
}

// --- メインロジック ---
function init(): void {
    // ライトベクトルの初期化
    light = new Vec3(0.5, -0.8, -0.2).normalize();

    // HTML要素の読み込み
    ballImg = document.getElementById("ballImg") as HTMLImageElement;
    pin0Img = document.getElementById("pin0Img") as HTMLImageElement;
    pin1Img = document.getElementById("pin1Img") as HTMLImageElement;
    sound = new Audio("sound0.mp3");

    const canvas = document.getElementById("field") as HTMLCanvasElement;
    ctx = canvas.getContext("2d")!;
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
            const pin = new CircleEntity(xpos, ypos, 10, BodyStatic, 0.8) as ExtendedCircleEntity;
            pin.cube = cube;
            pin.onhit = function (this: ExtendedCircleEntity) {
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

    window.onkeydown = (e: KeyboardEvent) => { keymap[e.keyCode] = true; };
    window.onkeyup = (e: KeyboardEvent) => { keymap[e.keyCode] = false; };
    timer = setInterval(tick, 25) as unknown as number;
}

function tick(): void {
    if (keymap[37]) { rotY -= 0.01; }  // left
    if (keymap[39]) { rotY += 0.01; }  // right
    if (keymap[38]) { rotX += 0.01; }  // up
    if (keymap[40]) { rotX -= 0.01; }  // down

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

function paint(): void {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 600, 600);

    let surfaces: Surface[] = [];
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
            const v = s.pos[i]!;
            if (v.z <= 0) continue;
            const x = v.x / v.z * 1200 + 300;
            const y = -v.y / v.z * 1200 + 300;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
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
        const p0 = s.pos[0]!;
        const p1 = s.pos[1]!;
        const p3 = s.pos[3]!;
        
        let x = (p0.x + p3.x) / 2;
        let y = (p0.y + p1.y) / 2;
        const z = p0.z;
        const w = Math.abs(p3.x - p0.x);
        x = x / z * 1200 + 300;
        y = -y / z * 1200 + 300;
        let img!: HTMLImageElement;
        switch (s.type) {
            case "pin0": img = pin0Img; break;
            case "pin1": img = pin1Img; break;
            case "ball": img = ballImg; break;
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