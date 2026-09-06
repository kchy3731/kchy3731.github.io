const GRID = [210.0, 60.0];
const TEXTURE_URL = "bg.png";

const fps = 36;
const fpsInterval = 1000 / fps;
let then = performance.now();

let night = false;

const nomotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById("gl");
const gl = canvas.getContext("webgl");
if (!gl) {
  throw new Error("WebGL not supported in this browser.");
}

function compileShader(type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error:\n" + log);
  }

  return shader;
}

function createProgram(vertSrc, fragSrc) {
  const vert = compileShader(gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl.FRAGMENT_SHADER, fragSrc);

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error("Program link error:\n" + log);
  }

  return program;
}

function loadTexture(url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // placeholder
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
    gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

  const image = new Image();

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  };

  image.onerror = () => {
    console.error("Failed to load texture:", url);
  };

  image.src = url;

  return texture;
}

async function main() {
  const [vertSrc, fragSrc] = await Promise.all([
    fetch("shader.vert").then(r => r.text()),
    fetch("shader.frag").then(r => r.text()),
  ]);

  const program = createProgram(vertSrc, fragSrc);
  gl.useProgram(program);

  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const texture = loadTexture(TEXTURE_URL);

  const u_texture = gl.getUniformLocation(program, "u_texture");
  const u_mouse = gl.getUniformLocation(program, "u_mouse");
  const u_grid = gl.getUniformLocation(program, "u_grid");
  const u_time = gl.getUniformLocation(program, "u_time");
  const u_night = gl.getUniformLocation(program, "u_night");

  const mouse = [0.5, 0.5];

  window.addEventListener("mousemove", (e) => {
    const left = (canvas.scrollWidth / 2.0 - window.innerWidth / 2.0) / canvas.scrollWidth;
    const ratio = window.innerWidth / canvas.scrollWidth;
    const offset = e.clientX / window.innerWidth * ratio;

    mouse[0] = left + offset;
    mouse[1] = e.clientY / window.innerHeight;
  });

  function resize() {
    // const dpr = Math.min(window.devicePixelRatio, 2) || 1; // pita when > 2 :(
    const dpr = 1; // ok nvm all performance issues are due to inflating the canvas size for basically no reason
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }
  window.addEventListener("resize", resize);
  resize();

  const start = performance.now();

  function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1i(u_texture, 0);
    gl.uniform2f(u_mouse, mouse[0], mouse[1]);
    gl.uniform2f(u_grid, GRID[0], GRID[1]);
    gl.uniform1f(u_time, (performance.now() - start));
    gl.uniform1f(u_night, (night) ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // requestAnimationFrame(render);
  }

  function loop(now) {
    if (!nomotion) requestAnimationFrame(loop);

    const elapsed = now - then;

    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);
      render();
    }
  }

  requestAnimationFrame(loop);
}

main().catch(err => {
  console.error(err);
  document.body.innerHTML =
    "<pre style='color:#f66;padding:1rem;font-family:monospace'>" +
    err.message + "</pre>";
});
