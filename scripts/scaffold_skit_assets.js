const fs = require('fs');
const path = require('path');

const characters = {
  shion: [
    'calm-smile.png',
    'gentle.png',
    'surprised.png',
    'thoughtful.png',
    'patient.png',
    'relief.png',
    'ready.png',
    'smiling.png'
  ],
  lumiere: [
    'listening.png',
    'soft-grin.png',
    'teasing.png',
    'wondering.png',
    'curious.png',
    'soft-smile.png',
    'inspired.png',
    'grateful.png'
  ],
  shiopon: [
    'cheerful.png',
    'sparkling-eyes.png',
    'pouting.png',
    'thinking.png',
    'excited.png',
    'warm.png',
    'bouncy.png',
    'radiant.png'
  ]
};

const baseDir = path.join(__dirname, '..', 'assets', 'skit');
const createdDirs = [];
const createdFiles = [];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    createdDirs.push(dirPath);
  }
}

function createPlaceholder(filePath) {
  if (fs.existsSync(filePath)) {
    return;
  }
  const fd = fs.openSync(filePath, 'w');
  fs.closeSync(fd);
  createdFiles.push(filePath);
}

function scaffold() {
  ensureDir(baseDir);

  Object.entries(characters).forEach(([name, files]) => {
    const charDir = path.join(baseDir, name);
    ensureDir(charDir);

    files.forEach((fileName) => {
      const fullPath = path.join(charDir, fileName);
      createPlaceholder(fullPath);
    });
  });

  console.log('Skit asset scaffolding complete.');
  console.log(`Directories created: ${createdDirs.length}`);
  createdDirs.forEach((dir) => console.log(`  - ${dir}`));
  console.log(`Files created: ${createdFiles.length}`);
  createdFiles.forEach((file) => console.log(`  - ${file}`));
}

scaffold();
