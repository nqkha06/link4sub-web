/**
 * Shader nền (WebGL 1) tự viết, mô phỏng các hiệu ứng aurora / plasma / dither:
 * vẽ một tam giác phủ màn hình, mọi phép tính nằm trong fragment shader.
 * Đầu ra là màu đã nhân alpha (premultiplied) để nền phía dưới vẫn lộ ra.
 */

export const FULLSCREEN_VERTEX = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}`;

export const SHADER_HEADER = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform vec2 uMouse;
${NOISE}`;

/** Cực quang: màn sáng lượn sóng phủ từ mép trên xuống, mép dưới mờ dần. */
export const AURORA_FRAGMENT = `${SHADER_HEADER}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.6;
  float wave = fbm(vec2(uv.x * 2.2 + t * 0.12, t * 0.18)) - 0.5;
  float edge = 0.55 + wave * uAmplitude * 0.9;
  float blend = 0.5;
  float band = smoothstep(edge - blend * 0.5, edge + blend * 0.5, uv.y);
  float rays = 0.65 + 0.35 * fbm(vec2(uv.x * 9.0 + t * 0.25, uv.y * 1.5 - t * 0.1));
  float alpha = band * rays * 0.95;
  vec3 color = mix(uColor, uColor * 1.35 + 0.1, rays - 0.65);
  gl_FragColor = vec4(color * alpha, alpha);
}`;

/** Plasma: các sóng sin chồng nhau, sáng dần thành vệt phát quang. */
export const PLASMA_FRAGMENT = `${SHADER_HEADER}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y) * 3.3;
  float t = uTime * 0.5;
  float v = sin(p.x + t)
          + sin(p.y * 1.3 - t * 1.2)
          + sin((p.x + p.y) * 0.8 + t * 0.7)
          + sin(length(p + vec2(sin(t * 0.5), cos(t * 0.3)) * 1.5) * 2.2 - t);
  v = v * 0.25 + 0.5;
  float glow = pow(clamp(v, 0.0, 1.0), 2.6);
  float alpha = clamp(glow * 1.25, 0.0, 1.0) * 0.9;
  vec3 color = uColor * (0.35 + glow * 1.3);
  gl_FragColor = vec4(color * alpha, alpha);
}`;

/**
 * Dither: sóng fbm lượng tử hoá thành 5 mức bằng ma trận Bayer 8×8, ô 2px.
 * Chuột đẩy sóng ra trong bán kính 0.22.
 */
export const DITHER_FRAGMENT = `${SHADER_HEADER}
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  float pixel = 2.0;
  vec2 cell = floor(gl_FragCoord.xy / pixel) * pixel;
  vec2 uv = cell / uResolution;
  vec2 p = uv;
  p.x *= uResolution.x / uResolution.y;
  float t = uTime * 0.06 * 10.0;
  float value = fbm(p * 2.0 + vec2(t * 0.35, -t * 0.2)) * (0.75 + uAmplitude);
  vec2 mouse = uMouse;
  mouse.x *= uResolution.x / uResolution.y;
  float d = distance(p, mouse);
  value -= 0.45 * (1.0 - smoothstep(0.0, 0.22, d));
  float levels = 5.0 - 1.0;
  float threshold = bayer8(cell / pixel) - 0.5;
  float q = clamp(floor(value * levels + threshold + 0.5) / levels, 0.0, 1.0);
  gl_FragColor = vec4(uColor * q, q);
}`;
