precision mediump float;

const float sensitivity = 1.0;
const float range = 125.0;

varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform vec2 u_grid;
uniform float u_time;
uniform float u_night;

vec3 hueShift(vec3 color, float hue) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosHue = cos(hue);
    return vec3(color * cosHue + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosHue));
}

void main() {
  // ###
  // texture
  vec2 v_uv2;
  v_uv2.x = v_uv.x;
  v_uv2.y = 1.0 - v_uv.y;

  // ###

  vec2 celc = v_uv2 * u_grid; // position within cell
  vec2 cell = floor(celc); // position of cell's bottom left corner
  vec2 cell5 = cell + vec2(0.5); // position of middle of each cell

  vec2 axis_dist = vec2(u_mouse.x * u_grid.x - cell5.x, u_mouse.y * u_grid.y - cell5.y);
  float dist2 = axis_dist.x * axis_dist.x + axis_dist.y * axis_dist.y;
  // float dist = sqrt(dist2);

  vec2 direction = normalize(u_mouse * u_grid - cell5);
  float magnitude = max(range - dist2 * 0.1, 0.0) * 0.0005;
  vec2 offset = direction * magnitude;

  vec2 offset2 = vec2((sin(u_time * 0.01 + cell5.x * 1000.0) * 0.0075 + cos(u_time * 0.001 + cell5.y * 0.05)) * 0.05, cos(u_time * 0.001 + cell5.y * 0.125) * 0.1);
  vec2 offset3 = vec2((sin(u_time * 0.005 + cell5.x * 750.0) * 0.0575 - sin(u_time * 0.003 + cell5.y * 0.05)) * 0.07, cos(u_time * 0.002 + cell5.y * 0.125 + 1.1) * -0.4);

  vec2 uv = cell5 / u_grid + offset + offset2;
  vec2 uvm = celc / u_grid + offset + offset2;
  vec2 uvc = celc / u_grid + offset * 1.25 + offset2 * 2.5;

  vec4 color = texture2D(u_texture, uv);
  color *= texture2D(u_texture, uvm);
  vec4 color2 = texture2D(u_texture, uvc);
  
  color2.rgb += vec3(0.25, 0.05, 0.15);

  color.rgb *= color2.rgb;

  color.rgb *= 1.5;

  if (u_night < 0.5) color.rgb = hueShift(color.rgb, 3.14159265);

  gl_FragColor = color;
}
