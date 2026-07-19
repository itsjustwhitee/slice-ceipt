import { describe, expect, it, vi } from 'vitest';
import { extractReceiptText, type ExtractDeps } from './extract-receipt-text';

function makeDeps(overrides: Partial<ExtractDeps> = {}): ExtractDeps {
	return {
		extractTextFromPdfTextLayer: vi.fn().mockResolvedValue(''),
		renderPdfPagesToImages: vi.fn().mockResolvedValue([]),
		extractTextFromImage: vi.fn().mockResolvedValue(''),
		...overrides
	};
}

describe('extractReceiptText', () => {
	it('uses the PDF text layer directly when it has meaningful content', async () => {
		const deps = makeDeps({
			extractTextFromPdfTextLayer: vi.fn().mockResolvedValue('PANE 2,50\nLATTE 1,80\nTOTALE 4,30')
		});
		const file = new File([new ArrayBuffer(10)], 'receipt.pdf', { type: 'application/pdf' });
		const result = await extractReceiptText(file, deps);
		expect(result).toBe('PANE 2,50\nLATTE 1,80\nTOTALE 4,30');
		expect(deps.renderPdfPagesToImages).not.toHaveBeenCalled();
		expect(deps.extractTextFromImage).not.toHaveBeenCalled();
	});

	it('falls back to rendering + OCR when the PDF text layer is empty (scanned PDF)', async () => {
		const fakeBlob = new Blob(['fake image']);
		const deps = makeDeps({
			extractTextFromPdfTextLayer: vi.fn().mockResolvedValue(''),
			renderPdfPagesToImages: vi.fn().mockResolvedValue([fakeBlob]),
			extractTextFromImage: vi.fn().mockResolvedValue('OCR RESULT')
		});
		const file = new File([new ArrayBuffer(10)], 'scanned.pdf', { type: 'application/pdf' });
		const result = await extractReceiptText(file, deps);
		expect(result).toBe('OCR RESULT');
		expect(deps.renderPdfPagesToImages).toHaveBeenCalledOnce();
		expect(deps.extractTextFromImage).toHaveBeenCalledWith(fakeBlob, expect.any(Function));
	});

	it('falls back to OCR when the PDF text layer is present but below the meaningful-length threshold', async () => {
		const deps = makeDeps({
			extractTextFromPdfTextLayer: vi.fn().mockResolvedValue('  \n '), // whitespace-only, effectively empty
			renderPdfPagesToImages: vi.fn().mockResolvedValue([new Blob(['x'])]),
			extractTextFromImage: vi.fn().mockResolvedValue('OCR RESULT')
		});
		const file = new File([new ArrayBuffer(10)], 'scanned.pdf', { type: 'application/pdf' });
		const result = await extractReceiptText(file, deps);
		expect(result).toBe('OCR RESULT');
	});

	it('joins OCR results from multiple scanned pages with a newline', async () => {
		const deps = makeDeps({
			extractTextFromPdfTextLayer: vi.fn().mockResolvedValue(''),
			renderPdfPagesToImages: vi.fn().mockResolvedValue([new Blob(['a']), new Blob(['b'])]),
			extractTextFromImage: vi
				.fn()
				.mockResolvedValueOnce('PAGE ONE TEXT')
				.mockResolvedValueOnce('PAGE TWO TEXT')
		});
		const file = new File([new ArrayBuffer(10)], 'scanned.pdf', { type: 'application/pdf' });
		const result = await extractReceiptText(file, deps);
		expect(result).toBe('PAGE ONE TEXT\nPAGE TWO TEXT');
	});

	it('OCRs a non-PDF file (photo) directly, skipping PDF-specific steps entirely', async () => {
		const deps = makeDeps({ extractTextFromImage: vi.fn().mockResolvedValue('PHOTO OCR RESULT') });
		const file = new File([new ArrayBuffer(10)], 'photo.jpg', { type: 'image/jpeg' });
		const result = await extractReceiptText(file, deps);
		expect(result).toBe('PHOTO OCR RESULT');
		expect(deps.extractTextFromPdfTextLayer).not.toHaveBeenCalled();
		expect(deps.renderPdfPagesToImages).not.toHaveBeenCalled();
	});

	it('forwards a photo OCR progress callback straight through to extractTextFromImage', async () => {
		const deps = makeDeps({
			extractTextFromImage: vi.fn().mockImplementation(async (_image, onProgress) => {
				onProgress?.(0.5);
				onProgress?.(1);
				return 'PHOTO OCR RESULT';
			})
		});
		const file = new File([new ArrayBuffer(10)], 'photo.jpg', { type: 'image/jpeg' });
		const seen: number[] = [];
		await extractReceiptText(file, deps, (fraction) => seen.push(fraction));
		expect(seen).toEqual([0.5, 1]);
	});

	it('reports progress as 1 immediately when the PDF text layer already has meaningful content', async () => {
		const deps = makeDeps({
			extractTextFromPdfTextLayer: vi.fn().mockResolvedValue('PANE 2,50\nTOTALE 2,50')
		});
		const file = new File([new ArrayBuffer(10)], 'receipt.pdf', { type: 'application/pdf' });
		const seen: number[] = [];
		await extractReceiptText(file, deps, (fraction) => seen.push(fraction));
		expect(seen).toEqual([1]);
	});

	it('averages per-page progress across a multi-page scanned PDF instead of jumping per page', async () => {
		const deps = makeDeps({
			extractTextFromPdfTextLayer: vi.fn().mockResolvedValue(''),
			renderPdfPagesToImages: vi.fn().mockResolvedValue([new Blob(['a']), new Blob(['b'])]),
			extractTextFromImage: vi
				.fn()
				.mockImplementationOnce(async (_image, onProgress) => {
					onProgress?.(1);
					return 'PAGE ONE';
				})
				.mockImplementationOnce(async (_image, onProgress) => {
					onProgress?.(0.5);
					return 'PAGE TWO';
				})
		});
		const file = new File([new ArrayBuffer(10)], 'scanned.pdf', { type: 'application/pdf' });
		const seen: number[] = [];
		await extractReceiptText(file, deps, (fraction) => seen.push(fraction));
		// page one finishes (1) while page two is still at its start (0) -> average 0.5,
		// then page two reaches 0.5 -> average (1 + 0.5) / 2 = 0.75
		expect(seen).toEqual([0.5, 0.75]);
	});
});
