import { loadScript } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
import { createElement, debounce } from '../../utils/dom-helper.js';

const ANIMATION_DURATION = {
  IMAGE_BRIGHTNESS: 0.3,
  IMAGE_SCALE: 2,
  TEXT_SCROLL: 3,
  TEXT_FADE_IN: 0.1,
  TEXT_FADE_IN_DELAY: 0.1,
  CONTAINER_HEIGHT: 0.3,
};

const CONFIG = {
  MIN_VIEWPORT_HEIGHT: 600,
  SCALE_MULTIPLIER: 1.2,
  MIN_SCALE: 2,
  SCROLL_MULTIPLIER: 2,
};

export default async function decorate(block) {
  const scrollContainer = block.querySelector('div:first-child');
  scrollContainer.className = 'scroll-container';
  const subContainer = block.querySelector('div:nth-child(2)');
  subContainer.className = 'sub-container h-grid-container';

  const img = scrollContainer.querySelector('img');
  if (!img) return;

  const scrollTextContainer = scrollContainer.querySelector('div');
  scrollTextContainer.classList.add('scroll-text-container');
  const picture = scrollTextContainer.children[0];

  const stickyContainer = createElement('div', 'sticky-container h-grid-container');
  scrollContainer.appendChild(stickyContainer);
  const scrollImageContainer = createElement('div', 'scroll-image-container');
  scrollImageContainer.appendChild(picture);
  stickyContainer.appendChild(scrollImageContainer);
  stickyContainer.appendChild(scrollTextContainer);

  const subTextContainer = subContainer.querySelector('div');
  subTextContainer.classList.add('sub-text-container');
  const subImage = subTextContainer.children[0];

  const subImageContainer = createElement('div', 'sub-image-container');
  subImageContainer.appendChild(subImage);
  subContainer.appendChild(subImageContainer);
  subContainer.appendChild(subTextContainer);

  if (isUniversalEditor()) {
    return;
  }

  // Add animated-text class to all children of scroll text container
  Array.from(scrollTextContainer.children).forEach((element) => {
    element.classList.add('animated-text');
  });

  // Load the GSAP library if not already loaded
  if (!window.gsap) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
    } catch (error) {
      return;
    }
  }

  // Load ScrollTrigger plugin if not already loaded
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

  const resizeHandler = () => {
    if (!img.complete) {
      return;
    }
    const shouldAnimate = window.innerHeight >= CONFIG.MIN_VIEWPORT_HEIGHT;
    scrollContainer.classList.toggle('animate', shouldAnimate);
    scrollTextContainer.classList.toggle('animate', shouldAnimate);
    ScrollTrigger.refresh();
  };

  const animate = () => {
    resizeHandler();

    const matchMedia = gsap.matchMedia();

    matchMedia.add({
      aboveMinHeight: `(min-height: ${CONFIG.MIN_VIEWPORT_HEIGHT}px)`,
    }, (context) => {
      const { aboveMinHeight } = context.conditions;
      if (!aboveMinHeight) {
        return;
      }

      scrollTextContainer.classList.add('animate');
      scrollContainer.classList.add('animate');

      // Calculate image dimensions and viewport
      const initialImageWidth = img.clientWidth;
      const initialImageHeight = img.clientHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate scale to fill viewport with margin
      const scaleX = viewportWidth / initialImageWidth;
      const scaleY = viewportHeight / initialImageHeight;
      const fillScale = Math.max(scaleX, scaleY) * CONFIG.SCALE_MULTIPLIER;
      const scale = Math.max(CONFIG.MIN_SCALE, fillScale);

      // Calculate final image height accounting for viewport constraints
      const imageAspectRatio = initialImageWidth / initialImageHeight;
      const finalImageHeight = Math.min(
        initialImageHeight,
        viewportWidth / imageAspectRatio,
      );

      // Adjust margin to account for image scaling
      const scaleOffset = ((scale - 1) * initialImageHeight) / 2;
      scrollContainer.style.marginTop = `${scaleOffset}px`;

      // Calculate scroll trigger start position (when image center aligns with viewport center)
      const calculateScrollStart = () => {
        const imageRect = img.getBoundingClientRect();
        const { scrollY } = window;
        const imageTopAbsolute = imageRect.top + scrollY;
        const imageCenterAbsolute = imageTopAbsolute + (imageRect.height / 2);
        const triggerRect = scrollContainer.getBoundingClientRect();
        const triggerTopAbsolute = triggerRect.top + scrollY;
        const offsetFromTriggerTop = imageCenterAbsolute - triggerTopAbsolute;
        return `top+=${offsetFromTriggerTop} center`;
      };

      // Calculate scroll trigger end position
      const calculateScrollEnd = () => {
        const additionalScroll = (window.innerHeight * CONFIG.SCROLL_MULTIPLIER) + img.clientHeight;
        return `+=${additionalScroll}`;
      };

      // Set up GSAP timeline with ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainer,
          start: calculateScrollStart,
          end: calculateScrollEnd,
          scrub: 1,
          pin: true,
          markers: true,
          anticipatePin: 1,
          onLeave: () => {
            gsap.set(scrollContainer, { height: 'auto' });
          },
          onEnterBack: () => {
            gsap.set(scrollContainer, { height: '100vh' });
          },
          onToggle: (self) => {
            scrollImageContainer.classList.toggle('animating', self.isActive);
          },
        },
      });

      // Scale the image up to fill viewport
      tl.set(img, {
        scale,
        transformOrigin: 'center center',
      });

      // Animation step 1: Dim the image brightness
      tl.fromTo(
        img,
        { filter: 'brightness(1)' },
        {
          filter: 'brightness(0.3)',
          duration: ANIMATION_DURATION.IMAGE_BRIGHTNESS,
        },
        0,
      );

      // Animation step 2: Scroll the text upwards
      tl.fromTo(
        scrollTextContainer,
        {
          yPercent: 100,
        },
        {
          yPercent: -100,
          ease: 'none',
          duration: ANIMATION_DURATION.TEXT_SCROLL,
        },
        '>',
      );

      // Animation step 3: Fade in each line of text while scrolling
      const textLines = gsap.utils.toArray('.scroll-text-container .animated-text');
      textLines.forEach((line) => {
        tl.fromTo(
          line,
          { opacity: 0 },
          {
            opacity: 1,
            ease: 'none',
            duration: ANIMATION_DURATION.TEXT_FADE_IN,
            delay: ANIMATION_DURATION.TEXT_FADE_IN_DELAY,
          },
          '<',
        );
      });

      // Animation step 4: Restore image brightness
      tl.to(
        img,
        {
          filter: 'brightness(1)',
          duration: ANIMATION_DURATION.IMAGE_BRIGHTNESS,
        },
        '-=1',
      );

      // Animation step 5: Scale image back to original size
      tl.to(
        img,
        {
          scale: 1,
          ease: 'power1.inOut',
          duration: ANIMATION_DURATION.IMAGE_SCALE,
        },
        '>',
      );

      // Animation step 6: Set container height to final image height
      tl.to(
        scrollContainer,
        {
          height: `${finalImageHeight}px`,
          duration: ANIMATION_DURATION.CONTAINER_HEIGHT,
        },
        '>',
      );
    });
  };

  resizeHandler();
  const debounceResize = debounce(animate, 500);

  window.addEventListener('resize', debounceResize);

  img.addEventListener('load', animate);
}
