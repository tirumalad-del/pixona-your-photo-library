// Mock photo and video data for demonstration
export const mockPhotos = Array.from({ length: 150 }, (_, i) => ({
  id: `media-${i}`,
  url: `https://picsum.photos/seed/${i}/400/400`,
  date: new Date(2024, Math.floor(i / 12), 1 + (i % 28)).toISOString(),
  location: i % 3 === 0 ? "New York, USA" : i % 3 === 1 ? "Paris, France" : undefined,
  type: (i % 7 === 0 ? 'video' : 'photo') as 'photo' | 'video',
}));

export const mockPeople = [
  { id: "person-1", name: "John Doe", photoCount: 234, thumbnailUrl: "https://picsum.photos/seed/face1/200/200" },
  { id: "person-2", name: "Jane Smith", photoCount: 189, thumbnailUrl: "https://picsum.photos/seed/face2/200/200" },
  { id: "person-3", name: "Bob Wilson", photoCount: 156, thumbnailUrl: "https://picsum.photos/seed/face3/200/200" },
  { id: "person-4", name: "Alice Brown", photoCount: 142, thumbnailUrl: "https://picsum.photos/seed/face4/200/200" },
  { id: "person-5", name: "Unnamed", photoCount: 87, thumbnailUrl: "https://picsum.photos/seed/face5/200/200" },
];

export const mockAlbums = [
  { id: "album-1", name: "Summer Vacation 2024", photoCount: 324, coverUrl: "https://picsum.photos/seed/album1/400/400" },
  { id: "album-2", name: "Family Reunion", photoCount: 156, coverUrl: "https://picsum.photos/seed/album2/400/400" },
  { id: "album-3", name: "City Adventures", photoCount: 289, coverUrl: "https://picsum.photos/seed/album3/400/400" },
  { id: "album-4", name: "Nature Shots", photoCount: 412, coverUrl: "https://picsum.photos/seed/album4/400/400" },
];
