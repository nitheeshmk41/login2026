import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-[#0A0607] border-b border-[#2A1A1D] relative overflow-hidden">

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#130c0e_1px,transparent_1px),linear-gradient(to_bottom,#130c0e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">

          {/* Left Column — 45% Image block */}
          <div className="md:col-span-5">
            <div className="relative group overflow-hidden border border-[#2A1A1D] hover:border-[#E01B22]/40 transition-colors duration-500 rounded-[2px] shadow-[0_0_30px_rgba(0,0,0,0.9)]">
              {/* Technical corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#E01B22]/60 z-10 pointer-events-none group-hover:border-[#E01B22] transition-colors duration-350" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#E01B22]/60 z-10 pointer-events-none group-hover:border-[#E01B22] transition-colors duration-350" />

              {/* Image Frame */}
              <div className="aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] overflow-hidden relative">
                <img
                  src="/hero_image_about.webp"
                  alt="LOGIN History Archive"
                  className="w-full h-full object-cover filter grayscale-[40%] contrast-[1.15] brightness-[0.8] group-hover:grayscale-0 group-hover:brightness-95 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0607]/90 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Column — 55% Content block */}
          <div className="md:col-span-7 space-y-6">

            {/* Label and Title */}
            <div className="space-y-2 select-none">
              <span className="font-mono text-[11px] text-[#E01B22] font-black tracking-[0.25em] block">
                // DIRECTIVE // 01
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#F7F2F2] tracking-wider uppercase leading-tight">
                35 YEARS OF MASTERMINDS
              </h2>
            </div>

            {/* Description Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base text-[#A79798] leading-relaxed font-body font-medium">
              <p>
                LOGIN is the national technical symposium organized annually by the Computer Applications Association (CAA), Department of Computer Applications, PSG College of Technology.
              </p>
              <p>
                Since its inception, LOGIN has served as the ultimate arena for top-tier masterminds across the nation. The 2026 edition introduces <strong className="text-[#F7F2F2]">"THE LAST HUMAN"</strong> — challenging participants' logic, code, and endurance under pressure.
              </p>
            </div>

            {/* CTA Link */}
            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[#E01B22] hover:text-[#FF2A2A] font-bold transition-all group tracking-wider hover:translate-x-1 duration-300"
              >
                DISCOVER MORE
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
