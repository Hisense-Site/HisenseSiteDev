export default function decorate(block) {
  console.log(block);
  [...block.children].forEach((row) => {
    const type = row.dataset.itemType;
    const { classes } = row.dataset;
    console.log(type, classes);

    if (type === 'image') {
      // image logic
    }

    if (type === 'quote') {
      // quote logic
    }
  });
}
