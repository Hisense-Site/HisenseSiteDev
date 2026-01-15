function getIsButtonEl (columnElArr,subEl, subIndex) {
  // if (subIndex === columnElArr.length - 2 && subEl.classList.contains('button-container')) {
  //   return true
  // }
  if ((subIndex === columnElArr.length - 1 || subIndex === columnElArr.length - 2) && subEl.classList.contains('button-container')) {
    console.log(subIndex, 'subIndex')
    return true
  }
  return false
}
export default function decorate(block) {
  console.log(block, 'block');
  [...block.children].forEach((row, idx) => {
    console.log(row, 'row---block')
    if (idx === 0) {
      row.className = 'pc-box-img';
      const ctaContainerEl = document.createElement('div');
      ctaContainerEl.className = 'cta-container';
      [...row.children].forEach((column, colIndex) => {
        console.log(column, 'column');
        column.append(ctaContainerEl);
        [...column.children].forEach((subEl, subIndex) => {
          // console.log(subEl,subIndex, 'subel')
          switch(subIndex) {
            case [...column.children].length - 2:
              // console.log(subEl, subIndex,'column.lengh - 2')
              if (subEl.classList.contains('button-container')) {
                subEl.classList.add('green-btn')
              }
              break;
          }
          console.log(getIsButtonEl([...column.children], subEl, subIndex), '5555555555555')
          if (getIsButtonEl([...column.children], subEl, subIndex)) {
            ctaContainerEl.appendChild(subEl)
            
          }
          // if ((subIndex === [...column.children].length - 1) && subEl.classList.contains('button-container')) {
          //   ctaContainerEl.appendChild(subEl)
          //   console.log(ctaContainerEl, 'ctaContainerEl')
          // }
          // console.log(getIsButtonEl([...column.children], subEl, subIndex), 'kkkkkkkk')
        })
        console.log(ctaContainerEl, 'ctaContainerEl')
        
      })
      // 找到所有 .pc-box 元素中的 div 子元素
      // const pcBoxChildDivEl = document.querySelector('.pc-box-img > div');
      // const ctaContainerEl = document.createElement('div')
      // ctaContainerEl.className = 'cta-container'
      // console.log(pcBoxChildDivEl, 'pcBoxDivChildren')
      // const divChildren = Array.from(pcBoxChildDivEl.children);
      // console.log(divChildren, 'divChildren')
    // const lastChildrenEl = divChildren[divChildren.length - 1]
    //   const previousSibling = lastChildrenEl.previousElementSibling;
    //   if (previousSibling.classList.contains('button-container')) {
    //     console.log(previousSibling, 'kkkkkjkj')
    //     previousSibling.className = 'green-btn'
    //     ctaContainerEl.append(previousSibling, lastChildrenEl)
    //   } else {
    //     ctaContainerEl.append(lastChildrenEl)
    //   }
    //   // console.log(pcBoxChildDivEl, 'div');
    //   pcBoxChildDivEl.append(ctaContainerEl)


    // 遍历获取每个 div 的子元素
    // pcBoxDivChildren.forEach((div, index) => {
    //   const children = Array.from(div.children);
    //   console.log(children);
    //   // 或者对每个子元素进行操作
    //   // const lastChildrenEl = children[children.length - 1]
    //   // const previousSibling = lastChildrenEl.previousElementSibling;
    //   // if (previousSibling.classList.contains('button-container')) {
    //   //   console.log(previousSibling, 'kkkkkjkj')
    //   //   previousSibling.className = 'green-btn'
    //   //   ctaContainerEl.append(previousSibling, lastChildrenEl)
    //   // } else {
    //   //   ctaContainerEl.append(lastChildrenEl)
    //   // }
    //   // console.log(div, 'div');
    //   // div.append(ctaContainerEl)
    // });
    // pcBoxDivChildren.append(ctaContainerEl)
    } else {
      row.className = 'mobile-box-img';
    }
  });
}
