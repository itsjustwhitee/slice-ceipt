import { describe, expect, it, vi } from 'vitest';
import { extractTextFromImages } from './ocr-batch';

describe('extractTextFromImages', () => {
	it('joins per-image OCR text with a newline', async () => {
		const extractTextFromImage = vi.fn().mockResolvedValueOnce('PAGE ONE').mockResolvedValueOnce('PAGE TWO');
		const result = await extractTextFromImages([new Blob(['a']), new Blob(['b'])], extractTextFromImage, () => {});
		expect(result).toBe('PAGE ONE\nPAGE TWO');
	});

	it('averages per-image progress across all images on every update', async () => {
		const extractTextFromImage = vi
			.fn()
			.mockImplementationOnce(async (_image, onProgress) => {
				onProgress?.(1);
				return 'ONE';
			})
			.mockImplementationOnce(async (_image, onProgress) => {
				onProgress?.(0.5);
				return 'TWO';
			});
		const seen: number[] = [];
		await extractTextFromImages([new Blob(['a']), new Blob(['b'])], extractTextFromImage, (f) => seen.push(f));
		// image one finishes (1) while image two is still at its start (0) -> average 0.5,
		// then image two reaches 0.5 -> average (1 + 0.5) / 2 = 0.75
		expect(seen).toEqual([0.5, 0.75]);
	});

	it('runs OCR on every image concurrently, not sequentially', async () => {
		const order: string[] = [];
		const extractTextFromImage = vi.fn().mockImplementation(async () => {
			order.push('start');
			await Promise.resolve();
			order.push('end');
			return 'x';
		});
		await extractTextFromImages([new Blob(['a']), new Blob(['b'])], extractTextFromImage, () => {});
		expect(order).toEqual(['start', 'start', 'end', 'end']);
	});
});
