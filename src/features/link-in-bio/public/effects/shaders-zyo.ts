/**
 * Bộ shader nền mô phỏng các hiệu ứng của zyo.lol (tự viết lại, WebGL 1).
 * Quy ước như shaders.ts: tô theo uColor (màu hiệu ứng), cường độ uAmplitude
 * (0–1), đầu ra premultiplied alpha để nền phía dưới vẫn lộ ra.
 */
import { SHADER_HEADER } from "./shaders";

/** Toạ độ giữ tỉ lệ: tâm (0,0), cạnh ngắn = 1. */
const COMMON = `${SHADER_HEADER}
vec2 centered() { return (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y); }
vec2 screenUv() { return gl_FragCoord.xy / uResolution; }
float grain(vec2 p, float t) { return hash(p + fract(t) * 91.7); }
vec4 premul(vec3 color, float alpha) { float a = clamp(alpha, 0.0, 1.0); return vec4(color * a, a); }
`;

/** Chroma Waves: các khối sáng lớn trôi chậm, viền nhiễu hạt. */
export const CHROMA_WAVES_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered() * 1.6;
  float t = uTime * 0.12;
  float warp = fbm(p + vec2(t, -t * 0.7));
  float v = fbm(p * 0.9 + warp * 1.8 + vec2(-t * 0.6, t * 0.4));
  float edge = 0.5 - uAmplitude * 0.08;
  float blob = smoothstep(edge - 0.07, edge + 0.07, v);
  float g = grain(gl_FragCoord.xy, uTime) - 0.5;
  float alpha = clamp(blob + g * 0.35 * (1.0 - abs(blob * 2.0 - 1.0)), 0.0, 1.0) * 0.92;
  gl_FragColor = premul(uColor, alpha);
}`;

/** Luminous Flow: nhiều sợi sáng mảnh lượn ngang, giao nhau. */
export const LUMINOUS_FLOW_FRAGMENT = `${COMMON}
void main() {
  vec2 uv = screenUv();
  float aspect = uResolution.x / uResolution.y;
  float t = uTime * 0.35;
  float light = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float y = 0.5 + 0.18 * sin(uv.x * aspect * (1.2 + fi * 0.35) + t * (0.6 + fi * 0.13) + fi * 1.7)
                  + 0.06 * sin(uv.x * aspect * 3.1 - t + fi);
    float d = abs(uv.y - y);
    light += (0.0016 + 0.0012 * uAmplitude) / (d + 0.002) * (0.55 + 0.45 * sin(fi * 2.3 + t));
    light += exp(-d * 18.0) * 0.08;
  }
  float alpha = clamp(light * 0.35, 0.0, 1.0);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Aurora Silk: một dải lụa sáng uốn lượn, có nếp gấp. */
export const AURORA_SILK_FRAGMENT = `${COMMON}
void main() {
  vec2 uv = screenUv();
  float aspect = uResolution.x / uResolution.y;
  float x = uv.x * aspect;
  float t = uTime * 0.3;
  float center = 0.52 + 0.12 * sin(x * 1.6 + t) + 0.05 * sin(x * 4.2 - t * 1.3);
  float width = 0.17 + 0.05 * sin(x * 2.3 + t * 0.7);
  float d = (uv.y - center) / width;
  float band = exp(-d * d * 2.2);
  float folds = 0.55 + 0.45 * sin(x * 5.0 + d * 3.0 + t * 1.4 + fbm(vec2(x * 1.5, t)) * 3.0);
  float alpha = band * (0.35 + 0.65 * folds) * (0.75 + uAmplitude * 0.4);
  gl_FragColor = premul(uColor * (0.75 + folds * 0.35), alpha);
}`;

/** Velvet Waves: màn nhung tối, nếp lượn mềm, sáng nhẹ. */
export const VELVET_WAVES_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float t = uTime * 0.15;
  float n = fbm(p * 1.4 + vec2(t * 0.6, -t * 0.4));
  float v = 0.5 + 0.5 * sin(p.x * 3.2 + p.y * 1.4 + n * 4.5 + t * 1.6);
  v = pow(v, 2.4);
  float vignette = smoothstep(1.2, 0.1, length(p - vec2(-0.25, 0.35)));
  float alpha = v * vignette * (0.28 + uAmplitude * 0.3);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Nebula Drift: các tầng mây mỏng trải ngang, trôi rất chậm. */
export const NEBULA_DRIFT_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float t = uTime * 0.05;
  float layers = fbm(vec2(p.x * 0.7 + t, p.y * 3.6 + sin(p.x * 1.5 + t * 2.0) * 0.6));
  float streak = fbm(vec2(p.x * 0.4 - t * 1.3, p.y * 7.0));
  float v = smoothstep(0.35, 0.85, layers) * 0.75 + smoothstep(0.55, 0.9, streak) * 0.45;
  float alpha = v * (0.45 + uAmplitude * 0.4);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Soft Horizon: các vạch sáng nằm ngang như đường chân trời, một vạch rõ ở giữa. */
