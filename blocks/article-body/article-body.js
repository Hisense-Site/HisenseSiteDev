export default function decorate(block) {
  console.log(block);
  const cloneBlock = block.cloneNode(true);
  block.textContent = '';
  [...cloneBlock.children].forEach((row) => {
    const type = row.firstElementChild?.textContent?.trim() || '';
    if (type === 'headline') {
      const headlineContent = row.children[1]?.textContent?.trim() || '';
      const headlineDiv = document.createElement('div');
      headlineDiv.className = 'text-body-headerline';
      headlineDiv.innerHTML = headlineContent;
      block.append(headlineDiv);
    } else if (type === 'image') {
      const imgEl = row.querySelector('img');
      const imgSrc = imgEl?.src || '';
      const imgAlt = row.children[2]?.textContent?.trim() || '';
      const imageDiv = document.createElement('div');
      imageDiv.className = 'text-body-image';
      imageDiv.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
      block.append(imageDiv);
    } else if (type === 'content') {
      const contentDiv = row.children[1];
      contentDiv.className = 'text-body-content';
      block.append(contentDiv);
    } else if (type === 'quote') {
      const quoteDiv = row.children[1];
      quoteDiv.className = 'text-body-quote';
      block.append(quoteDiv);
    } else if (type === 'flexend-side-by-side') {
      const GroupDiv = document.createElement('div');
      GroupDiv.className = 'text-body-group-flexend';
      const imgEl = row.querySelector('img');
      const imgSrc = imgEl?.src || '';

      const textGroupDiv = document.createElement('div');
      const title = row.children[2] || '';
      const desc = row.children[3] || '';
      textGroupDiv.className = 'text-body-text-group';
      textGroupDiv.append(title, desc);
      GroupDiv.append(imgEl, textGroupDiv);
      block.append(GroupDiv);
    } else {
      console.log('未定义的模块类型：', type, '模块：', row);
    }
  });
  
  
}
