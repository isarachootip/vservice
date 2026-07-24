const XLSX = require('xlsx');
const path = 'C:\\Users\\isara\\Downloads\\StoreGPS.xlsx';

try {
  const wb = XLSX.readFile(path, { cellDates: true, cellFormulas: true });
  console.log('All Sheet Names:', wb.SheetNames);

  wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    console.log(`Sheet [${name}] range:`, sheet['!ref'], `Total rows in range: ${range.e.r - range.s.r + 1}`);

    // Let's get raw json without auto header skipping
    const dataRaw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Raw rows count in [${name}]:`, dataRaw.length);
    console.log(`Row 0 (headers):`, dataRaw[0]);
    console.log(`Row 1:`, dataRaw[1]);
    console.log(`Row last:`, dataRaw[dataRaw.length - 1]);
  });
} catch (err) {
  console.error("Error reading file:", err);
}
