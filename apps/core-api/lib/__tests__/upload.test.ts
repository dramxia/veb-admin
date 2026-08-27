import { describe, expect, it } from 'vitest';
import { isInlinePreviewMime, prepareUploadFile } from '../upload';

function file(name: string, type: string, bytes: number[] | string) {
  return new File(
    [typeof bytes === 'string' ? bytes : new Uint8Array(bytes)],
    name,
    { type },
  );
}

describe('upload validation', () => {
  it('canonicalizes an allowed raster image after checking its signature', async () => {
    const uploaded = await prepareUploadFile(
      file('photo.jpg', 'text/html', [0xff, 0xd8, 0xff, 0xdb, 0x00]),
    );

    expect(uploaded).toMatchObject({
      originalName: 'photo.jpg',
      mime: 'image/jpeg',
      size: 5,
    });
  });

  it.each([
    ['payload.svg', 'image/svg+xml'],
    ['payload.html', 'text/html'],
    ['payload.xml', 'application/xml'],
    ['payload.css', 'text/css'],
  ])('rejects active content: %s', async (name, type) => {
    await expect(
      prepareUploadFile(file(name, type, '<script>alert(1)</script>')),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a spoofed client MIME when the bytes do not match', async () => {
    await expect(
      prepareUploadFile(file('payload.png', 'image/png', '<script>x</script>')),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('keeps only inert formats eligible for inline preview', () => {
    expect(isInlinePreviewMime('image/png')).toBe(true);
    expect(isInlinePreviewMime('text/plain')).toBe(true);
    expect(isInlinePreviewMime('application/pdf')).toBe(false);
    expect(isInlinePreviewMime('text/html')).toBe(false);
  });
});
