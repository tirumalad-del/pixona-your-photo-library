import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Gauge, Clock, Maximize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { soundManager } from "@/lib/sounds";
import { AIPhotoEditor } from "@/components/AIPhotoEditor";
import { db } from "@/lib/db";

interface Media {
  id: string;
  url: string;
  date: string;
  location?: string;
  type?: 'photo' | 'video';
}

interface LightboxProps {
  media: Media[];
  initialIndex: number;
  onClose: () => void;
}

type TransitionType = 'fade' | 'slide' | 'zoom';

const slideVariants = {
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 1000 : -1000, opacity: 0 })
  },
  zoom: {
    enter: { scale: 0.5, opacity: 0 },
    center: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 }
  }
};

export function Lightbox({ media, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowDirection, setSlideshowDirection] = useState<'forward' | 'backward'>('forward');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [slideshowInterval, setSlideshowInterval] = useState(3000);
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [aiEditingEnabled, setAiEditingEnabled] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia?.type === 'video';

  // Check if AI editing is enabled
  useEffect(() => {
    const checkAiEditing = async () => {
      await db.init();
      const enabled = await db.getSetting<boolean>('aiEditingEnabled');
      setAiEditingEnabled(enabled || false);
    };
    checkAiEditing();
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (slideshowActive) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [slideshowActive]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          if (isFullscreen) {
            exitFullscreen();
          } else {
            soundManager.play('close');
            onClose();
          }
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case " ":
          e.preventDefault();
          toggleSlideshow();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [currentIndex, zoom, isFullscreen]);

  // Slideshow auto-advance
  useEffect(() => {
    if (slideshowActive) {
      const interval = setInterval(() => {
        if (slideshowDirection === 'forward') {
          handleNext();
        } else {
          handlePrevious();
        }
      }, slideshowInterval);
      return () => clearInterval(interval);
    }
  }, [slideshowActive, currentIndex, slideshowDirection, slideshowInterval]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    soundManager.play('click');
  }, [media.length]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    soundManager.play('click');
  }, [media.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVolumeUp = () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (isMuted) setIsMuted(false);
  };

  const handleVolumeDown = () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleSlideshow = () => {
    setSlideshowActive(!slideshowActive);
    if (!slideshowActive) {
      soundManager.play('success');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Use document.documentElement for TRUE F11-style fullscreen
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        soundManager.play('open');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        soundManager.play('close');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [currentMedia, volume, isMuted, playbackSpeed]);

  const currentVariant = slideVariants[transitionType];

  // Handle background click - in fullscreen mode, exit fullscreen first; otherwise close lightbox
  const handleBackgroundClick = () => {
    if (isFullscreen) {
      // Exit fullscreen but stay in lightbox
      exitFullscreen();
      setSlideshowActive(false);
      setShowControls(true);
    } else {
      soundManager.play('close');
      onClose();
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      {/* Header Controls */}
      <motion.div 
        className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: showControls ? 0 : -50, opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <div className="text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
            {currentIndex + 1} / {media.length}
          </div>
          
          {/* Transition selector */}
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
            {(['fade', 'slide', 'zoom'] as TransitionType[]).map((type) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setTransitionType(type);
                }}
                className={`text-white text-xs h-7 px-2 rounded-full ${
                  transitionType === type ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Edit Button */}
          {aiEditingEnabled && !isVideo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                soundManager.play('click');
                setShowAIEditor(true);
              }}
              className="text-white hover:bg-white/10"
              title="AI Edit"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="text-white hover:bg-white/10"
            title="Toggle Fullscreen (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.play('close');
              onClose();
            }}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: showControls ? 0 : -50, opacity: showControls ? 1 : 0 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="text-white hover:bg-white/10 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: showControls ? 0 : 50, opacity: showControls ? 1 : 0 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="text-white hover:bg-white/10 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </motion.div>

      {/* Media Display */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          ref={imageContainerRef}
          key={currentMedia.id}
          custom={direction}
          variants={currentVariant}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ 
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="w-full h-full flex items-center justify-center"
          style={{ 
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <motion.div
            animate={{
              scale: zoom,
              x: position.x,
              y: position.y,
            }}
            transition={{ duration: 0.2 }}
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          >
            {isVideo ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={currentMedia.url}
                  controls
                  autoPlay={isPlaying}
                  className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Video Controls */}
                <motion.div 
                  className="absolute bottom-20 right-4 flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showControls ? 1 : 0 }}
                >
                  {/* Volume Controls */}
                  <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVolumeUp();
                      }}
                      className="text-white hover:bg-white/10 h-8 w-8"
                      title="Volume Up"
                    >
                      <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute();
                      }}
                      className="text-white hover:bg-white/10 h-8 w-8"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVolumeDown();
                      }}
                      className="text-white hover:bg-white/10 h-8 w-8"
                      title="Volume Down"
                    >
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </Button>
                    <div className="text-center text-xs text-white/80 mt-1">
                      {Math.round(volume * 100)}%
                    </div>
                  </div>

                  {/* Speed Controls */}
                  <div className="flex flex-col gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                    <Gauge className="w-4 h-4 text-white/80 mx-auto mb-1" />
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <Button
                        key={speed}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeedChange(speed);
                        }}
                        className={`text-white hover:bg-white/10 text-xs h-7 px-2 ${
                          playbackSpeed === speed ? 'bg-white/20' : ''
                        }`}
                        title={`Speed ${speed}x`}
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt={`Photo from ${currentMedia.date}`}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
                draggable={false}
              />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Controls */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: showControls ? 0 : 50, opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            disabled={zoom <= 1}
            className="text-white hover:bg-white/10 h-8 w-8 rounded-full"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white/80 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            disabled={zoom >= 5}
            className="text-white hover:bg-white/10 h-8 w-8 rounded-full"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Interval Controls */}
        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 mx-2">
          <Clock className="w-4 h-4 text-white/80 ml-2" />
          {[3, 5, 10].map((seconds) => (
            <Button
              key={seconds}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSlideshowInterval(seconds * 1000);
              }}
              className={`text-white hover:bg-white/10 text-xs h-7 px-2 rounded-full ${
                slideshowInterval === seconds * 1000 ? 'bg-white/20' : ''
              }`}
              title={`${seconds}s interval`}
            >
              {seconds}s
            </Button>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSlideshowDirection('backward');
              if (!slideshowActive) toggleSlideshow();
            }}
            className={`text-white hover:bg-white/10 h-8 w-8 rounded-full ${
              slideshowActive && slideshowDirection === 'backward' ? 'bg-white/20' : ''
            }`}
            title="Play Backward"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleSlideshow();
            }}
            className="text-white hover:bg-white/10 h-10 w-10 rounded-full bg-primary/80"
            title="Play/Pause (Space)"
          >
            {slideshowActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSlideshowDirection('forward');
              if (!slideshowActive) toggleSlideshow();
            }}
            className={`text-white hover:bg-white/10 h-8 w-8 rounded-full ${
              slideshowActive && slideshowDirection === 'forward' ? 'bg-white/20' : ''
            }`}
            title="Play Forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Slideshow indicator */}
      {slideshowActive && (
        <motion.div
          className="absolute top-20 left-1/2 -translate-x-1/2 bg-primary/80 text-white px-4 py-2 rounded-full text-sm font-medium"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
        >
          Slideshow Active • {slideshowInterval / 1000}s • {slideshowDirection === 'forward' ? '→' : '←'}
        </motion.div>
      )}

      {/* AI Photo Editor */}
      <AnimatePresence>
        {showAIEditor && currentMedia && (
          <AIPhotoEditor
            photo={{
              id: currentMedia.id,
              src: currentMedia.url,
              name: `Photo_${currentMedia.id}`,
              date: new Date(currentMedia.date),
              location: currentMedia.location,
            }}
            onClose={() => setShowAIEditor(false)}
            onSave={(blob, metadata) => {
              console.log('Saved photo with metadata:', metadata);
              setShowAIEditor(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
