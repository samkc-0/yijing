const KING_WEN_COUNT = 64;
const VERTEX_STRIDE = 5;
const VERTICES_PER_QUAD = 6;
const COLUMN_SPACING_RATIO = 0.86;
const GLYPH_SCALE = 1.28;
const ATLAS_FONT_RATIO = 0.98;
const FACE_OUT_DURATION_MS = 520;

function buildColumnSequence(chapters, columnIndex) {
  return chapters;
}

function mod(value, length) {
  return ((value % length) + length) % length;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    `
      attribute vec2 a_position;
      attribute vec2 a_uv;
      attribute float a_alpha;
      varying vec2 v_uv;
      varying float v_alpha;

      void main() {
        v_uv = a_uv;
        v_alpha = a_alpha;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
  );

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;

      varying vec2 v_uv;
      varying float v_alpha;
      uniform sampler2D u_texture;

      void main() {
        float alpha = texture2D(u_texture, v_uv).a;
        gl_FragColor = vec4(vec3(0.0), alpha * v_alpha);
      }
    `,
  );

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "program link failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function createAtlas(chapters, tileSize) {
  const atlasSize = tileSize * 8;
  const canvas = document.createElement("canvas");
  canvas.width = atlasSize;
  canvas.height = atlasSize;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, atlasSize, atlasSize);
  context.fillStyle = "#000";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${Math.round(tileSize * ATLAS_FONT_RATIO)}px serif`;

  chapters.forEach((chapter, index) => {
    const column = index % 8;
    const row = Math.floor(index / 8);
    const centerX = column * tileSize + tileSize / 2;
    const centerY = row * tileSize + tileSize / 2;

    context.fillText(chapter.glyph, centerX, centerY);
  });

  return { canvas, tileSize };
}

function createFallbackView({ chapters, onSelect }) {
  const screen = document.createElement("main");
  screen.className = "screen contents-screen";

  const list = document.createElement("div");
  list.className = "contents-fallback";

  for (const chapter of chapters) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hexagram-button";
    button.textContent = chapter.glyph;
    button.setAttribute("aria-label", `Open chapter ${chapter.id}`);
    button.addEventListener("click", () => onSelect(chapter.id));
    list.appendChild(button);
  }

  screen.appendChild(list);

  return { node: screen, destroy() {} };
}

export function renderContentsView({ chapters, onSelect }) {
  const screen = document.createElement("main");
  screen.className = "screen contents-screen";
  screen.setAttribute("aria-label", "Yijing contents");

  const canvas = document.createElement("canvas");
  canvas.className = "contents-canvas";
  canvas.setAttribute("aria-hidden", "true");
  screen.appendChild(canvas);

  const description = document.createElement("div");
  description.className = "visually-hidden";
  description.textContent = "Animated field of sixty-four hexagrams. Click a hexagram to open its chapter.";
  screen.appendChild(description);

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    stencil: false,
  });

  if (!gl) {
    return createFallbackView({ chapters, onSelect });
  }

  const program = createProgram(gl);
  const buffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const uvLocation = gl.getAttribLocation(program, "a_uv");
  const alphaLocation = gl.getAttribLocation(program, "a_alpha");
  const textureLocation = gl.getUniformLocation(program, "u_texture");

  let atlas = null;
  let texture = null;
  let animationFrame = 0;
  let lastLayout = null;
  let currentTimeSeconds = 0;
  let vertexCapacity = 0;
  let vertexData = new Float32Array(0);
  let transitionState = null;
  let hoverState = null;
  let currentInstances = [];

  function computeLayout() {
    const width = screen.clientWidth || window.innerWidth || 1280;
    const height = screen.clientHeight || window.innerHeight || 720;
    const dpr = window.devicePixelRatio || 1;
    const cellSize = Math.max(34, Math.min(64, Math.round(width / 24)));
    const columnSpacing = cellSize * COLUMN_SPACING_RATIO;
    const glyphSize = cellSize * GLYPH_SCALE;
    const columnCount = Math.max(12, Math.ceil(width / columnSpacing) + 2);
    const rowsVisible = Math.ceil(height / cellSize) + 3;
    const gridWidth = (columnCount - 1) * columnSpacing + glyphSize;
    const startX = (width - gridWidth) / 2;
    const cycleHeight = chapters.length * cellSize;

    const columns = Array.from({ length: columnCount }, (_, index) => ({
      sequence: buildColumnSequence(chapters, index),
      speed: cellSize * (0.85 + ((index * 17) % 7) * 0.08),
      startOffset: (index * cellSize * 5) % cycleHeight,
      x: startX + index * columnSpacing,
    }));

    return {
      width,
      height,
      dpr,
      cellSize,
      glyphSize,
      columnSpacing,
      columnCount,
      rowsVisible,
      cycleHeight,
      startX,
      columns,
    };
  }

  function ensureAtlas(layout) {
    const tileSize = Math.max(96, Math.ceil(layout.cellSize * layout.dpr * 1.8));

    if (atlas && atlas.tileSize === tileSize) {
      return;
    }

    atlas = createAtlas(chapters, tileSize);

    if (!texture) {
      texture = gl.createTexture();
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
  }

  function resize() {
    lastLayout = computeLayout();
    ensureAtlas(lastLayout);

    const displayWidth = Math.max(1, Math.floor(lastLayout.width * lastLayout.dpr));
    const displayHeight = Math.max(1, Math.floor(lastLayout.height * lastLayout.dpr));

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function pushQuad(layout, chapterIndex, left, top, width, height, alpha, offset) {
    const atlasColumn = chapterIndex % 8;
    const atlasRow = Math.floor(chapterIndex / 8);
    const uvSize = 1 / 8;
    const u0 = atlasColumn * uvSize;
    const v0 = atlasRow * uvSize;
    const u1 = u0 + uvSize;
    const v1 = v0 + uvSize;

    const x0 = (left / layout.width) * 2 - 1;
    const x1 = ((left + width) / layout.width) * 2 - 1;
    const y0 = 1 - (top / layout.height) * 2;
    const y1 = 1 - ((top + height) / layout.height) * 2;

    const quad = [
      x0, y0, u0, v0, alpha,
      x1, y0, u1, v0, alpha,
      x0, y1, u0, v1, alpha,
      x0, y1, u0, v1, alpha,
      x1, y0, u1, v0, alpha,
      x1, y1, u1, v1, alpha,
    ];

    vertexData.set(quad, offset);
  }

  function pickInstance(x, y, options = {}) {
    const {
      timeSeconds = currentTimeSeconds,
    } = options;

    if (!lastLayout) {
      return null;
    }

    const layout = lastLayout;
    const transition = transitionState;
    const frozenTimeSeconds = transition ? transition.frozenTimeSeconds : timeSeconds;

    for (let columnIndex = 0; columnIndex < layout.columns.length; columnIndex += 1) {
      const column = layout.columns[columnIndex];
      const drift = mod(column.startOffset + frozenTimeSeconds * column.speed, layout.cycleHeight);
      const firstRow = Math.floor((-drift - layout.cellSize) / layout.cellSize);
      const lastRow = firstRow + layout.rowsVisible;

      for (let row = firstRow; row <= lastRow; row += 1) {
        const top = row * layout.cellSize + drift;

        if (top < -layout.cellSize || top > layout.height) {
          continue;
        }

        const left = column.x;
        const right = left + layout.glyphSize;
        const bottom = top + layout.glyphSize;

        if (x < left || x > right || y < top || y > bottom) {
          continue;
        }

        const chapterIndex = mod(row, KING_WEN_COUNT);
        const chapter = column.sequence[chapterIndex];

        return {
          chapter,
          chapterId: chapter.id,
          columnIndex,
          row,
          left,
          right,
          top,
          bottom,
          drift,
        };
      }
    }

    return null;
  }

  function renderFrame(timestamp) {
    currentTimeSeconds = timestamp / 1000;
    resize();

    const layout = lastLayout;
    const quadsNeeded = layout.columnCount * (layout.rowsVisible + 2);
    const floatCount = quadsNeeded * VERTICES_PER_QUAD * VERTEX_STRIDE;

    if (floatCount > vertexCapacity) {
      vertexCapacity = floatCount;
      vertexData = new Float32Array(vertexCapacity);
    }

    let offset = 0;
    const nowMs = timestamp;
    const transition = transitionState;
    const frozenTimeSeconds = transition ? transition.frozenTimeSeconds : currentTimeSeconds;
    const faceOutProgress = transition
      ? Math.min(1, (nowMs - transition.startMs) / FACE_OUT_DURATION_MS)
      : 0;
    currentInstances = [];

    for (let columnIndex = 0; columnIndex < layout.columns.length; columnIndex += 1) {
      const column = layout.columns[columnIndex];
      const drift = mod(column.startOffset + frozenTimeSeconds * column.speed, layout.cycleHeight);
      const firstRow = Math.floor((-drift - layout.cellSize) / layout.cellSize);
      const lastRow = firstRow + layout.rowsVisible;

      for (let row = firstRow; row <= lastRow; row += 1) {
        const top = row * layout.cellSize + drift;

        if (top < -layout.cellSize || top > layout.height) {
          continue;
        }

        const chapterIndex = mod(row, KING_WEN_COUNT);
        const chapter = column.sequence[chapterIndex];
        const isSelected =
          transition &&
          columnIndex === transition.selectedColumnIndex &&
          chapter.id === transition.chapterId &&
          row === transition.selectedRow;
        const isHovered = hoverState && columnIndex === hoverState.columnIndex && row === hoverState.row;

        const turnProgress = isSelected ? 0 : faceOutProgress;
        const width = Math.max(layout.glyphSize * (1 - turnProgress), 0.75);
        const left = column.x + (layout.glyphSize - width) / 2;
        let alpha = isSelected ? 1 : 1 - faceOutProgress * 0.95;

        if (isHovered && !transition) {
          alpha *= 0.5;
        }

        currentInstances.push({
          chapterId: chapter.id,
          columnIndex,
          row,
          left,
          right: left + width,
          top,
          bottom: top + layout.glyphSize,
        });

        pushQuad(layout, Number(chapter.id) - 1, left, top, width, layout.glyphSize, alpha, offset);
        offset += VERTICES_PER_QUAD * VERTEX_STRIDE;
      }
    }

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData.subarray(0, offset), gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, VERTEX_STRIDE * 4, 0);
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, VERTEX_STRIDE * 4, 2 * 4);
    gl.enableVertexAttribArray(alphaLocation);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, VERTEX_STRIDE * 4, 4 * 4);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocation, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, offset / VERTEX_STRIDE);

    if (transitionState && nowMs - transitionState.startMs >= FACE_OUT_DURATION_MS) {
      const chapterId = transitionState.chapterId;
      transitionState = null;
      onSelect(chapterId);
      return;
    }

    animationFrame = window.requestAnimationFrame(renderFrame);
  }

  function handlePointer(event) {
    if (!lastLayout || transitionState) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const hit = pickInstance(x, y, { timeSeconds: currentTimeSeconds });

    if (hit) {
      transitionState = {
        chapterId: hit.chapterId,
        startMs: performance.now(),
        frozenTimeSeconds: currentTimeSeconds,
        selectedColumnIndex: hit.columnIndex,
        selectedRow: hit.row,
      };
      hoverState = null;
    }
  }

  function updateHover(event) {
    if (!lastLayout || transitionState) {
      hoverState = null;
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
      hoverState = null;
      return;
    }
    const hit = pickInstance(x, y, { timeSeconds: currentTimeSeconds });

    if (!hit) {
      hoverState = null;
      return;
    }

    if (hoverState && hoverState.columnIndex === hit.columnIndex) {
      hoverState = {
        ...hoverState,
        row: hit.row,
      };
      return;
    }

    hoverState = {
      columnIndex: hit.columnIndex,
      row: hit.row,
    };
  }

  function clearHover() {
    hoverState = null;
  }

  function destroy() {
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("click", handlePointer);
    canvas.removeEventListener("pointermove", updateHover);
    canvas.removeEventListener("pointerleave", clearHover);

    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);

    if (texture) {
      gl.deleteTexture(texture);
    }
  }

  window.addEventListener("resize", resize);
  canvas.addEventListener("click", handlePointer);
  canvas.addEventListener("pointermove", updateHover);
  canvas.addEventListener("pointerleave", clearHover);
  animationFrame = window.requestAnimationFrame(renderFrame);

  return { node: screen, destroy };
}
