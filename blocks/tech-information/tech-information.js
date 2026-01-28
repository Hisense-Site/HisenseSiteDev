export default async function decorate(block) { 
  console.log(block, 'bb');
  [...block.children].forEach((row, index) => {
    const infoTextDiv = document.createElement('div');
    infoTextDiv.className = 'tech-text-container';
    const infoImageDiv = document.createElement('div');
    infoImageDiv.className = 'tech-image';
    const cols = [...row.children];
    row.classList.add(`tech-information-row-${cols.length}`);
    
  })
}