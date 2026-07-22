export type Point = [number, number];
/** Corners in TL, TR, BR, BL order. */
export type Quad = [Point, Point, Point, Point];

/**
 * Closed-form affine matrix [a,b,c,d,e,f] (canvas ctx.transform order)
 * mapping src's 3 points exactly onto dst's 3 points, via Cramer's rule.
 * Returns null when src is degenerate (collinear), which would otherwise
 * divide by zero.
 */
export function affineFromTriangles(
	src: [Point, Point, Point],
	dst: [Point, Point, Point]
): number[] | null {
	const [[x0, y0], [x1, y1], [x2, y2]] = src;
	const [[X0, Y0], [X1, Y1], [X2, Y2]] = dst;
	const denom = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
	if (Math.abs(denom) < 1e-6) return null;
	const a = (X0 * (y1 - y2) + X1 * (y2 - y0) + X2 * (y0 - y1)) / denom;
	const b = (Y0 * (y1 - y2) + Y1 * (y2 - y0) + Y2 * (y0 - y1)) / denom;
	const c = (X0 * (x2 - x1) + X1 * (x0 - x2) + X2 * (x1 - x0)) / denom;
	const d = (Y0 * (x2 - x1) + Y1 * (x0 - x2) + Y2 * (x1 - x0)) / denom;
	const e = (X0 * (x1 * y2 - x2 * y1) + X1 * (x2 * y0 - x0 * y2) + X2 * (x0 * y1 - x1 * y0)) / denom;
	const f = (Y0 * (x1 * y2 - x2 * y1) + Y1 * (x2 * y0 - x0 * y2) + Y2 * (x0 * y1 - x1 * y0)) / denom;
	return [a, b, c, d, e, f];
}

/**
 * Draws image's srcTri region onto ctx's dstTri region: clips to dstTri,
 * applies the affine transform that maps srcTri onto dstTri, then draws
 * the image at its own (0,0) origin so the transform places the right
 * pixels. No per-pixel JS loop: this is a native, hardware-accelerated
 * canvas draw, fast even at full photo resolution on mobile.
 */
export function warpTriangle(
	ctx: CanvasRenderingContext2D,
	image: CanvasImageSource,
	srcTri: [Point, Point, Point],
	dstTri: [Point, Point, Point]
): void {
	const m = affineFromTriangles(srcTri, dstTri);
	if (!m) return;
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(dstTri[0][0], dstTri[0][1]);
	ctx.lineTo(dstTri[1][0], dstTri[1][1]);
	ctx.lineTo(dstTri[2][0], dstTri[2][1]);
	ctx.closePath();
	ctx.clip();
	ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
	ctx.drawImage(image, 0, 0);
	ctx.restore();
}

/**
 * Warps the quadrilateral srcQuad (in image's own pixel space) onto
 * dstQuad (in ctx's space), by splitting both along the 0-2 diagonal and
 * warping each half as a triangle. Used both to build a corrected
 * (unwarped) output from a user-dragged quad, and, in reverse, to stamp a
 * flat image into a skewed quad (e.g. a synthetic photo for a demo/test).
 * Known cosmetic limitation: a faint hairline seam can appear along the
 * diagonal under anti-aliasing — acceptable, doesn't affect OCR legibility.
 */
export function warpQuad(
	ctx: CanvasRenderingContext2D,
	image: CanvasImageSource,
	srcQuad: Quad,
	dstQuad: Quad
): void {
	warpTriangle(ctx, image, [srcQuad[0], srcQuad[1], srcQuad[2]], [dstQuad[0], dstQuad[1], dstQuad[2]]);
	warpTriangle(ctx, image, [srcQuad[0], srcQuad[2], srcQuad[3]], [dstQuad[0], dstQuad[2], dstQuad[3]]);
}

/**
 * A sensible output raster size for the corrected image: the average of
 * the quad's two "width" edges (top/bottom) and two "height" edges
 * (left/right), so the corrected output's resolution tracks the actual
 * photographed content instead of an arbitrary fixed size.
 */
export function quadOutputSize(quad: Quad): { width: number; height: number } {
	const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1]);
	const topWidth = dist(quad[0], quad[1]);
	const bottomWidth = dist(quad[3], quad[2]);
	const leftHeight = dist(quad[0], quad[3]);
	const rightHeight = dist(quad[1], quad[2]);
	return {
		width: Math.max(1, Math.round((topWidth + bottomWidth) / 2)),
		height: Math.max(1, Math.round((leftHeight + rightHeight) / 2))
	};
}
