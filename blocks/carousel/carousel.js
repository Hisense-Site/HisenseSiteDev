import { moveInstrumentation } from '../../scripts/scripts.js';
import { whenElementReady, throttle } from '../../utils/carousel-common.js';

let carouselTimer;
let carouselInterval;
let prevActiveIndex = 0;
function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  const indicators = block.querySelectorAll('.carousel-item-indicator');
  block.dataset.slideIndex = slideIndex;
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', true);
    }
  });
}

function showSlide(block, slideIndex, init = false) {
  const slides = block.querySelectorAll('.carousel-item');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];
  const nav = document.querySelector('#navigation');
  const carouselHeight = block.offsetHeight;
  // 处理homepage高度为100dvh，不影响author，不影响PLP
  if (block.attributes['data-aue-resource'] === undefined && !block.classList.value.includes('only-picture')) {
    const specialDiv = block.querySelector('.carousel-items-container');
    specialDiv.style.setProperty('height', '100dvh');
  }
  // 处理和navigation的联动
  if ([...activeSlide.classList].includes('dark')) {
    block.classList.add('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) document.querySelector('#navigation').classList.add('header-dark-mode');
  } else {
    block.classList.remove('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) document.querySelector('#navigation').classList.remove('header-dark-mode');
  }
  // 首次加载时不滑动也要处理和navigation的联动
  if (init) return;
  // 最后一张划到第一张，不影响author,不影响从第二张回到第一张
  if (realSlideIndex === 0 && block.attributes['data-aue-resource'] === undefined && prevActiveIndex === slides.length - 2) {
    // 1. 先平滑滚动到“克隆的第一张”
    block.querySelector('.carousel-items-container').scrollTo({
      left: slides[slides.length - 1].offsetLeft,
      behavior: 'smooth',
    });

    // 2. 监听滚动结束（或者估算动画时间）
    carouselTimer = setTimeout(() => {
      // 3. 瞬间切换回真正的第一张，关闭动画！
      block.querySelector('.carousel-items-container').scrollTo({
        left: activeSlide.offsetLeft,
        behavior: 'instant', // 关键：无感知跳转
      });
    }, 1000);
  } else {
    block.querySelector('.carousel-items-container').scrollTo({
      top: 0,
      left: activeSlide.offsetLeft,
      behavior: 'smooth',
    });
    if (carouselTimer) carouselTimer = null;
  }
  prevActiveIndex = realSlideIndex;
}
function stopAutoPlay() {
  clearInterval(carouselInterval);
  carouselInterval = null;
  // carouselTimer = null;
}

function autoPlay(block) {
  let currentIndex = block.dataset.slideIndex || 0;
  const images = block.querySelectorAll('.carousel-item');
  carouselInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % (images.length - 1);
    showSlide(block, currentIndex);
  }, 3000);
}

function observeMouse(block) {
  if (block.attributes['data-aue-resource']) return;
  // if (carouselTimer) { stopAutoPlay(); return; }
  autoPlay(block);
  block.addEventListener('mouseenter', stopAutoPlay);
  block.addEventListener('mouseleave', () => {
    autoPlay(block);
  });
}
function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-item-indicators');
  if (!slideIndicators) return;
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-item').forEach((slide) => {
    slideObserver.observe(slide);
  });
  // -----未定版
  // block.querySelector('.slide-prev').addEventListener('click', () => {
  //   showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  // });
  // block.querySelector('.slide-next').addEventListener('click', () => {
  //   showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  // });
  // ------
  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', throttle((e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    }, 500));
  });
  observeMouse(block);
}

