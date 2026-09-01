import React, { useState, useEffect, useCallback } from 'react';
import DriftWall from '../components/DriftWall';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Download,
  Eye,
  Maximize2
} from 'lucide-react';

interface GalleryItem {
  id: number;
  image: string;
  thumbnail: string;
  title: string;
  category: string;
}

const GALLERY_DATA: GalleryItem[] = [
  { id: 1, image: '/login_gallery/1.webp', thumbnail: '/login_gallery/thumbs/1.webp', title: 'SYMPOSIUM OPENING KEYNOTE', category: 'KEYNOTES' },
  { id: 2, image: '/login_gallery/2.webp', thumbnail: '/login_gallery/thumbs/2.webp', title: 'ALGORITHM HACKATHON ARENA', category: 'COMPETITIONS' },
  { id: 3, image: '/login_gallery/3.webp', thumbnail: '/login_gallery/thumbs/3.webp', title: 'CYBERSECURITY DEFENSE LAB', category: 'COMPETITIONS' },
  { id: 4, image: '/login_gallery/4.webp', thumbnail: '/login_gallery/thumbs/4.webp', title: 'STUDENT COORDINATOR HUBS', category: 'COORDINATION' },
  { id: 5, image: '/login_gallery/5.webp', thumbnail: '/login_gallery/thumbs/5.webp', title: 'DATA SCIENCE CHALLENGE', category: 'COMPETITIONS' },
  { id: 6, image: '/login_gallery/6.webp', thumbnail: '/login_gallery/thumbs/6.webp', title: 'EXECUTIVE COMMITTEE CEREMONY', category: 'CEREMONIES' },
  { id: 7, image: '/login_gallery/7.webp', thumbnail: '/login_gallery/thumbs/7.webp', title: 'SYMPO DELEGATE BRIEFING', category: 'COORDINATION' },
  { id: 8, image: '/login_gallery/8.webp', thumbnail: '/login_gallery/thumbs/8.webp', title: 'HARDWARE CIRCUIT SHOWCASE', category: 'COMPETITIONS' },
  { id: 9, image: '/login_gallery/9.webp', thumbnail: '/login_gallery/thumbs/9.webp', title: 'ROBOTICS ARENA FINALS', category: 'COMPETITIONS' },
  { id: 10, image: '/login_gallery/10.webp', thumbnail: '/login_gallery/thumbs/10.webp', title: 'VALEDICTORY AWARDS NIGHT', category: 'CEREMONIES' },
  { id: 11, image: '/login_gallery/11.webp', thumbnail: '/login_gallery/thumbs/11.webp', title: 'INTER-COLLEGE CODE DUEL', category: 'COMPETITIONS' },
  { id: 12, image: '/login_gallery/12.webp', thumbnail: '/login_gallery/thumbs/12.webp', title: 'CAMPUS AUDITORIUM OVERVIEW', category: 'CEREMONIES' },
  { id: 13, image: '/login_gallery/13.webp', thumbnail: '/login_gallery/thumbs/13.webp', title: 'SPECIAL GUEST TALK & Q&A', category: 'KEYNOTES' },
  { id: 14, image: '/login_gallery/14.webp', thumbnail: '/login_gallery/thumbs/14.webp', title: 'REGISTRATION DESK OPERATIONS', category: 'COORDINATION' },
  { id: 15, image: '/login_gallery/15.webp', thumbnail: '/login_gallery/thumbs/15.webp', title: 'OVERNIGHT HACKATHON ZONE', category: 'COMPETITIONS' },
  { id: 17, image: '/login_gallery/17.JPG', thumbnail: '/login_gallery/thumbs/17.webp', title: 'ALUMNI NETWORKING PANELS', category: 'KEYNOTES' },
  { id: 18, image: '/login_gallery/18.webp', thumbnail: '/login_gallery/thumbs/18.webp', title: 'TROPHY & MEDAL PRESENTATION', category: 'CEREMONIES' },
  { id: 19, image: '/login_gallery/19.webp', thumbnail: '/login_gallery/thumbs/19.webp', title: 'ORGANIZING TEAM MEMORIES', category: 'COORDINATION' },
  { id: 20, image: '/login_gallery/20.webp', thumbnail: '/login_gallery/thumbs/20.webp', title: 'LOGIN SYMPOSIUM CLOSING', category: 'CEREMONIES' },
  { id: 21, image: '/Group_pic.webp', thumbnail: '/login_gallery/thumbs/Group_pic.webp', title: 'LOGIN 2K26 OFFICIAL GROUP PHOTOGRAPH', category: 'TEAM' },
];