export const SOFT_HORIZON_FRAGMENT = `${COMMON}
void main() {
  vec2 uv = screenUv();
  float aspect = uResolution.x / uResolution.y;
  float t = uTime * 0.2;
  float wobble = 0.015 * sin(uv.x * aspect * 3.0 + t) + 0.01 * sin(uv.x * aspect * 7.0 - t * 1.4);
  float horizon = exp(-abs(uv.y - 0.46 - wobble) * 55.0);
  float strata = 0.5 + 0.5 * sin((uv.y + wobble * 2.0) * 70.0 + fbm(vec2(uv.x * 2.0, t)) * 2.0);
  strata = pow(strata, 6.0) * smoothstep(0.95, 0.1, abs(uv.y - 0.46) * 2.0);
  float alpha = (horizon * 0.95 + strata * 0.22) * (0.75 + uAmplitude * 0.4);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Liquid Flow: chất lỏng tương phản cao, mép có vân lặp. */
export const LIQUID_FLOW_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered() * 1.8;
  float t = uTime * 0.12;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  float r = fbm(p + q * (2.6 + uAmplitude * 1.5) + vec2(t * 0.5, 0.0));
  float body = smoothstep(0.47, 0.53, r);
  float rings = (0.5 + 0.5 * sin(r * 90.0)) * smoothstep(0.38, 0.5, r) * (1.0 - body);
  float alpha = body * 0.95 + rings * 0.35;
  gl_FragColor = premul(uColor, alpha);
}`;

/** Spectrum Warp: một dải sáng cong rực, viền nhiễu hạt. */
export const SPECTRUM_WARP_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float t = uTime * 0.25;
  float curve = 0.18 * sin(p.x * 2.2 + t) - 0.25 * p.x * p.x + 0.1;
  float d = abs(p.y - curve);
  float glow = exp(-d * (7.0 - uAmplitude * 2.0));
  float core = exp(-d * 28.0);
  float shadow = smoothstep(0.0, 0.55, p.y - curve) * 0.0;
  float g = grain(gl_FragCoord.xy, uTime) - 0.5;
  float alpha = clamp(glow * 0.8 + core * 0.6 + g * 0.25 * glow * (1.0 - glow) * 4.0 - shadow, 0.0, 1.0);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Aurora Lines: một vệt sáng cong lớn trên nền đường đồng mức mờ. */
export const AURORA_LINES_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float t = uTime * 0.1;
  float field = fbm(p * 1.3 + vec2(t, t * 0.6));
  float contour = smoothstep(0.42, 0.5, abs(fract(field * 9.0) - 0.5)) * 0.18;
  float arc = p.y - (-0.35 * p.x + 0.12 * sin(p.x * 3.0 + uTime * 0.3));
  float beam = exp(-abs(arc) * (9.0 - uAmplitude * 3.0)) + exp(-abs(arc) * 45.0) * 0.6;
  float alpha = clamp(beam * 0.85 + contour, 0.0, 1.0);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Chromatic Pulse: lớp lỏng sáng óng ánh, ánh màu nhẹ (xanh/cam) quanh màu chính. */
export const CHROMATIC_PULSE_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered() * 1.4;
  float t = uTime * 0.15;
  vec2 q = vec2(fbm(p + t), fbm(p - vec2(t, -t * 0.5) + 3.1));
  float v = fbm(p + q * 1.8);
  vec3 tint = 0.5 + 0.5 * cos(6.2831 * (v * 1.2 + vec3(0.0, 0.33, 0.67) + t * 0.3));
  vec3 color = mix(uColor, uColor * (0.55 + tint * 0.7), 0.16 + uAmplitude * 0.1);
  float alpha = smoothstep(0.25, 0.75, v) * 0.85 + 0.1;
  gl_FragColor = premul(color, alpha);
}`;

/** Glitter Warp: hạt lấp lánh bay từ tâm ra ngoài (zoom qua trường sao). */
export const GLITTER_WARP_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float light = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float z = fract(fi * 0.25 + uTime * 0.08);
    float scale = mix(18.0, 1.5, z);
    vec2 g = p * scale + fi * 7.3;
    vec2 cell = floor(g);
    vec2 local = fract(g) - 0.5;
    float h = hash(cell + fi);
    vec2 offset = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
    float d = length(local - offset * 0.7);
    float size = 0.045 + 0.06 * h;
    float twinkle = 0.6 + 0.4 * sin(uTime * 6.0 + h * 40.0);
    light += step(0.55 - uAmplitude * 0.15, h) * smoothstep(size, 0.0, d) * twinkle * smoothstep(0.0, 0.3, z) * smoothstep(1.0, 0.75, z);
  }
  gl_FragColor = premul(uColor, light * 1.4);
}`;

