async function loadPdfjs() {
	const pdfjsLib = await import('pdfjs-dist');
	const pdfWorkerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
	pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
	return pdfjsLib;
}

export async function extractTextFromPdfTextLayer(data: ArrayBuffer): Promise<string> {
	const pdfjsLib = await loadPdfjs();
	const pdf = await pdfjsLib.getDocument({ data }).promise;
	let fullText = '';
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const textContent = await page.getTextContent();
		for (const item of textContent.items) {
			if (!('str' in item)) continue;
			// pdf.js's own layout signal for "this text item ends a line" —
			// without it, every item on a page (each price, each item name)
			// gets joined with a plain space into one giant line, which the
			// rest of this pipeline can't parse: every downstream line-based
			// heuristic (extractItemLines, parsePriceCents's end-of-line
			// anchor) depends on real newlines matching the printed receipt's
			// actual line breaks, not just whitespace between words.
			fullText += item.str + (item.hasEOL ? '\n' : ' ');
		}
		fullText += '\n';
	}
	return fullText;
}

export async function renderPdfPagesToImages(data: ArrayBuffer): Promise<Blob[]> {
	const pdfjsLib = await loadPdfjs();
	const pdf = await pdfjsLib.getDocument({ data }).promise;
	const blobs: Blob[] = [];
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const viewport = page.getViewport({ scale: 2 });
		const canvas = document.createElement('canvas');
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		await page.render({ canvas, viewport }).promise;
		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(result) => (result ? resolve(result) : reject(new Error('canvas.toBlob failed'))),
				'image/png'
			);
		});
		blobs.push(blob);
	}
	return blobs;
}
