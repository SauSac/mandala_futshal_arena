// Football.tsx
"use client"
import { useEffect, useRef } from "react";

type Mat3 = number[]; // column-major

const mul = (A: Mat3, B: Mat3): Mat3 => {
  const C = new Array(9).fill(0);
  for (let c = 0; c < 3; c++)
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 3; k++) C[c * 3 + r] += A[k * 3 + r] * B[c * 3 + k];
  return C;
};
const rotX = (a: number): Mat3 => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; };
const rotY = (a: number): Mat3 => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; };
const rotZ = (a: number): Mat3 => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; };

const norm = (v: number[]) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** 12 pentagon centres followed by 20 hexagon centres, flattened for a vec3[32] uniform. */
function buildDirections(): Float32Array {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const INV = 1 / PHI;
  const pent: number[][] = [];
  const hex: number[][] = [];

  [[0, 1, PHI], [1, PHI, 0], [PHI, 0, 1]].forEach((base) => {
    [-1, 1].forEach((s) =>
      [-1, 1].forEach((t) => {
        const v = [...base];
        let k = 0;
        for (let i = 0; i < 3; i++) {
          if (v[i] !== 0) { v[i] *= k === 0 ? s : t; k++; }
        }
        pent.push(norm(v));
      })
    );
  });

  [-1, 1].forEach((a) =>
    [-1, 1].forEach((b) => [-1, 1].forEach((c) => hex.push(norm([a, b, c]))))
  );
  [-1, 1].forEach((a) =>
    [-1, 1].forEach((b) => {
      hex.push(norm([0, a * INV, b * PHI]));
      hex.push(norm([a * INV, b * PHI, 0]));
      hex.push(norm([a * PHI, 0, b * INV]));
    })
  );

  return new Float32Array([...pent, ...hex].flat());
}

const VERT = `
attribute vec2 a;
varying vec2 uv;
void main() { uv = a; gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec3 dirs[32];
uniform vec3 light;
uniform mat3 rot;
varying vec2 uv;

void main() {
  const float R = 0.94;
  float r = length(uv);
  if (r > R) discard;

  float alpha = smoothstep(R, R - 0.012, r);
  vec3 N = vec3(uv / R, sqrt(max(1.0 - (r / R) * (r / R), 0.0)));
  vec3 obj = N * rot;
  vec3 V = vec3(0.0, 0.0, 1.0);

  float best = -1.0, second = -1.0;
  bool isPent = false;
  for (int i = 0; i < 32; i++) {
    float s = dot(obj, dirs[i]) / (i < 12 ? 2.327 : 2.267);
    if (s > best) { second = best; best = s; isPent = (i < 12); }
    else if (s > second) { second = s; }
  }

  float d = (best - second) * 2.4;
  float seam = smoothstep(0.004, 0.016, d);
  float bevel = mix(0.78, 1.0, smoothstep(0.0, 0.10, d));

  vec3 base = isPent ? vec3(0.045, 0.055, 0.09) : vec3(0.96, 0.97, 0.98);
  base *= bevel;
  base = mix(vec3(0.03, 0.035, 0.05), base, seam);

  vec3 L = normalize(light);
  float diff = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), isPent ? 70.0 : 45.0) * (isPent ? 0.9 : 0.35);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  vec3 col = base * (0.28 + 0.85 * diff) + spec + rim * vec3(0.55, 0.75, 0.35) * 0.35;
  gl_FragColor = vec4(col * alpha, alpha);
}`;

type FootballProps = {
  /** Width and height in px (the ball is square). */
  size?: number | string;
  /** Spin speed multiplier. 0 stops it. */
  speed?: number;
  className?: string;
};

export default function Football({ size = 380, speed = 1, className }: FootballProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform3fv(gl.getUniformLocation(program, "dirs"), buildDirections());
    gl.uniform3fv(gl.getUniformLocation(program, "light"), norm([-0.5, 0.7, 0.8]));
    const rotLoc = gl.getUniformLocation(program, "rot");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ay = 0;
    let ax = 0;
    let last = performance.now();
    let frame = 0;

    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (!reduceMotion) {
        ay += dt * 0.6 * speedRef.current;
        ax += dt * 0.12 * speedRef.current;
      }
      const R = mul(rotZ(0.35), mul(rotX(ax), rotY(ay)));
      gl.uniformMatrix3fv(rotLoc, false, new Float32Array(R));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: size, height: size, display: "block" }}
    />
  );
}