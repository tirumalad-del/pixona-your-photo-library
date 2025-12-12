#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Model files to download
const models = [
  {
    name: 'ssd_mobilenetv1_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/ssd_mobilenetv1_model-weights_manifest.json'
  },
  {
    name: 'ssd_mobilenetv1_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/ssd_mobilenetv1_model.bin'
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_recognition_model-weights_manifest.json'
  },
  {
    name: 'face_recognition_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_recognition_model.bin'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_landmark_68_model.bin'
  },
  {
    name: 'age_gender_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/age_gender_model-weights_manifest.json'
  },
  {
    name: 'age_gender_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/age_gender_model.bin'
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_expression_model-weights_manifest.json'
  },
  {
    name: 'face_expression_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_expression_model.bin'
  },
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/tiny_face_detector_model.bin'
  },
  {
    name: 'face_landmark_68_tiny_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_landmark_68_tiny_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_tiny_model.bin',
    url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/face_landmark_68_tiny_model.bin'
  }
];

// Target directory
const targetDir = path.join(__dirname, 'public', 'models');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Download function
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Download all models
async function downloadModels() {
  console.log('Downloading face-api.js models...');
  console.log(`Target directory: ${targetDir}`);
  
  for (const model of models) {
    const dest = path.join(targetDir, model.name);
    console.log(`Downloading ${model.name}...`);
    
    try {
      await downloadFile(model.url, dest);
      const stats = fs.statSync(dest);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✓ ${model.name} (${sizeInMB} MB)`);
    } catch (error) {
      console.error(`✗ Failed to download ${model.name}:`, error.message);
    }
  }
  
  console.log('\nDownload complete!');
}

// Run the download
downloadModels().catch(console.error);
