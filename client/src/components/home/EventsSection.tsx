import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { EventOrbit } from '../events/EventOrbit';

// Static event metadata representing the 11 arenas
const STATIC_EVENTS = [
  { id: 1, name: "NOSTOS: The Journey Home", shortName: "Nostos", logo: "/assets/events/nostos.webp", category: "NON_TECHNICAL", slug: "nostos" },
  { id: 2, name: "Code Relay", shortName: "Code Relay", logo: "/assets/events/code_relay.webp", category: "TECHNICAL", slug: "code-relay" },
  { id: 3, name: "In The Slot", shortName: "In The Slot", logo: "/assets/events/in_the_slot.webp", category: "NON_TECHNICAL", slug: "in-the-slot" },
  { id: 4, name: "Debug Arena", shortName: "Debug Arena", logo: "/assets/events/debug_arena.webp", category: "TECHNICAL", slug: "debug-arena" },
  { id: 5, name: "CodeXcape", shortName: "CodeXcape", logo: "/assets/events/code_x_cape.webp", category: "TECHNICAL", slug: "codexcape" },
  { id: 6, name: "Blind Coding", shortName: "Blind Coding", logo: "/assets/events/blind_coding.webp", category: "TECHNICAL", slug: "blind-coding" },
  { id: 7, name: "The Extraction", shortName: "The Extraction", logo: "/assets/events/the_extraction.webp", category: "TECHNICAL", slug: "the-extraction" },
  { id: 8, name: "Pixel Paradox: AI or Reality?", shortName: "Pixel Paradox", logo: "/assets/events/pixel_paradox.webp", category: "NON_TECHNICAL", slug: "pixel-paradox" },
  { id: 9, name: "Project Phoenix: System Recovery", shortName: "Proj Phoenix", logo: "/assets/events/phoenix.webp", category: "TECHNICAL", slug: "project-phoenix" },
  { id: 10, name: "Hunt your Treasure — QR Escape Challenge", shortName: "QR Hunt", logo: "/assets/events/hunt_your_treasure.webp", category: "NON_TECHNICAL", slug: "hunt-your-treasure" },
  { id: 11, name: "Star of LOGIN", shortName: "Star of LOGIN", logo: "/assets/events/star_of_login.webp", category: "TECHNICAL", slug: "star-of-login" }
];

export const EventsSection: React.FC = () => {
  const [events, setEvents] = useState(STATIC_EVENTS);
  const [isExploreHovered, setIsExploreHovered] = useState(false);

  useEffect(() => {
    api.events.getAll().then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        const updated = STATIC_EVENTS.map(item => {
          const matched = res.data.find((e: any) => {
            const nameDb = String(e.name || '').toLowerCase();
            const nameStatic = item.name.toLowerCase();
            return nameDb.includes(nameStatic) || nameStatic.includes(nameDb) ||
                   (nameStatic.includes('qr') && nameDb.includes('treasure')) ||
                   (nameStatic.includes('phoenix') && nameDb.includes('phoenix'));
          });
          return matched ? { ...item, id: matched.id, category: matched.category, slug: matched.slug || item.slug } : item;
        });
        setEvents(updated);
      }
    }).catch(() => setEvents(STATIC_EVENTS));
  }, []);

  return (
    <motion.section 
      id="events-section" 
      className="w-full py-24 bg-[#0A0607] border-b border-[#2A1A1D] relative overflow-hidden"
      style={{ paddingLeft: 'clamp(16px, 3vw, 64px)', paddingRight: 'clamp(16px, 3vw, 64px)' }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        visible: { transition: { staggerChildren: 0.2 } },
        hidden: {}
      }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#130c0e_1px,transparent_1px),linear-gradient(to_bottom,#130c0e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* 1. Left — Introduction (3 columns) */}
          <motion.div 
            className="lg:col-span-3 space-y-4 text-center lg:text-left select-none"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
            }}
          >
            <span className="font-mono text-[11px] text-[#E01B22] font-black tracking-[0.25em] block">
              [ DIRECTIVE // 02 ]
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-black text-[#F7F2F2] tracking-wider uppercase leading-none">
              11 COMPETITION <br className="hidden lg:block" />
              <span className="text-[#E01B22]">ARENAS</span>
            </h2>
            <p className="text-sm text-[#A79798] leading-relaxed font-body font-medium max-w-[28ch] mx-auto lg:mx-0">
              Eleven battlegrounds. <br />
              One ultimate challenge. <br />
              Are you ready?
            </p>
          </motion.div>

          {/* 2. Center — Expanded Circular Event System (7 columns) */}
          <div className="lg:col-span-7 flex justify-center relative">
            <EventOrbit events={events} isExploreHovered={isExploreHovered} />
          </div>

          {/* 3. Right — CTA Link (2 columns) */}
          <motion.div 
            className="lg:col-span-2 flex justify-center lg:justify-end"
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.6, ease: "easeOut" } }
            }}
          >
            <Link
              to="/events"
              className="relative inline-flex items-center gap-2 font-mono text-xs text-[#E01B22] hover:text-[#FF2A2A] font-bold group transition-all duration-300"
              onMouseEnter={() => setIsExploreHovered(true)}
              onMouseLeave={() => setIsExploreHovered(false)}
            >
              <span className="tracking-wider group-hover:tracking-normal transition-all duration-300">
                EXPLORE ALL EVENTS
              </span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
              <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#E01B22] transition-all duration-300 group-hover:w-full" />
            </Link>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
};

export default EventsSection;