export const GalleryPage: React.FC = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Lightbox Navigation
  const nextImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! + 1) % GALLERY_DATA.length);
  }, [lightboxIndex]);

  const prevImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! - 1 + GALLERY_DATA.length) % GALLERY_DATA.length);
  }, [lightboxIndex]);

  // Keyboard Shortcuts for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, nextImage, prevImage]);

  // Map to DriftWall items
  const driftItems = GALLERY_DATA.map((item) => ({
    image: item.image,
    thumbnail: item.thumbnail,
    title: item.title,
  }));

  const handleTileClick = (item: any) => {
    const foundIndex = GALLERY_DATA.findIndex(
      (g) => g.image === item.image || g.title === item.title
    );
    setLightboxIndex(foundIndex >= 0 ? foundIndex : 0);
  };

  return (
    <div className="min-h-screen bg-[#0A0607] pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Radiant Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#130c0e_1px,transparent_1px),linear-gradient(to_bottom,#130c0e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-[radial-gradient(circle,_rgba(224,27,34,0.09)_0%,_transparent_70%)] pointer-events-none filter blur-3xl z-0" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="font-mono text-[10px] text-[#E01B22] font-black tracking-[0.3em] uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E01B22]" /> 3D INTERACTIVE ARCHIVE • LOGIN 2K26
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-[#F7F2F2] tracking-wider uppercase">
            3D DRIFT GALLERY
          </h1>
          <p className="text-xs sm:text-sm text-[#A79798] font-mono tracking-wide leading-relaxed">
            Move mouse to tilt perspective. Click any tile to expand full-resolution photo.
          </p>
        </div>

        {/* Main 3D Drift Wall Display */}
        <div className="bg-[#130C0E] border border-[#E01B22]/40 rounded-[2px] p-2 shadow-2xl relative overflow-hidden">
          <div style={{ height: 620 }}>
            <DriftWall
              items={driftItems}
              columns={5}
              tileWidth={210}
              tileHeight={140}
              gap={18}
              tilt={16}
              turn={-14}
              perspective={1200}
              depth={120}
              speed={38}
              direction="up"
              variance={0.45}
              parallax={0.65}
              lift={64}
              fade={0.6}
              dim={0.6}
              overlayColor="#060010"
              radius={10}
              roll={0}
              pauseOnHover={false}
              grayscale={false}
              onItemClick={handleTileClick}
            />
          </div>

          {/* Interactive Hint Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0A0607]/85 backdrop-blur-md border border-[#E01B22]/50 px-5 py-2 rounded-[2px] font-mono text-[11px] text-[#A79798] flex items-center gap-2.5 shadow-xl">
            <Eye className="w-3.5 h-3.5 text-[#E01B22] animate-pulse" />
            <span>Hover to focus • Click any 3D photo for full view</span>
          </div>
        </div>

        {/* Full-Sized Featured Group Photo Showcase Section at Bottom */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2A1A1D] pb-3">
            <div>
              <span className="font-mono text-[10px] text-[#E08A17] font-bold tracking-[0.2em] uppercase block">
                ✦ OFFICIAL SYMPOSIUM ARCHIVE
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-black text-[#F7F2F2] tracking-wider uppercase">
                LOGIN 2K26 ORGANIZING TEAM & DELEGATES
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#A79798] bg-[#130C0E] border border-[#2A1A1D] px-3 py-1 rounded-[2px]">
              FULL SIZE • HIGH RESOLUTION ARCHIVE
            </span>
          </div>

          <div 
            onClick={() => {
              const groupIndex = GALLERY_DATA.findIndex((g) => g.image === '/Group_pic.webp');
              if (groupIndex >= 0) setLightboxIndex(groupIndex);
            }}
            className="group relative bg-[#130C0E] border border-[#E01B22]/50 hover:border-[#E01B22] rounded-[2px] overflow-hidden cursor-pointer shadow-2xl transition-all duration-300 hover:shadow-[0_0_35px_rgba(224,27,34,0.35)]"
          >
            <img
              src="/Group_pic.webp"
              alt="LOGIN 2K26 Organizing Team & Delegates"
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />

            {/* Overlay Banner on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0607]/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-[#F7F2F2] uppercase tracking-wide">
                    LOGIN 2K26 OFFICIAL GROUP PHOTOGRAPH
                  </h3>
                  <p className="font-mono text-xs text-[#A79798] mt-0.5">
                    Student Coordinators, Staff Advisors & Symposium Organizers
                  </p>
                </div>
                <button className="px-4 py-2 bg-[#E01B22] text-white font-mono text-xs font-bold rounded-[2px] shadow-lg flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" /> VIEW FULLSCREEN
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#130C0E] border border-[#E01B22] rounded-[2px] p-4 sm:p-6 space-y-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-[#2A1A1D] pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#E08A17] font-bold uppercase tracking-wider block">
                  {GALLERY_DATA[lightboxIndex].category} • IMAGE {lightboxIndex + 1} OF {GALLERY_DATA.length}
                </span>
                <h2 className="font-display font-bold text-sm sm:text-base text-[#F7F2F2] uppercase">
                  {GALLERY_DATA[lightboxIndex].title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={GALLERY_DATA[lightboxIndex].image}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 text-[#A79798] hover:text-white hover:bg-[#2A1A1D] rounded-[2px] transition-colors"
                  title="Download full image"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 text-[#A79798] hover:text-white hover:bg-[#2A1A1D] rounded-[2px] transition-colors"
                  title="Close Lightbox (Esc)"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Full-Size Image Container */}
            <div className="relative flex items-center justify-center min-h-[350px] max-h-[75vh] bg-[#0A0607] border border-[#2A1A1D] rounded-[2px] overflow-hidden">
              <img
                src={GALLERY_DATA[lightboxIndex].image}
                alt={GALLERY_DATA[lightboxIndex].title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />

              {/* Prev Button */}
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#0A0607]/80 hover:bg-[#E01B22] text-[#F7F2F2] rounded-[2px] border border-[#2A1A1D] transition-colors shadow-lg"
                title="Previous Image (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Next Button */}
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#0A0607]/80 hover:bg-[#E01B22] text-[#F7F2F2] rounded-[2px] border border-[#2A1A1D] transition-colors shadow-lg"
                title="Next Image (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Footer Navigation Tip */}
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A79798] pt-2 border-t border-[#2A1A1D]">
              <span>💡 Tip: Use Left / Right arrow keys to navigate. Press ESC to close.</span>
              <span className="hidden sm:inline text-[#E08A17] font-bold">LOGIN 2K26 ARCHIVE SYSTEM</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GalleryPage;
