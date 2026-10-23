"use client";

import { useEffect, useRef } from "react";

import { FULLSCREEN_VERTEX } from "./shaders";

function hexToRgb(color: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})/i.exec(color.trim());
  const value = match ? Number.parseInt(match[1], 16) : 0xffffff;
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

/**
 * Canvas toàn màn hình chạy một fragment shader. Không có WebGL (hoặc máy
 * yếu — `failIfMajorPerformanceCaveat`) thì không vẽ gì, nền vẫn hiển thị.
 */
export function ShaderCanvas({
  fragment,
  color,
  speed,
  amplitude,
  interactive = false,
  className,
  style,
}: {
  fragment: string;
  color: string;
  speed: number;
  amplitude: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const settings = useRef({ color, speed, amplitude });

  useEffect(() => {
    settings.current = { color, speed, amplitude };
  }, [color, speed, amplitude]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    /*
     * Mỗi lần chạy tạo canvas MỚI và gỡ nó khi dọn dẹp. Nếu dùng lại một canvas
     * đã gọi loseContext() (React StrictMode chạy effect 2 lần, hoặc đổi
     * shader), getContext() trả lại context đã mất → Chrome vẽ icon mặt buồn.
     */
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    host.appendChild(canvas);
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl) {
      canvas.remove();
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!vertex || !fragmentShader || !program) {
      canvas.remove();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.remove();
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uColor = gl.getUniformLocation(program, "uColor");
    const uAmplitude = gl.getUniformLocation(program, "uAmplitude");
    const uMouse = gl.getUniformLocation(program, "uMouse");

    const mouse = { x: -10, y: -10 };
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / Math.max(1, rect.width);
      mouse.y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
    };
    if (interactive) window.addEventListener("pointermove", onPointer);

    const resize = () => {
      // Hiệu ứng mềm, không cần độ phân giải retina — giữ 1x cho nhẹ.
      canvas.width = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let elapsed = 0;
    let last = performance.now();
    const render = (now: number) => {
      const current = settings.current;
      elapsed += ((now - last) / 1000) * current.speed;
      last = now;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform3fv(uColor, hexToRgb(current.color));
      gl.uniform1f(uAmplitude, current.amplitude);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(render);
      }
    };
    frame = requestAnimationFrame(render);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [fragment, interactive]);

  return <div ref={hostRef} aria-hidden className={className} style={style} />;
}

const snapshotCache = new Map<string, string>();

/**
 * Vẽ MỘT khung của shader ra ảnh (data URL) rồi giải phóng ngay context WebGL.
 * Dùng cho ô xem trước tĩnh: trình duyệt chỉ cho ~16 context WebGL cùng lúc,
 * nên lưới nhiều hiệu ứng không thể chạy trực tiếp tất cả.
 */
export function renderShaderSnapshot(
  fragment: string,
  { width, height, color, amplitude, time = 6 }: { width: number; height: number; color: string; amplitude: number; time?: number },
): string | null {
  const key = `${fragment.length}:${fragment.slice(-80)}|${width}x${height}|${color}|${amplitude}|${time}`;
  const cached = snapshotCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  if (!gl) return null;
  try {
    const vertex = compile(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!vertex || !fragmentShader || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, width, height);
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), time);
    gl.uniform2f(gl.getUniformLocation(program, "uResolution"), width, height);
    gl.uniform3fv(gl.getUniformLocation(program, "uColor"), hexToRgb(color));
    gl.uniform1f(gl.getUniformLocation(program, "uAmplitude"), amplitude);
    gl.uniform2f(gl.getUniformLocation(program, "uMouse"), -10, -10);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const url = canvas.toDataURL("image/png");
    snapshotCache.set(key, url);
    return url;
  } finally {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
