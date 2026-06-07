declare var Engine: any;
declare var CircleEntity: any;
declare var RectangleEntity: any;
declare var BodyDynamic: any;
declare var BodyStatic: any;
interface Point3D {
    x: number;
    y: number;
    z: number;
}
interface ExtendedCircleEntity {
    x: number;
    y: number;
    radius: number;
    cube?: Cube;
    onhit?: () => void;
}
declare class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number);
    normalize(): this;
}
declare class Surface {
    pos: Point3D[];
    type: string;
    norm: Vec3;
    cZ: number;
    constructor(polygon: Point3D[], type: string);
}
declare class Cube {
    pos: Point3D[];
    type: string;
    vertices: Point3D[];
    polygons: number[][];
    constructor(x: number, y: number, z: number, w: number, h: number, d: number, type: string);
    getSurfaces(): Surface[];
    setCamera(cameraX: number, cameraY: number, cameraZ: number, mRotX: number[], mRotY: number[]): void;
}
declare var engine: any;
declare var ctx: CanvasRenderingContext2D;
declare var keymap: boolean[];
declare var cubes: Cube[];
declare var images: Cube[];
declare var timer: number;
declare var ball: any & ExtendedCircleEntity;
declare var sound: HTMLAudioElement;
declare var count: number;
declare var rotY: number;
declare var rotX: number;
declare var ballImg: HTMLImageElement;
declare var pin0Img: HTMLImageElement;
declare var pin1Img: HTMLImageElement;
declare var light: Vec3;
declare function random(v: number): number;
declare function init(): void;
declare function tick(): void;
declare function paint(): void;
//# sourceMappingURL=main.d.ts.map