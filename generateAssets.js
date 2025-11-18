// Centro Urbino per cluster piccoli
const lngBase = 12.6371, latBase = 43.7267;

function generatePolygons(n) {
  const polys = [];
  for (let i = 1; i <= n; i++) {
    // Variazione minima per ognuno
    const dx = (i % 10) * 0.00012, dy = Math.floor(i / 10) * 0.00009;
    const poly = [
      [+(lngBase + dx).toFixed(6), +(latBase + dy).toFixed(6)],
      [+(lngBase + dx + 0.00009).toFixed(6), +(latBase + dy + 0.00011).toFixed(6)],
      [+(lngBase + dx - 0.00008).toFixed(6), +(latBase + dy + 0.00007).toFixed(6)],
      [+(lngBase + dx - 0.00012).toFixed(6), +(latBase + dy - 0.00004).toFixed(6)],
      [+(lngBase + dx).toFixed(6), +(latBase + dy).toFixed(6)],
    ];
    polys.push(poly);
  }
  return polys;
}

const polygons = generatePolygons(120);

for (let i = 1; i <= 120; i++) {
  const poly = polygons[i - 1];
  console.log(
    `('immobile','Immobile ${String(i).padStart(3,'0')}',${900 + i * 7},${20 + (i % 9)},'{"type":"Polygon","coordinates":[${JSON.stringify([poly])}]}'),`
  );
}
