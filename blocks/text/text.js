import { loadScript } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

export default async function decorate(block) {
  if (isUniversalEditor()) {
    return;
  }

  if (!window.gsap) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
    } catch (error) {
      return;
    }
  }

  if (!window.ScrollTrigger) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js');
    } catch (error) {
      return;
    }
  }

  const {
    gsap,
    ScrollTrigger,
  } = window;

  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 1,
      // markers: true,
    },
  });

  tl.from(block, {
    yPercent: 50,
    duration: 1,
  });

  [...block.children].forEach((row, idx) => {
    if (idx !== 0) {
      row.className = 'text-gray-tips';
    } else {
      row.className = 'text-main';
      const subHeading = row.querySelector('p:first-of-type');
      if (subHeading) {
        subHeading.className = 'text-subheading';
      }
      const headline = row.querySelector('p:nth-of-type(2)');
      if (headline) {
        headline.className = 'text-headline';
      }
      const description = row.querySelector('p:nth-of-type(3)');
      if (description) {
        description.className = 'text-description';
      }
    }
  });
}
