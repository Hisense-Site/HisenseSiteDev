import {
  getSlideWidth,
  updatePosition,
  resizeObserver,
  throttle,
  setupObserver,
  whenElementReady,
} from '../../utils/carousel-common.js';
import { createElement } from '../../utils/dom-helper.js';

let carouselId = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  const maxWidth = block.querySelector('.image-viewport').offsetWidth;
  let index = 0;
  const gap = parseInt(window.getComputedStyle(block.querySelector('.image-track')).gap, 10) || 0;
  if (cards.length * getSlideWidth(block) - gap >= maxWidth) {
    block.querySelector('.image-pagination').classList.add('show');
  }
  // 按钮处理
  block.querySelector('.slide-prev').addEventListener('click', throttle(() => {
    if (index > 0) {
      index -= 1;
      updatePosition(block, index, true);
    }
  }, 500));
  block.querySelector('.slide-next').addEventListener('click', throttle(() => {
    if (index < cards.length) {
      index += 1;
      updatePosition(block, index, true);
    }
  }, 500));
  if (!block.classList.contains('video-carousel-block')) return;
  // 视频处理
  block.querySelector('.video-carousel-block .image-track').addEventListener('click', (e) => {
    const dataIndex = e.target.closest('li').dataset.slideIndex;
    block.querySelectorAll('li').forEach((el, i) => {
      if (String(i) === dataIndex) {
        el.querySelector('video')?.play();
      } else {
        el.querySelector('video')?.pause();
      }
    });
    if (e.target.tagName === 'IMG' && e.target.closest('li').querySelector('video')) {
      e.target.style.display = 'none';
    }
  });

  whenElementReady('.video-carousel-block', () => {
    const videos = block.querySelectorAll('.video-autoPlay');
    setupObserver(block, videos, (e) => {
      // resolveCallback
      e.closest('li').querySelector('img').style.display = 'none';
      e.click();
    }, () => {
      // leaveCallback - leave block viewport
      videos.forEach((video) => {
        video.pause();
      });
    });
  });
}

function createVideo(child, idx) {
  let videourl;
  const link = child.querySelector('a');
  if (link) {
    videourl = link.href;
  }
  const videoDivDom = createElement('div', 'video-div-box');
  const img = child.querySelector('img');
  const video = createElement('video', 'video-autoPlay');
  video.id = `video-${carouselId}-carousel-${idx - 2}`;
  video.controls = true;
  video.preload = 'auto';
  video.autoplay = false;
  const source = document.createElement('source');
  source.src = videourl; // 替换为你的视频路径
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  video.muted = true;
  video.playsinline = true;
  video.appendChild(source);
  videoDivDom.appendChild(video);
  videoDivDom.appendChild(img);
  return videoDivDom;
}

export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `image-carousel-${carouselId}`);
  const contentType = block.children[2].innerHTML.includes('video') ? 'video' : 'Image';
  const iconContainer = createElement('div', 'image-viewport');
  const iconBlocks = createElement('ul', 'image-track');
  const titleBox = createElement('div', 'carousel-title-box');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 2) {
      if (idx !== 2) titleBox.appendChild(child);
      else child.remove();
      return;
    }
    const iconBlock = document.createElement('li');
    child.classList.add('item');
    iconBlock.dataset.slideIndex = idx - 3;
    if (contentType === 'video') {
      block.classList.add('video-carousel-block');
      let singleVideo;
      if (block.classList.contains('bottom-center-style')) {
        child.classList.add('video-center-type');
        singleVideo = createVideo(child, idx);
      } else {
        singleVideo = createVideo(child, idx);
        child.classList.add('video-only');
      }
      if (child.querySelector('picture')) {
        child.querySelector('picture').closest('div').classList.add('video-play');
        child.querySelector('picture').closest('div').remove();
      }
      if (singleVideo) child.replaceChild(singleVideo, child.firstElementChild);
      child.lastElementChild.classList.add('item-content');
    } else {
      [...child.children].forEach((item) => {
        if (item.querySelector('picture')) {
          item.querySelector('picture').closest('div').classList.add('item-picture');
        } else if (item.querySelector('.button-container')) {
          item.querySelector('.button-container').closest('div').classList.add('item-cta');
        } else {
          item.classList.add('item-content');
        }
        if (!item.innerHTML) item.remove();
      });
    }
    iconBlock.appendChild(child);
    iconBlocks.appendChild(iconBlock);
  });
  iconContainer.appendChild(iconBlocks);
  block.appendChild(titleBox);
  block.appendChild(iconContainer);

  if (iconBlocks.children) {
    const buttonContainer = createElement('div', 'image-pagination');
    buttonContainer.innerHTML = `
      <button type="button" class="slide-prev" disabled></button>
      <button type="button" class="slide-next"></button>
    `;
    block.appendChild(buttonContainer);
  }
  resizeObserver('.image-carousel', () => {
    bindEvent(block);
  });
}
