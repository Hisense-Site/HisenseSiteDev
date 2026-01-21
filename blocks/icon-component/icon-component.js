import {
  updatePosition,
  getSlideWidth,
  resizeObserver,
  throttle,
  mobilePressEffect,
} from '../../utils/carousel-common.js';
import { createElement } from '../../utils/dom-helper.js';

let index = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('li');
  const ul = block.querySelector('ul');
  const containerWidth = block.querySelector('.icon-viewport').offsetWidth;
  const viewportWidth = window.innerWidth;
  // text-left type展示button组件，卡片不需要点击，通过button跳转
  if (!block.classList.contains('text-left')) {
    // mobile 模式需要按压动效
    const goToNextPage = (card) => {
      const link = card.querySelector('a');
      const url = link?.href;
      card.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
    };
    cards.forEach((card) => {
      mobilePressEffect(viewportWidth, card, () => {
        goToNextPage(card);
      });
    });
  }
  const { gap } = window.getComputedStyle(ul);
  if (cards.length * getSlideWidth(block) - parseFloat(gap) > containerWidth) {
    block.querySelector('.icon-pagination').classList.add('show');
  }
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
}

export default async function decorate(block) {
  const iconContainer = createElement('div', 'icon-viewport');
  const iconBlocks = createElement('ul', 'icon-track');
  const titleBox = createElement('div', 'icon-title-box');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 1) {
      titleBox.appendChild(child);
      return;
    }
    const iconBlock = document.createElement('li');
    child.classList.add('item');
    let ctaDiv;
    [...child.children].forEach((item, _i) => {
      switch (_i) {
        case 0:
          item.classList.add('item-picture');
          break;
        case 2:
          item.classList.add('item-cta');
          if (block.classList.contains('text-left')) item.classList.add('show');
          // cta 和label不能自动组合
          if ([...item.children].length === 2) {
            item.querySelector('a').innerHTML = item.lastElementChild.innerHTML;
            item.lastElementChild.remove();
          }
          ctaDiv = item;
          break;
        default:
          item.classList.add('item-text');
      }
      if (!item.innerHTML) item.remove();
    });
    iconBlock.appendChild(child);
    iconBlock.appendChild(ctaDiv);
    iconBlocks.appendChild(iconBlock);
  });
  iconContainer.appendChild(iconBlocks);
  block.appendChild(titleBox);
  block.appendChild(iconContainer);

  if (iconBlocks.children) {
    const buttonContainer = createElement('div', 'icon-pagination');
    buttonContainer.innerHTML = `
      <button type="button" class="slide-prev" disabled></button>
      <button type="button" class="slide-next"></button>
    `;
    block.appendChild(buttonContainer);
  }
  resizeObserver('.icon-component', () => {
    bindEvent(block);
  });
}
