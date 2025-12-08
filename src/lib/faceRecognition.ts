import * as faceapi from '@vladmandic/face-api';
import { PhotoMetadata, Person } from './db';

let modelsLoaded = false;

export class FaceRecognitionService {
  async loadModels(): Promise<void> {
    if (modelsLoaded) return;
    
    const MODEL_URL = '/models'; // Models should be in public/models folder
    
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      console.log('Face recognition models loaded');
    } catch (error) {
      console.error('Failed to load face recognition models:', error);
    }
  }

  async detectFaces(imagePath: string): Promise<Float32Array[]> {
    if (!modelsLoaded) {
      await this.loadModels();
    }

    try {
      const img = await faceapi.fetchImage(imagePath);
      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections.map(d => d.descriptor);
    } catch (error) {
      console.error('Face detection failed:', error);
      return [];
    }
  }

  async clusterFaces(photos: PhotoMetadata[]): Promise<Map<string, string[]>> {
    const faceData: { photoId: string; descriptors: Float32Array[] }[] = [];

    // Detect faces in all photos
    for (const photo of photos) {
      if (photo.type === 'image') {
        const descriptors = await this.detectFaces(photo.path);
        if (descriptors.length > 0) {
          faceData.push({ photoId: photo.id, descriptors });
        }
      }
    }

    // Simple clustering based on distance threshold
    const clusters = new Map<string, string[]>();
    const threshold = 0.6; // Face match threshold
    let clusterIndex = 0;

    for (const face of faceData) {
      for (const descriptor of face.descriptors) {
        let assigned = false;

        // Try to match with existing clusters
        for (const [clusterId, photoIds] of clusters.entries()) {
          const firstPhoto = faceData.find(f => f.photoId === photoIds[0]);
          if (firstPhoto && firstPhoto.descriptors.length > 0) {
            const distance = faceapi.euclideanDistance(descriptor, firstPhoto.descriptors[0]);
            if (distance < threshold) {
              photoIds.push(face.photoId);
              assigned = true;
              break;
            }
          }
        }

        // Create new cluster if no match
        if (!assigned) {
          clusters.set(`person_${clusterIndex++}`, [face.photoId]);
        }
      }
    }

    return clusters;
  }

  async generatePeopleFromClusters(clusters: Map<string, string[]>): Promise<Person[]> {
    const people: Person[] = [];
    let index = 1;

    for (const [clusterId, photoIds] of clusters.entries()) {
      if (photoIds.length > 0) {
        people.push({
          id: clusterId,
          name: `Person ${index}`,
          photoIds,
          avatarPhotoId: photoIds[0],
        });
        index++;
      }
    }

    return people;
  }
}

export const faceRecognition = new FaceRecognitionService();
