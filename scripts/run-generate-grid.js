// scripts/run-generate-grid.js

// Este es un script lanzador de JavaScript simple.
// Su único trabajo es importar y ejecutar la función de nuestro archivo TypeScript.

async function main() {
  try {
    // Importa dinámicamente el módulo de TypeScript.
    // Usamos .js en la ruta porque así es como Node.js lo resolverá después de la transpilación.
    const { generateGrid } = await import('../lib/generateGrid.ts');
    
    console.log('Starting grid generation...');
    await generateGrid();
    console.log('Grid generation script finished successfully.');
    
  } catch (error) {
    console.error('An error occurred while running the generateGrid script:', error);
    process.exit(1); // Salir con un código de error
  }
}

main();
