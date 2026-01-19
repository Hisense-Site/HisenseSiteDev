import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const box = document.createElement('div');
  box.classList.add('icon-display-box');
  [...block.children].forEach((row) => {
    const item = document.createElement('div');
    item.classList.add('icon-display-item');
    moveInstrumentation(row, item);
    while (row.firstElementChild) item.append(row.firstElementChild);
    const text = document.createElement('div');
    text.className = 'icon-display-item-text';
    [...item.children].forEach((div) => {
      if (div.innerHTML.trim() === '') {
        div.remove();
      }
      if (div.querySelector('picture') && div.children.length === 1) { div.className = 'icon-image'; }
      else if (div.children.length === 1) {
        div.className = 'icon-text';
        text.append(div);
      }
    });
    if (text.children.length > 0) item.append(text);
    // or use div.
    box.append(item);
  });
  box.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ height: '40px' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(box);
}
