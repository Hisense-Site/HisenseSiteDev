import { moveInstrumentation } from '../../scripts/scripts.js';

const SCROLL_STEP = 130; // 单个标签宽度 + 间隙

function createScrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? '/content/dam/hisense/us/common-icons/icon-carousel/nav-left-g.svg' : '/content/dam/hisense/us/common-icons/icon-carousel/nav-right-g.svg';
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'left' ? '/content/dam/hisense/us/common-icons/icon-carousel/nav-left.svg' : '/content/dam/hisense/us/common-icons/icon-carousel/nav-right.svg';
  imgClick.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

function buildTab(itemElement, index) {
  const li = document.createElement('li');
  li.className = 'product-filter-item';
  li['data-index'] = index;
  moveInstrumentation(itemElement, li);

  const cells = [...itemElement.children];

  const imageCell = cells.find((cell) => cell.querySelector('picture')) || cells[0];

  const textCells = cells.filter((cell) => {
    const text = cell.textContent.trim();
    return text && !cell.querySelector('picture') && !cell.querySelector('a');
  });
  const textCell = textCells[1] || textCells[0] || cells[1] || cells[0];

  const imgBox = document.createElement('div');
  imgBox.className = 'product-filter-img-box';
  if (imageCell) {
    const picture = imageCell.querySelector('picture');
    if (picture) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'product-filter-img';
      moveInstrumentation(imageCell, imgWrapper);
      imgWrapper.appendChild(picture);
      imgBox.append(imgWrapper);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-filter-img placeholder';
      imgBox.append(placeholder);
    }
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'product-filter-text';
  if (textCell) {
    const text = textCell.textContent.trim();
    if (text) {
      textSpan.textContent = text;
    }
    moveInstrumentation(textCell, textSpan);
  }
  li.addEventListener('click', (e) => {
    const imgUrl = e.target?.src;
    const mainImg = document.querySelector('.pdp-main-img img');
    if (mainImg) {
      mainImg.src = imgUrl;
    }
  });

  li.append(imgBox, textSpan);
  return li;
}

function buildTabDot(itemElement, index) {
  const li = document.createElement('li');
  li.className = 'product-indicators';
  li['data-index'] = index;

  const div = document.createElement('div');
  div.className = 'indicator-button';

  li.addEventListener('click', () => {
    const filterItems = document.querySelectorAll('.product-filter-item');
    // 滚动到对应图片的位置
    filterItems[index].scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    });
  });

  li.append(div);
  return li;
}

function updateButtons(tabsList, leftBtn, rightBtn) {
  leftBtn.disabled = tabsList.scrollLeft <= 0;
  rightBtn.disabled = tabsList.scrollLeft + tabsList.clientWidth >= tabsList.scrollWidth;
}

function attachScrollHandlers(tabsList, leftBtn, rightBtn) {
  // 左箭头点击
  leftBtn.addEventListener('click', () => {
    tabsList.scrollBy({
      left: -SCROLL_STEP,
      behavior: 'smooth',
    });
    setTimeout(() => updateButtons(tabsList, leftBtn, rightBtn), 300);
  });

  // 右箭头点击
  rightBtn.addEventListener('click', () => {
    tabsList.scrollBy({
      left: SCROLL_STEP,
      behavior: 'smooth',
    });
    setTimeout(() => updateButtons(tabsList, leftBtn, rightBtn), 300);
  });

  tabsList.addEventListener('scroll', () => updateButtons(tabsList, leftBtn, rightBtn));
  window.addEventListener('resize', () => updateButtons(tabsList, leftBtn, rightBtn));

  updateButtons(tabsList, leftBtn, rightBtn);
}

function updateActiveDot() {
  const filterItemsContainer = document.querySelector('.product-filters');
  const filterItems = document.querySelectorAll('.product-filter-item');
  const dots = document.querySelectorAll('.product-indicators');
  // 计算每个图片在视口中的可见比例
  filterItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const containerRect = filterItemsContainer.getBoundingClientRect();
    // 当图片至少一半在视口中时，视为“激活”
    const isVisible = rect.left + index * containerRect.width <= 0
        && rect.right <= containerRect.right;
    
    if (isVisible) {
    console.log(rect.left, containerRect.left, rect.right, containerRect.right)
    console.log(isVisible, index)
    }

    if (isVisible) {
      dots[index].classList.add('active');
    } else {
      dots[index].classList.remove('active');
    }
  });
}

export default function decorate(block) {
  // 编辑模式,如果有 data-aue-resource 属性，说明现在浏览的是编辑模式
  const isEditMode = block.hasAttribute('data-aue-resource');

  const tabs = document.createElement('ul');
  tabs.className = 'product-filters';
  const dots = document.createElement('ul');
  dots.className = 'product-carousel';

  let itemElements = [...block.children];
  if (isEditMode) {
    const nodeList = block.querySelectorAll('[data-aue-model="product-filters-carousel-item"], [data-aue-type="component"][data-aue-model]');
    itemElements = [...nodeList];
  }

  itemElements.forEach((item, index) => {
    const itemClone1 = item.cloneNode(true);
    const itemClone2 = item.cloneNode(true);
    const li = buildTab(itemClone1, index);
    const resource = itemClone1.getAttribute && itemClone1.getAttribute('data-aue-resource');
    if (resource) {
      // 保留 data-aue-resource，用于编辑
      li.setAttribute('data-aue-resource', resource);
    }
    tabs.append(li);

    const dotLi = buildTabDot(itemClone2, index);
    dots.append(dotLi);
  });

  tabs.addEventListener('scroll', updateActiveDot);

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  tabsContainer.append(tabs, dots);

  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');
  attachScrollHandlers(tabs, leftBtn, rightBtn);

  const scrollTabs = document.createElement('div');
  scrollTabs.className = 'scroll-tabs';
  scrollTabs.append(leftBtn, tabsContainer, rightBtn);
  if (tabs?.childElementCount > 4) {
    rightBtn.removeAttribute('disabled');
  }
  const media = document.createElement('div');
  media.className = 'pdp-media pdp-width';
  const mediaImg = document.createElement('div');
  mediaImg.className = 'pdp-main-img';
  if (tabs?.childElementCount) {
    const firstImg = tabs.querySelector('.product-filter-img-box .product-filter-img img');
    if (firstImg) {
      mediaImg.append(firstImg.cloneNode(true));
    }
  }
  media.append(mediaImg);
  media.append(scrollTabs);

  window.addEventListener('scroll', () => {
    const mediaRect = media.getBoundingClientRect();
    const navigation = document.querySelector('#navigation');
    if (!navigation) return;
    if (mediaRect.top < 0) {
      navigation.classList.add('scroll-active');
    } else {
      navigation.classList.remove('scroll-active');
    }
  });

  block.replaceChildren(media);
}
