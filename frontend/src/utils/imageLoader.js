// src/utils/imageLoader.js - Versión con debug completo
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ Imagen cargada: ${src} (${img.naturalWidth}x${img.naturalHeight})`);
      resolve(img);
    };
    img.onerror = (error) => {
      console.error(`❌ Error cargando imagen: ${src}`, error);
      reject(error);
    };
    img.src = src;
  });
};

const gameImages = {
  playerBoat: null,
  normalIsland: null,
  cannonIsland: null,
  enemyBoat: null,
  plane: null,
  powerUp: null,
  bullet: null,
  bomb: null
};

// Objeto para almacenar dimensiones reales de las imágenes
const imageSizes = {
  playerBoat: { width: null, height: null },
  normalIsland: { width: null, height: null },
  cannonIsland: { width: null, height: null },
  enemyBoat: { width: null, height: null },
  plane: { width: null, height: null },
  powerUp: { width: null, height: null },
  bullet: { width: null, height: null },
  bomb: { width: null, height: null }
};

const loadAllImages = async () => {
  try {
    console.log('🔄 Iniciando carga de imágenes...');
    console.log('Rutas base:', window.location.origin);
    
    const imagesToLoad = [
      { key: 'playerBoat', src: '/imagenes/barco.png' },
      { key: 'normalIsland', src: '/imagenes/isla.png' },
      { key: 'cannonIsland', src: '/imagenes/cañon.png' },
      { key: 'enemyBoat', src: '/imagenes/Barco_enemigo.png' },
      { key: 'plane', src: '/imagenes/avion.png' },
      { key: 'powerUp', src: '/imagenes/escudo.png' },
      { key: 'bullet', src: '/imagenes/bola_cañon.png' },
      { key: 'bomb', src: '/imagenes/bomba.png' }
    ];

    // Verificar si la carpeta existe
    const testImage = new Image();
    testImage.onload = () => console.log('✅ Carpeta /imagenes/ existe');
    testImage.onerror = () => console.error('❌ Carpeta /imagenes/ NO existe');
    testImage.src = '/imagenes/test.jpg'; // Imagen de prueba

    for (const image of imagesToLoad) {
      try {
        const loadedImg = await loadImage(image.src);
        gameImages[image.key] = loadedImg;
        
        // Guardar dimensiones reales de la imagen
        imageSizes[image.key] = {
          width: loadedImg.naturalWidth,
          height: loadedImg.naturalHeight
        };
        
        console.log(`✅ ${image.key} cargado: ${imageSizes[image.key].width}x${imageSizes[image.key].height}px`);
      } catch (error) {
        console.error(`❌ Falló la carga de ${image.key}: ${image.src}`);
        // No rechazamos aquí, continuamos con las demás imágenes
      }
    }
    
    // Mostrar tabla de dimensiones para debug
    console.log('📐 Dimensiones de imágenes cargadas:');
    console.table(imageSizes);
    
    // Verificar cuántas imágenes se cargaron
    const loadedCount = Object.values(gameImages).filter(img => img !== null).length;
    console.log(`📊 Imágenes cargadas: ${loadedCount}/${imagesToLoad.length}`);
    
    if (loadedCount === imagesToLoad.length) {
      console.log('✅ Todas las imágenes cargadas correctamente');
      return true;
    } else {
      console.warn('⚠️ Algunas imágenes no se cargaron, usando fallbacks');
      return false;
    }
  } catch (error) {
    console.error('❌ Error crítico cargando imágenes:', error);
    return false;
  }
};

export { loadImage, gameImages, imageSizes, loadAllImages };