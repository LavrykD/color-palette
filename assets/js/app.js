async function fetchChevrons() {
  const response = await fetch('data/chevrons.json');
  return response.json();
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createSwatch(color, index) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  swatch.dataset.id = color.id;

  const number = document.createElement('span');
  number.className = 'swatch-index';
  number.textContent = `#${index + 1}`;

  const colorBox = document.createElement('span');
  colorBox.className = 'swatch-color';
  colorBox.style.backgroundColor = color.hex;

  const code = document.createElement('span');
  code.className = 'swatch-code';
  code.textContent = color.code;

  swatch.append(number, colorBox, code);
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
  img.addEventListener('error', () => {
    img.classList.add('chevron-image--broken');
    img.alt = `${chevron.name} (image unavailable)`;
  });

  const strip = document.createElement('div');
  strip.className = 'swatch-strip';
  chevron.colors.forEach((color, index) => strip.appendChild(createSwatch(color, index)));

  if (chevron.colors[0]) {
    card.style.setProperty('--card-glow-color', hexToRgba(chevron.colors[0].hex, 0.45));
  }

  card.append(img, strip);
  return card;
}

function renderEmptyState(grid, message) {
  grid.innerHTML = '';
  const empty = document.createElement('p');
  empty.className = 'empty-state';
  empty.textContent = message;
  grid.appendChild(empty);
}

function renderChevrons(grid, chevrons) {
  grid.innerHTML = '';
  if (!Array.isArray(chevrons) || chevrons.length === 0) {
    renderEmptyState(grid, 'No chevrons yet.');
    return;
  }
  chevrons.forEach((chevron) => {
    try {
      grid.appendChild(createCard(chevron));
    } catch (err) {
      // Skip a single malformed entry rather than letting it wipe the whole grid.
      console.error('Skipping malformed chevron entry:', chevron, err);
    }
  });
}

async function init() {
  const grid = document.getElementById('chevron-grid');
  try {
    const chevrons = await fetchChevrons();
    renderChevrons(grid, chevrons);
  } catch (err) {
    renderEmptyState(grid, 'Unable to load chevron data.');
  }
}

init();
