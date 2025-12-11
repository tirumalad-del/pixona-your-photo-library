// AI-powered photo detection and search using TensorFlow.js
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as faceapi from '@vladmandic/face-api';

let objectDetectionModel: cocoSsd.ObjectDetection | null = null;
let imageClassificationModel: mobilenet.MobileNet | null = null;
let faceDetectionInitialized = false;

export interface DetectionResult {
  type: 'object' | 'scene' | 'face';
  label: string;
  confidence: number;
  bbox?: { x: number; y: number; width: number; height: number };
}

// Initialize all AI models
export async function initializeAIModels(): Promise<boolean> {
  try {
    console.log('🤖 Loading AI models...');
    
    // Load object detection (COCO-SSD)
    if (!objectDetectionModel) {
      objectDetectionModel = await cocoSsd.load();
      console.log('✅ Object detection model loaded');
    }
    
    // Load image classification (MobileNet)
    if (!imageClassificationModel) {
      imageClassificationModel = await mobilenet.load();
      console.log('✅ Scene classification model loaded');
    }
    
    // Load face detection models
    if (!faceDetectionInitialized) {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      faceDetectionInitialized = true;
      console.log('✅ Face detection models loaded');
    }
    
    console.log('🎉 All AI models ready!');
    return true;
  } catch (error) {
    console.error('❌ Failed to load AI models:', error);
    return false;
  }
}

// Detect objects in image
export async function detectObjects(imagePath: string): Promise<DetectionResult[]> {
  if (!objectDetectionModel) {
    console.warn('Object detection model not loaded');
    return [];
  }
  
  try {
    const img = await loadImage(imagePath);
    const predictions = await objectDetectionModel.detect(img);
    
    return predictions.map(pred => ({
      type: 'object' as const,
      label: pred.class,
      confidence: pred.score,
      bbox: {
        x: pred.bbox[0],
        y: pred.bbox[1],
        width: pred.bbox[2],
        height: pred.bbox[3]
      }
    }));
  } catch (error) {
    console.error('Object detection failed:', error);
    return [];
  }
}

// Classify scene/environment
export async function classifyScene(imagePath: string): Promise<DetectionResult[]> {
  if (!imageClassificationModel) {
    console.warn('Scene classification model not loaded');
    return [];
  }
  
  try {
    const img = await loadImage(imagePath);
    const predictions = await imageClassificationModel.classify(img);
    
    return predictions.map(pred => ({
      type: 'scene' as const,
      label: pred.className,
      confidence: pred.probability
    }));
  } catch (error) {
    console.error('Scene classification failed:', error);
    return [];
  }
}

// Detect faces in image
export async function detectFaces(imagePath: string): Promise<DetectionResult[]> {
  if (!faceDetectionInitialized) {
    console.warn('Face detection not initialized');
    return [];
  }
  
  try {
    const img = await loadImage(imagePath);
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    return detections.map((detection, index) => ({
      type: 'face' as const,
      label: `Person ${index + 1}`,
      confidence: detection.detection.score,
      bbox: {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height
      }
    }));
  } catch (error) {
    console.error('Face detection failed:', error);
    return [];
  }
}

// Analyze photo with all AI models
export async function analyzePhoto(imagePath: string): Promise<DetectionResult[]> {
  const [objects, scenes, faces] = await Promise.all([
    detectObjects(imagePath),
    classifyScene(imagePath),
    detectFaces(imagePath)
  ]);
  
  return [...objects, ...scenes, ...faces];
}

// Search photos using AI tags
export async function searchPhotosByAI(
  photos: any[],
  query: string,
  filterType?: 'object' | 'scene' | 'face' | 'all'
): Promise<any[]> {
  const queryLower = query.toLowerCase();
  const results: any[] = [];
  
  for (const photo of photos) {
    // Generate AI tags if not present
    if (!photo.aiTags) {
      photo.aiTags = await analyzePhoto(photo.path);
    }
    
    // Filter by type if specified
    let tagsToSearch = photo.aiTags;
    if (filterType && filterType !== 'all') {
      tagsToSearch = photo.aiTags.filter((tag: DetectionResult) => tag.type === filterType);
    }
    
    // Search in tags
    const hasMatch = tagsToSearch.some((tag: DetectionResult) =>
      tag.label.toLowerCase().includes(queryLower)
    );
    
    if (hasMatch) {
      results.push(photo);
    }
  }
  
  return results;
}

// Helper function to load image
function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `file://${path}`;
  });
}

// Export initialization status
export function isAIReady(): boolean {
  return objectDetectionModel !== null && 
         imageClassificationModel !== null && 
         faceDetectionInitialized;
}
