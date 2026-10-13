// Jigsaw piece generator: closed, interlocking piece outlines from one seed.
//
// The edge maths is a port of Draradech's jigsaw generator (https://github.com/Draradech/jigsaw,
// CC0 for everything except its save function, which is not used here). Each cut line is generated
// once and shared by the two neighbouring pieces, so pieces interlock by construction: the right edge
// of one piece is exactly the reversed left edge of the next.

export type Point = [number, number];

/** One cut segment between two grid corners: three cubic Béziers, 10 control points p0..p9. */
export type Edge = Point[];

export interface JigsawOptions {
  cols: number;
  rows: number;
  width: number;
  height: number;
  seed?: number;
  /** Tab size as a fraction of the piece length (Draradech's slider 10–30 %, default 20 %). */
  tabSize?: number;
  /** Random jitter as a fraction of the piece length (slider 0–13 %, default 4 %). */
  jitter?: number;
  /** Top-left offset of the puzzle inside the target canvas. */
  x?: number;
  y?: number;
}

export interface Piece {
  col: number;
  row: number;
  /** Closed SVG path of the piece outline. */
  d: string;
  /** Outline as cubic segments (start point + 3 points per segment), for 3D extrusion or Blender. */
  outline: Point[];
  /** Bounding box of the outline including tabs. */
  bbox: { x: number; y: number; width: number; height: number };
}

export interface Jigsaw {
  options: Required<JigsawOptions>;
  pieces: Piece[];
  /** All interior cut lines as one SVG path (for drawing the cut pattern over a picture). */
  cuts: string;
  /** Outer border as an SVG path. */
  border: string;
}

const round = (v: number) => Math.round(v * 100) / 100;

