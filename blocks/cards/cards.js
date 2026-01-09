import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) { div.className = 'cards-card-image'; } else if (div.querySelector('.button-container')) div.className = 'cards-card-cta';
      else div.className = 'cards-card-body';
    });
    // or use li.
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  const viewportWidth = window.innerWidth;
 
  if(viewportWidth >= 900){
      const coverLi = document.querySelectorAll('.cover-style > ul > li');
      coverLi.forEach((item) => {
      const link = item.querySelector('a');
      const url = link?.href;
       item.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
      
    });
  }else{
    console.log('work')
    const cardsLi = document.querySelectorAll('.cards > ul > li');
    cardsLi.forEach((item) => {
    const link = item.querySelector('a');
    const url = link?.href;
    
    item.addEventListener('touchstart', (e) => {
       console.log('start')
      item.classList.add('touch-start');
      item.classList.remove('touch-end', 'touch-cancel');
    })
     item.addEventListener('touchend', (e) => {
      console.log('end')
      item.classList.add('touch-end');
      item.classList.remove('touch-start', 'touch-cancel');
      if (url) window.location.href = url;

    })
  });
  }

  block.replaceChildren(ul);
}
