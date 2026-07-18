'use client';

import { useState } from 'react';

function SocialIcon({ name }) {
  const icons = {
    instagram: '📷',
    twitter: '𝕏',
    facebook: '📘',
    pinterest: '📌',
    youtube: '▶',
    tiktok: '🎵',
    linkedin: '💼',
    share: '🔗',
  };
  return <span className={`icon ${name}`}>{icons[name] || name}</span>;
}

export function SocialLinksToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const socialChannels = [
    { name: 'Instagram', icon: 'instagram', handle: '@modestudio', url: 'https://instagram.com' },
    { name: 'Twitter / X', icon: 'twitter', handle: '@modestyle', url: 'https://twitter.com' },
    { name: 'Facebook', icon: 'facebook', handle: 'ModeOfficial', url: 'https://facebook.com' },
    { name: 'Pinterest', icon: 'pinterest', handle: 'ModeDesign', url: 'https://pinterest.com' },
    { name: 'YouTube', icon: 'youtube', handle: 'ModeChannel', url: 'https://youtube.com' },
    { name: 'TikTok', icon: 'tiktok', handle: '@mode_official', url: 'https://tiktok.com' },
    { name: 'LinkedIn', icon: 'linkedin', handle: 'Mode Corporation', url: 'https://linkedin.com' },
  ];

  return (
    <div className="social-links-toggle-container my-6">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="social-toggle-btn flex items-center gap-2.5 bg-[#1d2621] text-[#e8e5dc] hover:bg-[var(--rust)] transition-all px-4 py-2.5 rounded-sm text-xs font-[DM_Mono] uppercase tracking-wider cursor-pointer shadow-sm"
        aria-expanded={isOpen}
      >
        <SocialIcon name="share" />
        <span>{isOpen ? 'Hide Social Channels' : 'Connect & Social Links'}</span>
        <span className={`inline-block transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="social-channels-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 animate-fade-in">
          {socialChannels.map((ch) => (
            <a 
              key={ch.name} 
              href={ch.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-channel-card flex items-center gap-3 p-3 bg-[#1d2420] border border-[#354038] hover:border-[var(--rust)] transition-all rounded-sm text-[#e8e5dc]"
            >
              <span className="text-xl p-1 bg-[#28332c] rounded">{SocialIcon({ name: ch.icon })}</span>
              <div className="overflow-hidden">
                <strong className="block text-xs font-medium truncate">{ch.name}</strong>
                <small className="block text-[10px] text-[#9ca098] truncate">{ch.handle}</small>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
