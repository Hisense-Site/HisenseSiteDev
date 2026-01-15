export default function decorate(block) {
  console.log(block, 'block');
  [...block.children].forEach((row, idx) => {
    console.log(row, 'row---block')
    if (idx === 0) {
      row.className = 'pc-box-img';
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
