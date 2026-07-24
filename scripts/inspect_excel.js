const XLSX = require('xlsx');
const path = 'C:\\Users\\isara\\Downloads\\StoreGPS.xlsx';

try {
  const wb = XLSX.readFile(path);
  console.log('Sheets:', wb.SheetNames);
  wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n=== Sheet: ${name} (Rows: ${data.length}) ===`);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample rows 1-3:', JSON.stringify(data.slice(0, 3), null, 2));
    }
  });
} catch (err) {
  console.error("Error reading file:", err);
}