function createSlide(block, row, slideIndex) {
  const slide = document.createElement('li');
  const div = document.createElement('div');
  div.setAttribute('class', 'carousel-content h-grid-container');
  moveInstrumentation(row, slide);
  const buttonDiv = document.createElement('div');
  buttonDiv.setAttribute('class', 'carousel-cta-container');
  moveInstrumentation(row, slide);
  slide.classList.add('carousel-item');
  slide.dataset.slideIndex = slideIndex;
  [...row.children].forEach((column, colIdx) => {
    let theme;
    let contentType; // true is svg mode; false is text mode
    let mobileImg;
    let buttonTheme;
    switch (colIdx) {
      case 0:
        // container-reference div
        column.classList.add('carousel-item-image');
        // 处理mobile图片
        if ([...column.querySelectorAll('img')].length > 1) mobileImg = [...column.querySelectorAll('img')][1];
        if (mobileImg) {
          mobileImg.closest('p').style.display = 'none';
          // author 没有source
          const source = document.createElement('source');
          source.setAttribute('srcset', mobileImg.src);
          source.setAttribute('media', '(max-width: 860px)');
          column.querySelector('picture').prepend(source);
          // localhost有4个source
          // const realSource = [...column.querySelectorAll('source')].filter((item) => !item.hasAttribute('media'))[0];
          // realSource?.setAttribute('srcset', mobileImg.src);
          mobileImg.closest('p').remove();
        }
        // 处理image-theme联动nav
        theme = [...column.children][1]?.innerHTML || 'false';
        slide.classList.add(theme === 'true' ? 'dark' : 'light');
        if ([...column.children][1]) [...column.children][1].remove(); // 清除不必要的DOM结构
        break;
      case 1:
        // container-text or svg switch div
        contentType = column.querySelector('p')?.innerHTML || 'false';
        column.innerHTML = '';
        break;
      case 2:
        // colorful text div
        column.classList.add('teal-text');
        break;
      case 3:
        // richtext div
        column.classList.add('carousel-item-content');
        break;
      case 4:
        // icon-svg div
        column.setAttribute('class', 'carousel-item-content icon-svg');
        break;
      default:
        column.classList.add('carousel-item-cta');
        buttonTheme = column.firstElementChild?.innerHTML || 'transparent';
        column.querySelector('a')?.classList.add(buttonTheme);
        column.firstElementChild?.remove();
    }

    if (column.innerHTML === '') return;
    if ([2, 3, 4].includes(colIdx)) {
      // 处理文字和icon是一个container
      div.append(column);
    } else if ([5, 6].includes(colIdx)) {
      buttonDiv.append(column);
    } else slide.append(column);
  });
  div.append(buttonDiv);
  slide.append(div);
  return slide;
}

export default async function decorate(block) {
  const isSingleSlide = [...block.children].length < 2;
  const wholeContainer = document.createElement('ul');
  wholeContainer.classList.add('carousel-items-container');
  let slideIndicators;
  if (!isSingleSlide) {
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-item-indicators');
  }
  [...block.children].forEach((row, idx) => {
    const slide = createSlide(block, row, idx);
    wholeContainer.append(slide);
    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-item-indicator');
      indicator.dataset.targetSlide = String(idx);
      indicator.innerHTML = `
        <button type="button" class="indicator-button"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });
  block.prepend(wholeContainer);
  // 处理轮播无缝衔接；不影响author
  if (!isSingleSlide && block.attributes['data-aue-resource'] === undefined) {
    const cloneFirstNode = wholeContainer.firstElementChild.cloneNode(true);
    wholeContainer.appendChild(cloneFirstNode);
  }
  if (slideIndicators) {
    block.append(slideIndicators);
    // 处理左右箭头---未定版
    // const slideNavButtons = document.createElement('div');
    // slideNavButtons.classList.add('carousel-navigation-buttons');
    // slideNavButtons.innerHTML = `
    //   <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
    //   <button type="button" class="slide-next" aria-label="Next Slide"></button>
    // `;
    // block.append(slideNavButtons);
  }
  if (!isSingleSlide) {
    bindEvents(block);
  }
  // 初始化加载主题色
  whenElementReady('.carousel', () => {
    showSlide(block, 0, true);
  });
}