export function generateJigsaw(input: JigsawOptions): Jigsaw {
  const o: Required<JigsawOptions> = { seed: 1, tabSize: 0.2, jitter: 0.04, x: 0, y: 0, ...input };
  const t = o.tabSize / 2; // Draradech: t = tabsize% / 200
  const j = o.jitter;

  let seed = o.seed;
  const random = () => {
    const v = Math.sin(seed) * 10000;
    seed += 1;
    return v - Math.floor(v);
  };
  const uniform = (min: number, max: number) => min + random() * (max - min);
  const rbool = () => random() > 0.5;

  let a = 0, b = 0, c = 0, d = 0, e = 0, flip = false;
  const first = () => { e = uniform(-j, j); next(); };
  const next = () => {
    const flipOld = flip;
    flip = rbool();
    a = flip === flipOld ? -e : e;
    b = uniform(-j, j);
    c = uniform(-j, j);
    d = uniform(-j, j);
    e = uniform(-j, j);
  };

  // Control points in edge-local coordinates: l runs along the edge (0..1), w across it.
  const localPoints = (): Array<[number, number]> => [
    [0.0, 0.0],
    [0.2, a],
    [0.5 + b + d, -t + c],
    [0.5 - t + b, t + c],
    [0.5 - 2 * t + b - d, 3 * t + c],
    [0.5 + 2 * t + b - d, 3 * t + c],
    [0.5 + t + b, t + c],
    [0.5 + b + d, -t + c],
    [0.8, e],
    [1.0, 0.0],
  ];

  const pw = o.width / o.cols;
  const ph = o.height / o.rows;

  // horizontal[r][c]: the cut between row r-1 and row r, for column c (r = 1..rows-1), left to right.
  const horizontal: Edge[][] = [];
  for (let r = 1; r < o.rows; r++) {
    horizontal[r] = [];
    first();
    for (let col = 0; col < o.cols; col++) {
      const sign = flip ? -1 : 1;
      horizontal[r][col] = localPoints().map(([l, w]) => [
        round(o.x + pw * (col + l)),
        round(o.y + ph * r + ph * w * sign),
      ]);
      next();
    }
  }

  // vertical[c][r]: the cut between column c-1 and column c, for row r (c = 1..cols-1), top to bottom.
  const vertical: Edge[][] = [];
  for (let col = 1; col < o.cols; col++) {
    vertical[col] = [];
    first();
    for (let r = 0; r < o.rows; r++) {
      const sign = flip ? -1 : 1;
      vertical[col][r] = localPoints().map(([l, w]) => [
        round(o.x + pw * col + pw * w * sign),
        round(o.y + ph * (r + l)),
      ]);
      next();
    }
  }

  const straight = (from: Point, to: Point): Edge => {
    // A straight edge as three degenerate cubics, so every edge has the same 10-point shape.
    const lerp = (k: number): Point => [round(from[0] + (to[0] - from[0]) * k), round(from[1] + (to[1] - from[1]) * k)];
    return [0, 1 / 9, 2 / 9, 3 / 9, 4 / 9, 5 / 9, 6 / 9, 7 / 9, 8 / 9, 1].map(lerp);
  };
  const reversed = (edge: Edge): Edge => [...edge].reverse();

  const pieces: Piece[] = [];
  for (let r = 0; r < o.rows; r++) {
    for (let col = 0; col < o.cols; col++) {
      const x0 = round(o.x + pw * col), x1 = round(o.x + pw * (col + 1));
      const y0 = round(o.y + ph * r), y1 = round(o.y + ph * (r + 1));
      const top = r === 0 ? straight([x0, y0], [x1, y0]) : horizontal[r][col];
      const right = col === o.cols - 1 ? straight([x1, y0], [x1, y1]) : vertical[col + 1][r];
      const bottom = r === o.rows - 1 ? straight([x1, y1], [x0, y1]) : reversed(horizontal[r + 1][col]);
      const left = col === 0 ? straight([x0, y1], [x0, y0]) : reversed(vertical[col][r]);

      const outline: Point[] = [top[0]];
      for (const edge of [top, right, bottom, left]) outline.push(...edge.slice(1));
      pieces.push({ col, row: r, d: outlineToPath(outline), outline, bbox: bbox(outline) });
    }
  }

  const cutPath = (edges: Edge[]) => edges.map((edge, i) => (i === 0 ? `M ${edge[0][0]} ${edge[0][1]} ` : '') + cubicSegments(edge)).join(' ');
  const cuts = [
    ...horizontal.filter(Boolean).map(cutPath),
    ...vertical.filter(Boolean).map(cutPath),
  ].join(' ');
  const border = `M ${o.x} ${o.y} H ${o.x + o.width} V ${o.y + o.height} H ${o.x} Z`;

  return { options: o, pieces, cuts, border };
}

const cubicSegments = (pts: Point[]) => {
  let s = '';
  for (let i = 1; i + 2 < pts.length; i += 3) {
    s += `C ${pts[i][0]} ${pts[i][1]} ${pts[i + 1][0]} ${pts[i + 1][1]} ${pts[i + 2][0]} ${pts[i + 2][1]} `;
  }
  return s.trim();
};

export const outlineToPath = (outline: Point[]) => `M ${outline[0][0]} ${outline[0][1]} ${cubicSegments(outline)} Z`;

/** Sample the outline's Bézier curves into a polyline (for area checks, hit tests, 3D shapes). */
export function sampleOutline(outline: Point[], stepsPerCurve = 16): Point[] {
  const out: Point[] = [outline[0]];
  for (let i = 0; i + 3 < outline.length; i += 3) {
    const [p0, p1, p2, p3] = [outline[i], outline[i + 1], outline[i + 2], outline[i + 3]];
    for (let s = 1; s <= stepsPerCurve; s++) {
      const u = s / stepsPerCurve, v = 1 - u;
      out.push([
        v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
        v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
      ]);
    }
  }
  return out;
}

/** Signed polygon area (positive for clockwise outlines in SVG's y-down space). */
export function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

function bbox(outline: Point[]) {
  const pts = sampleOutline(outline, 12);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x: round(x), y: round(y), width: round(Math.max(...xs) - x), height: round(Math.max(...ys) - y) };
}
