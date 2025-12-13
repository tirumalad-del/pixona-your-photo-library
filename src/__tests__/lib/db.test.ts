import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, PhotoMetadata } from '@/lib/db';

describe('Database Operations', () => {
  beforeEach(async () => {
    await db.init();
  });

  afterEach(async () => {
    // Clean up test data
    await db.clearAllData();
  });

  it('initializes database successfully', async () => {
    // Database should already be initialized
    expect(db).toBeDefined();
  });

  it('adds and retrieves photos', async () => {
    const testPhoto: PhotoMetadata = {
      id: 'test-1',
      path: '/test/photo.jpg',
      name: 'photo.jpg',
      type: 'image',
      size: 1024,
      created: new Date('2024-01-01'),
      modified: new Date('2024-01-01'),
      imported: new Date(),
      tags: [],
      albumIds: [],
      peopleIds: []
    };

    await db.addPhoto(testPhoto);
    const retrieved = await db.getPhoto('test-1');
    
    expect(retrieved?.id).toBe('test-1');
    expect(retrieved?.name).toBe('photo.jpg');
    expect(retrieved?.type).toBe('image');
  });

  it('retrieves all photos', async () => {
    const testPhotos: PhotoMetadata[] = [
      {
        id: 'test-1',
        path: '/test/photo1.jpg',
        name: 'photo1.jpg',
        type: 'image',
        size: 1024,
        created: new Date(),
        modified: new Date(),
        imported: new Date(),
        tags: [],
        albumIds: [],
        peopleIds: []
      },
      {
        id: 'test-2',
        path: '/test/photo2.jpg',
        name: 'photo2.jpg',
        type: 'image',
        size: 2048,
        created: new Date(),
        modified: new Date(),
        imported: new Date(),
        tags: [],
        albumIds: [],
        peopleIds: []
      }
    ];

    await db.addPhotos(testPhotos);
    const allPhotos = await db.getAllPhotos();
    
    expect(allPhotos.length).toBe(2);
  });

  it('updates photo metadata', async () => {
    const testPhoto: PhotoMetadata = {
      id: 'test-1',
      path: '/test/photo.jpg',
      name: 'photo.jpg',
      type: 'image',
      size: 1024,
      created: new Date(),
      modified: new Date(),
      imported: new Date(),
      tags: [],
      albumIds: [],
      peopleIds: []
    };

    await db.addPhoto(testPhoto);
    await db.updatePhoto('test-1', { tags: ['vacation', 'summer'] });
    
    const updated = await db.getPhoto('test-1');
    expect(updated?.tags).toEqual(['vacation', 'summer']);
  });

  it('deletes photos', async () => {
    const testPhoto: PhotoMetadata = {
      id: 'test-1',
      path: '/test/photo.jpg',
      name: 'photo.jpg',
      type: 'image',
      size: 1024,
      created: new Date(),
      modified: new Date(),
      imported: new Date(),
      tags: [],
      albumIds: [],
      peopleIds: []
    };

    await db.addPhoto(testPhoto);
    await db.deletePhoto('test-1');
    
    const deleted = await db.getPhoto('test-1');
    expect(deleted).toBeUndefined();
  });

  it('retrieves photos by date range', async () => {
    const oldPhoto: PhotoMetadata = {
      id: 'old-1',
      path: '/test/old.jpg',
      name: 'old.jpg',
      type: 'image',
      size: 1024,
      created: new Date('2020-01-01'),
      modified: new Date('2020-01-01'),
      imported: new Date(),
      tags: [],
      albumIds: [],
      peopleIds: []
    };

    const newPhoto: PhotoMetadata = {
      id: 'new-1',
      path: '/test/new.jpg',
      name: 'new.jpg',
      type: 'image',
      size: 1024,
      created: new Date('2024-01-01'),
      modified: new Date('2024-01-01'),
      imported: new Date(),
      tags: [],
      albumIds: [],
      peopleIds: []
    };

    await db.addPhotos([oldPhoto, newPhoto]);
    
    const recentPhotos = await db.getPhotosByDate(
      new Date('2023-01-01'),
      new Date('2025-01-01')
    );
    
    expect(recentPhotos.length).toBe(1);
    expect(recentPhotos[0].id).toBe('new-1');
  });
});
