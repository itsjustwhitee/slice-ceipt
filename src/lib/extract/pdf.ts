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
		const pageText = textContent.items
			.map((item) => ('str' in item ? item.str : ''))
			.join(' ');
		fullText += pageText + '\n';
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
