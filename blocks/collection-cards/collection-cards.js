import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const viewportWidth = window.innerWidth;
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.classList.add('card-item');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) { div.className = 'collection-cards-card-image'; } else if (div.querySelector('.button-container')) div.className = 'collection-cards-card-cta';
      else div.className = 'collection-cards-card-body';
    });
    if (viewportWidth < 860) {
      let touchStartTime;
      let isScrolling = false;
      let startX;

      // 触摸开�?
      li.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        startX = e.touches[0].clientX;
        isScrolling = false;
        li.classList.remove('touch-end');
        li.classList.add('touch-start');
      });

      // 触摸移动
      li.addEventListener('touchmove', (e) => {
        const currentX = e.touches[0].clientX;
        // 如果水平移动超过10px，认为是滑动
        if (Math.abs(currentX - startX) > 10) {
          isScrolling = true;
        }
      });

      // 触摸结束
      li.addEventListener('touchend', () => {
        li.classList.remove('touch-start');
        li.classList.add('touch-end');
        const touchDuration = Date.now() - touchStartTime;
        // 如果不是滑动，且按压时间小于500ms，执行跳�?
        if (!isScrolling && touchDuration < 500) {
          const link = li.querySelector('a');
          const url = link?.href;
          if (url) {
            window.location.href = url;
          }
        }
      });
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  if (viewportWidth >= 860) {
    const coverLi = document.querySelectorAll('.cover-style > ul > li');
    coverLi.forEach((item) => {
      const link = item.querySelector('a');
      const url = link?.href;
      item.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
    });
  }
  block.replaceChildren(ul);
}
