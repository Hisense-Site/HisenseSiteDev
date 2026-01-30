export default async function decorate(block) {
  // console.log(block, 'bb');
  // Create a wrapper for tech items
  const techItemWrapperDom = document.createElement('div');
  techItemWrapperDom.className = 'tech-item-wrapper';
  const techCtaDom = document.createElement('div');
  techCtaDom.className = 'tech-cta-wrapper';
  const infoTextDiv = document.createElement('div');
  infoTextDiv.className = 'tech-info-container';
  [...block.children].forEach((row, index) => {
    // const infoImageDiv = document.createElement('div');
    // infoImageDiv.className = 'tech-image';
    // const cols = [...row.children];
    switch (index) {
      case 0:
        row.className = 'tech-img-wrapper';
        break;
      case 1:
        row.className = 'tech-text-wrapper';
        infoTextDiv.appendChild(row);
        break;
      case 2:
        techCtaDom.appendChild(row);
        break;
      default:
        row.className = 'tech-item-box';
        techItemWrapperDom.appendChild(row);
        break;
    }
  });
  // Append tech items and CTA to info text div
  infoTextDiv.append(techItemWrapperDom, techCtaDom);
  block.append(infoTextDiv);

  // Assign class names to p elements in tech-text-wrapper
  const textWrapperPAll = block.querySelectorAll('.tech-text-wrapper p');
  textWrapperPAll.forEach((p, idx) => {
    if (idx === 0) {
      p.className = 'tech-info-title';
    } else if (idx === 1) {
      p.className = 'tech-info-subtitle';
    } else {
      p.className = 'tech-info-text';
    }
  });
}
