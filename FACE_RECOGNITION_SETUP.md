# Face Recognition Setup for PIXONA

This document provides instructions for setting up face recognition capabilities in PIXONA using face-api.js.

## Overview

PIXONA uses @vladmandic/face-api (v1.7.15) for face detection and recognition. This setup requires downloading pre-trained model files and configuring the application to use them.

## Quick Setup

### Step 1: Download Model Files

Run the provided script to automatically download all required model files:

```bash
node download-models.js
```

This will download all 14 model files (~13MB total) to the `public/models/` directory.

### Step 2: Add face-api.js to Dependencies

Add the face-api.js library to your `package.json`:

```bash
npm install @vladmandic/face-api@1.7.15
```

Or manually add to your `package.json` dependencies:

```json
{
  "dependencies": {
    "@vladmandic/face-api": "^1.7.15"
  }
}
```

### Step 3: Verify Installation

Check that the following files exist in `public/models/`:

- ssd_mobilenetv1_model-weights_manifest.json (27.57 KB)
- ssd_mobilenetv1_model.bin (5.36 MB)
- face_recognition_model-weights_manifest.json (19.16 KB)
- face_recognition_model.bin (6.15 MB)
- face_landmark_68_model-weights_manifest.json (8.29 KB)
- face_landmark_68_model.bin (348.48 KB)
- age_gender_model-weights_manifest.json (8.2 KB)
- age_gender_model.bin (419.64 KB)
- face_expression_model-weights_manifest.json (6.82 KB)
- face_expression_model.bin (321.75 KB)
- tiny_face_detector_model-weights_manifest.json (3.14 KB)
- tiny_face_detector_model.bin (188.79 KB)
- face_landmark_68_tiny_model-weights_manifest.json (4.69 KB)
- face_landmark_68_tiny_model.bin (75.41 KB)

## Model Files Details

All model files are sourced from CDN:
`https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/`

### Available Models

1. **SSD MobileNet V1** - Face detection
2. **Face Recognition** - Face recognition and embedding
3. **Face Landmark 68** - 68-point facial landmark detection
4. **Age & Gender** - Age and gender prediction
5. **Face Expression** - Emotion/expression detection
6. **Tiny Face Detector** - Lightweight face detection
7. **Face Landmark 68 Tiny** - Lightweight landmark detection

## Integration Example

Here's a basic example of how to use face-api.js in your React components:

```typescript
import * as faceapi from '@vladmandic/face-api';

// Load models on app initialization
async function loadModels() {
  const MODEL_URL = '/models';
  
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  
  console.log('Face-API models loaded successfully');
}

// Detect faces in an image
async function detectFaces(imageElement: HTMLImageElement) {
  const detections = await faceapi
    .detectAllFaces(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withAgeAndGender()
    .withFaceExpressions();
  
  return detections;
}
```

## Troubleshooting

### Models Not Loading

- Verify all model files are in `public/models/`
- Check browser console for 404 errors
- Ensure the path `/models` is accessible from your app

### Download Script Fails

- Check your internet connection
- Verify you have write permissions to `public/models/`
- Try running with `sudo` if permission denied (Linux/Mac)

### Performance Issues

- Use TinyFaceDetector for faster detection
- Process images at lower resolution
- Consider using Web Workers for heavy computations

## Additional Resources

- [face-api.js Documentation](https://github.com/vladmandic/face-api)
- [Official Examples](https://github.com/vladmandic/face-api/tree/master/examples)
- [Model Training Info](https://github.com/justadudewhohacks/face-api.js)

## Support

For issues specific to PIXONA, please create an issue on the GitHub repository.
For face-api.js library issues, refer to the official repository.

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**face-api.js Version**: 1.7.15
