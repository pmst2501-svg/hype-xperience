/**
 * Compresses an uploaded image file via HTML5 Canvas so it can be stored cleanly
 * in Firestore (< 250KB) and localStorage while keeping crisp 9:16 visual quality.
 */
export function processUploadedImageFile(
  file: File,
  maxWidth = 1080,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Archivo de imagen vacío'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const targetWidth = Math.round(img.width * scale);
          const targetHeight = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes a local video file from the user's device gallery/multimedia.
 * If the file is compact (< 650KB), converts to a data URL so it can sync to Firestore;
 * otherwise creates a fast local object URL for immediate 9:16 playback.
 */
export function processUploadedVideoFile(
  file: File
): Promise<{ videoUrl: string; isCloudSyncable: boolean; fileName: string }> {
  return new Promise((resolve) => {
    const fileName = file.name;
    if (file.size <= 650 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          resolve({ videoUrl: result, isCloudSyncable: true, fileName });
        } else {
          resolve({
            videoUrl: URL.createObjectURL(file),
            isCloudSyncable: false,
            fileName,
          });
        }
      };
      reader.onerror = () => {
        resolve({
          videoUrl: URL.createObjectURL(file),
          isCloudSyncable: false,
          fileName,
        });
      };
      reader.readAsDataURL(file);
    } else {
      resolve({
        videoUrl: URL.createObjectURL(file),
        isCloudSyncable: false,
        fileName,
      });
    }
  });
}
