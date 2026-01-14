export default function decorate(block) {
  [...block.children].forEach((row, idx) => {
    if (idx === 0) {
      row.className = 'pc-box-img';
      // const btnContainer = document.createElement('div')
      // const buttonEl = row.querySelectorAll('.button-container')
      // console.log(buttonEl, 'buttonEl')
      // btnContainer.append(buttonEl);
      // console.log([...row.children].length, 'row123');
      // [...row.children].forEach((column, colIdx) => {
      //   console.log(colIdx, column, 'colIdx, column')
      //   switch(colIdx) {
      //     case 0:
      //       const pEl = document.querySelector('p');
      //       pEl.className = 'banner-img'
      //       console.log(pEl, 'pEl')
      //       if (pEl.classList.contains('button-container')) {
      //         pEl.classList.remove('button-container')
      //       }
      //       break;
          

      //   }
      // })
    } else {
      row.className = 'mobile-box-img';
    }
  });
}
