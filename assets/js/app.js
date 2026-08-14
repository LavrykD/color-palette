async function fetchChevrons() {
  const response = await fetch('data/chevrons.json');
  return response.json();
}

function createSwatch(color) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  swatch.dataset.id = color.id;

  const colorBox = document.createElement('span');
  colorBox.className = 'swatch-color';
  colorBox.style.backgroundColor = color.hex;

  const code = document.createElement('span');
  code.className = 'swatch-code';
  code.textContent = color.code;

  swatch.append(colorBox, code);
  return swatch;
}

function createCard(chevron) {
  const card = document.createElement('article');
  card.className = 'chevron-card';
  card.dataset.id = chevron.id;

  const img = document.createElement('img');
  img.className = 'chevron-image';
  img.src = chevron.image;
  img.alt = chevron.name;

  const strip = document.createElement('div');
  strip.className = 'swatch-strip';
  chevron.colors.forEach((color) => strip.appendChild(createSwatch(color)));

  card.append(img, strip);
  return card;
}

function renderChevrons(grid, chevrons) {
  grid.innerHTML = '';
  chevrons.forEach((chevron) => grid.appendChild(createCard(chevron)));
}

async function init() {
  const grid = document.getElementById('chevron-grid');
  const chevrons = await fetchChevrons();
  renderChevrons(grid, chevrons);
}

init();
