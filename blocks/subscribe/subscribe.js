export default function decorate(block) {
  const blockElement = block.getElementsByTagName('div')[0];
  // clear existing content
  block.innerHTML = '';
  // subscribe block
  block.append(document.createTextNode('Subscribe Block'));
}
