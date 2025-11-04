// src/utils/imageLoader.js - Versión con debug completo
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ Imagen cargada: ${src}`);
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

const loadAllImages = async () => {
  try {
    console.log('🔄 Iniciando carga de imágenes...');
    console.log('Rutas base:', window.location.origin);
    
    const imagesToLoad = [
      { key: 'playerBoat', src: '/imagenes/barco_usuario.gif' },
      { key: 'normalIsland', src: '/imagenes/isla.jpg' },
      { key: 'cannonIsland', src: '/imagenes/cañon.jpg' },
      { key: 'enemyBoat', src: '/imagenes/Barco_enemigo.gif' },
      { key: 'plane', src: '/imagenes/avion.gif' },
      { key: 'powerUp', src: '/imagenes/escudo.gif' },
      { key: 'bullet', src: '/imagenes/bola_cañon.gif' },
      { key: 'bomb', src: '/imagenes/bola_cañon.gif' }
    ];

    // Verificar si la carpeta existe
    const testImage = new Image();
    testImage.onload = () => console.log('✅ Carpeta /imagenes/ existe');
    testImage.onerror = () => console.error('❌ Carpeta /imagenes/ NO existe');
    testImage.src = '/imagenes/test.jpg'; // Imagen de prueba

    for (const image of imagesToLoad) {
      try {
        gameImages[image.key] = await loadImage(image.src);
        console.log(`✅ ${image.key} cargado correctamente`);
      } catch (error) {
        console.error(`❌ Falló la carga de ${image.key}: ${image.src}`);
        // No rechazamos aquí, continuamos con las demás imágenes
      }
    }
    
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

export { loadImage, gameImages, loadAllImages };