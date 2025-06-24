import { cn } from '@/lib/utils';
import React from 'react';
import Image from 'next/image';

interface DisplayTechIconsProps extends TechIconProps {
  iconSize?: number;
  maxIcons?: number;
}

// Map tech names to local image paths if available (all lowercase for robustness)
const localTechImages: Record<string, string> = {
  'react': '/react.svg',
  'tailwind': '/tailwind.svg',
  'java': '/Java.png',
  'python': '/pyhton.png',
  'pytorch': '/pytorch.png',
  'ganache': '/Ganache.png',
  'metamask': '/metamask.png',
  'web3': '/web3.svg',
  'ethereum': '/ethereum.svg',
  'blockchain': '/blockchain.svg',
  'remixide': '/remixide.svg',
  'solidity': '/solidity.svg',
  'hyperledgerfabric': '/hyperledgerfabric.svg',
  'aeronautics': '/Aeronautics.png',
  // Covers
  'amazon': '/covers/amazon.png',
  'facebook': '/covers/facebook.png',
  'hostinger': '/covers/hostinger.png',
  'pinterest': '/covers/pinterest.png',
  'quora': '/covers/quora.png',
  'reddit': '/covers/reddit.png',
  'skype': '/covers/skype.png',
  'spotify': '/covers/spotify.png',
  'telegram': '/covers/telegram.png',
  'tiktok': '/covers/tiktok.png',
  'yahoo': '/covers/yahoo.png',
  'adobe': '/covers/adobe.png',
  'html': '/html.svg',
  'css': '/css.svg',
  'javascript': '/javascript.svg',
  'java script': '/javascript.svg',
  'weapon system': '/tech.svg',
  'basic flight': '/tech.svg',
  'nextjs': '/nextjs.svg',
  'bitcoin': '/bitcoin.svg',
  'dodge': '/dodge.svg',
  'doge': '/dodge.svg',
  'web': '/web.svg',
  'webthree': '/web3.svg',
  'hyperledger': '/hyperledgerfabric.svg',
  'weapon systems': '/weapon_systems.svg',
  'basic flight': '/basic_flight.svg',
  'html css javascript': '/html_css_js.svg',
  'html/css/javascript': '/html_css_js.svg',
  'html,css,javascript': '/html_css_js.svg',
  // Add more mappings as needed
};

const fallbackIcon = '/tech.svg';

const DisplayTechIcons = async ({ techStack, iconSize = 20, maxIcons }: DisplayTechIconsProps) => {
  // Use local image if available, else fallback
  const iconsToShow = (typeof maxIcons === 'number' ? techStack.slice(0, maxIcons) : techStack);
  return (
    <div className="flex flex-row">
      {iconsToShow.map((tech, index) => {
        const key = tech.toLowerCase().replace(/\s+/g, '');
        const localPath = localTechImages[key];
        const src = localPath || fallbackIcon;
        return (
          <div
            key={tech}
            className={cn(
              "relative group bg-dark-300 rounded-full p-2 flex-center",
              index >= 1 && '-ml-3'
            )}
          >
            <span className="tech-tooltip">{tech}</span>
            <Image src={src} alt={tech} width={iconSize} height={iconSize} style={{ width: iconSize, height: iconSize }} />
          </div>
        );
      })}
    </div>
  );
};

export default DisplayTechIcons;