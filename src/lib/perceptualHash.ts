// Simple perceptual hash implementation using Electron IPC
export class PerceptualHashService {
  async generateHash(imagePath: string): Promise<string> {
    try {
      // Use Electron IPC to read file as base64
      if (!window.electron) {
        console.error('Electron API not available');
        return '';
      }

      const result = await window.electron.readFile(imagePath);
      if (!result.success || !result.buffer) {
        console.error('Failed to read file:', result.error);
        return '';
      }

      // Create image from base64 data
      const img = new Image();
      const dataUrl = `data:image/jpeg;base64,${result.buffer}`;
      
      // Load image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => {
          console.error('Image load error for:', imagePath);
          reject(new Error('Failed to load image'));
        };
        img.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Resize to 8x8 for hash
      const size = 8;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      // Calculate average brightness
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      const average = total / (size * size);

      // Build hash string
      let hash = '';
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        hash += brightness >= average ? '1' : '0';
      }
      
      return hash;
    } catch (error) {
      console.error('Failed to generate perceptual hash for', imagePath, ':', error);
      return '';
    }
  }

  hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return Infinity;
    
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
  }

  areSimilar(hash1: string, hash2: string, threshold: number = 5): boolean {
    const distance = this.hammingDistance(hash1, hash2);
    return distance <= threshold;
  }

  async findSimilarImages(
    photos: { id: string; path: string; hash?: string }[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string[]>> {
    const similarGroups = new Map<string, string[]>();
    const hashes = new Map<string, string>();

    // Generate hashes for photos that don't have them
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      if (photo.hash) {
        hashes.set(photo.id, photo.hash);
      } else {
        const hash = await this.generateHash(photo.path);
        if (hash) {
          hashes.set(photo.id, hash);
        }
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, photos.length);
      }
    }

    const processed = new Set<string>();

    // Find similar images
    for (const [id1, hash1] of hashes.entries()) {
      if (processed.has(id1)) continue;

      const similar: string[] = [id1];
      
      for (const [id2, hash2] of hashes.entries()) {
        if (id1 !== id2 && !processed.has(id2)) {
          if (this.areSimilar(hash1, hash2)) {
            similar.push(id2);
            processed.add(id2);
          }
        }
      }

      if (similar.length > 1) {
        similarGroups.set(id1, similar);
      }
      processed.add(id1);
    }

    return similarGroups;
  }
}

export const perceptualHash = new PerceptualHashService();
