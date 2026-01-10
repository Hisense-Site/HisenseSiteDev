import { loadScript } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
import { createElement, debounce } from '../../utils/dom-helper.js';

const ANIMATION_DURATION = {
  IMAGE_BRIGHTNESS: 0.3,
  IMAGE_SCALE: 2,
  TEXT_SCROLL: 3,
  TEXT_FADE_IN: 0.1,
  TEXT_FADE_IN_DELAY: 0.1,
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

  if (scrollTextContainer.children.length > 0) {
    Array.from(scrollTextContainer.children)
      .forEach((element) => {
        element.classList.add('animated-text');
      });
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

  const resizeHandler = () => {
    if (!img.complete) {
      return;
    }
    if (window.innerHeight >= 600) {
      scrollContainer.classList.add('animate');
      scrollTextContainer.classList.add('animate');
    } else {
      scrollContainer.classList.remove('animate');
      scrollTextContainer.classList.remove('animate');
    }
    ScrollTrigger.refresh();
  };

  const scrollTriggerTarget = scrollContainer;

  const animate = () => {
    resizeHandler();

    const matchMedia = gsap.matchMedia();

    matchMedia.add({
      aboveMinHeight: '(min-height: 600px)',
    }, (context) => {
      const { aboveMinHeight } = context.conditions;
      if (aboveMinHeight) {
        scrollTextContainer.classList.add('animate');
        scrollContainer.classList.add('animate');

        // Store initial values for calculations
        const initialImageWidth = img.clientWidth;
        const initialImageHeight = img.clientHeight;
        // Calculate the scale needed to fill viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // Calculate scale based on both dimensions
        const scaleX = viewportWidth / initialImageWidth;
        const scaleY = viewportHeight / initialImageHeight;
        const fillScale = Math.max(scaleX, scaleY) * 1.2; // Add 20% for effect
        const scale = Math.max(2, fillScale);

        const imageAspectRatio = initialImageWidth / initialImageHeight;
        const finalImageHeight = Math.min(
          initialImageHeight,
          viewportWidth / imageAspectRatio,
        );

        scrollContainer.style.marginTop = `${((scale - 1) * initialImageHeight) / 2}px`;

        // Set up GSAP timeline with ScrollTrigger
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scrollTriggerTarget,
            start: () => {
              // Get image position relative to document
              const imageRect = img.getBoundingClientRect();
              const { scrollY } = window;
              const imageTopAbsolute = imageRect.top + scrollY;
              const imageCenterAbsolute = imageTopAbsolute + (imageRect.height / 2);
              // Get trigger position
              const triggerRect = scrollContainer.getBoundingClientRect();
              const triggerTopAbsolute = triggerRect.top + scrollY;
              // Calculate offset from trigger top to image center
              const offsetFromTriggerTop = imageCenterAbsolute - triggerTopAbsolute;
              // Start when the image center is at the viewport center
              return `top+=${offsetFromTriggerTop} center`;
            },
            end: () => {
              const additionalScroll = window.innerHeight * 2 + img.clientHeight;
              return `+=${additionalScroll}`;
            },
            scrub: 1,
            pin: true,
            markers: true,
            onLeave: () => {
              gsap.set(scrollTriggerTarget, { height: 'auto' });
            },
            onEnterBack: () => {
              gsap.set(scrollTriggerTarget, { height: '100vh' });
            },
            anticipatePin: 1,
            onToggle: (self) => {
              if (self.isActive) {
                scrollImageContainer.classList.add('animating');
              } else {
                scrollImageContainer.classList.remove('animating');
              }
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
        const lines = gsap.utils.toArray('.scroll-text-container .animated-text');
        lines.forEach((line) => {
          tl.fromTo(
            line,
            {
              opacity: 0,
            },
            {
              opacity: 1,
              ease: 'none',
              duration: 0.1,
              delay: 0.1,
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
          scrollTriggerTarget,
          {
            height: `${finalImageHeight}px`,
            // ease: 'power1.inOut',
            duration: 0.3,
          },
          '>',
        );
      }
    });
  };

  resizeHandler();
  const debounceResize = debounce(animate, 500);

  window.addEventListener('resize', debounceResize);

  img.addEventListener('load', animate);
}
