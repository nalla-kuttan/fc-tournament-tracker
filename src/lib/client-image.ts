// Browser-only: shrinks a camera photo before upload. A 12 MP phone photo
// becomes a ~200-400 KB JPEG, which is plenty for reading on-screen numbers.
const MAX_EDGE = 1600;

export async function imageFileToUpload(file: File): Promise<{ mimeType: 'image/jpeg'; data: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo of the stats screen.');

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('That photo format is not supported. Use a JPEG or PNG screenshot.');
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare the photo.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('This browser cannot prepare the photo.');
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let index = 0; index < buffer.length; index += 0x8000) {
    binary += String.fromCharCode(...buffer.subarray(index, index + 0x8000));
  }
  return { mimeType: 'image/jpeg', data: btoa(binary) };
}