/** Light Droplets: các vệt sáng ngang ngắn trôi sang phải. */
export const LIGHT_DROPLETS_FRAGMENT = `${COMMON}
void main() {
  vec2 uv = screenUv();
  float aspect = uResolution.x / uResolution.y;
  float rows = 34.0;
  float row = floor(uv.y * rows);
  float h = hash(vec2(row, 1.7));
  float speed = 0.05 + 0.12 * h;
  float x = uv.x * aspect * (1.5 + h) - uTime * speed + h * 10.0;
  float seg = fract(x);
  float len = 0.25 + 0.4 * hash(vec2(row, floor(x)));
  float on = step(0.45 - uAmplitude * 0.2, hash(vec2(row * 1.3, floor(x) + 2.0)));
  float streak = smoothstep(0.0, 0.03, seg) * smoothstep(len, len - 0.15, seg);
  float thin = smoothstep(0.5, 0.0, abs(fract(uv.y * rows) - 0.5) * 6.0);
  float alpha = streak * thin * on * (0.55 + 0.45 * h);
  gl_FragColor = premul(uColor, alpha);
}`;

/** Lightspeed: vệt sao toả ra từ tâm như nhảy siêu tốc, ánh màu nhẹ. */
export const LIGHTSPEED_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float r = length(p);
  float a = atan(p.y, p.x);
  float bins = 220.0;
  float bin = floor((a / 6.2831 + 0.5) * bins);
  float h = hash(vec2(bin, 4.2));
  float travel = fract(r * (0.7 + h * 0.6) - uTime * (0.25 + h * 0.5) + h * 9.0);
  float len = 0.08 + 0.18 * r;
  float streak = smoothstep(len, 0.0, travel) * smoothstep(0.0, 0.01, travel);
  float width = abs(fract((a / 6.2831 + 0.5) * bins) - 0.5);
  float thin = smoothstep(0.5, 0.1, width);
  float on = step(0.35 - uAmplitude * 0.2, hash(vec2(bin, 9.1)));
  vec3 tint = mix(uColor, uColor * (0.6 + 0.6 * cos(6.2831 * (h + vec3(0.0, 0.33, 0.67)))), 0.35);
  float alpha = streak * thin * on * smoothstep(0.02, 0.35, r) * 1.2;
  gl_FragColor = premul(tint, alpha);
}`;

/** Liquid Lines: các vệt sáng chéo, mềm, chạy dọc theo đường. */
export const LIQUID_LINES_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  vec2 r = vec2(p.x * 0.707 - p.y * 0.707, p.x * 0.707 + p.y * 0.707);
  float t = uTime * 0.3;
  float wobble = fbm(vec2(r.y * 1.2, t * 0.3)) * 0.6;
  float lane = r.x * 7.0 + wobble * 3.0;
  float id = floor(lane);
  float d = abs(fract(lane) - 0.5);
  float h = hash(vec2(id, 2.0));
  float along = 0.5 + 0.5 * sin(r.y * (2.0 + h * 3.0) - t * (1.0 + h) + h * 20.0);
  float line = exp(-d * (16.0 - uAmplitude * 6.0)) * pow(along, 3.0) * step(0.3, h);
  gl_FragColor = premul(uColor, line * 1.1);
}`;

/** Metallic Swirl: dải gradient kim loại xoáy rất chậm. */
export const METALLIC_SWIRL_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  float t = uTime * 0.08;
  float angle = atan(p.y, p.x);
  float swirl = angle + length(p) * (2.2 + uAmplitude) - t * 2.0 + fbm(p * 1.5 + t) * 1.2;
  float v = 0.5 + 0.5 * cos(swirl);
  v = smoothstep(0.0, 1.0, v);
  float alpha = (0.18 + v * 0.55);
  gl_FragColor = premul(uColor * (0.55 + v * 0.6), alpha);
}`;

/** Topography: đường đồng mức mảnh của bản đồ địa hình, trôi chậm. */
export const TOPOGRAPHY_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered() * 1.7;
  float f = fbm(p + vec2(uTime * 0.02, -uTime * 0.015));
  float d = abs(fract(f * (9.0 + uAmplitude * 6.0)) - 0.5);
  float line = smoothstep(0.44, 0.5, d);
  vec3 tint = mix(uColor, uColor * vec3(1.0, 0.75, 0.85), 0.35);
  gl_FragColor = premul(tint, line * 0.75);
}`;

/** Gradient Waves: một dải sáng chéo lượn, mép nhiễu hạt. */
export const GRADIENT_WAVES_FRAGMENT = `${COMMON}
void main() {
  vec2 p = centered();
  vec2 r = vec2(p.x * 0.85 - p.y * 0.53, p.x * 0.53 + p.y * 0.85);
  float t = uTime * 0.35;
  float center = 0.18 * sin(r.y * 2.0 + t) + 0.12;
  float d = abs(r.x - center);
  float width = 0.16 + uAmplitude * 0.08;
  float band = smoothstep(width, width * 0.35, d);
  float g = grain(gl_FragCoord.xy, uTime);
  float edge = smoothstep(width * 1.6, width * 0.6, d) * (1.0 - band);
  float alpha = clamp(band + step(0.55, g) * edge, 0.0, 1.0);
  gl_FragColor = premul(uColor, alpha);
}`;
