const XLSX = require('xlsx');

function inspect(filePath) {
  try {
    console.log(`\n================ ${filePath} ================`);
    const wb = XLSX.readFile(filePath);
    wb.SheetNames.forEach(name => {
      const sheet = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json(sheet);
      console.log(`Sheet [${name}]: ${data.length} rows`);
      if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample row 0:', JSON.stringify(data[0], null, 2));
      }
    });
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

inspect('C:\\Users\\isara\\Downloads\\StoreGPS.xlsx');
inspect('C:\\Users\\isara\\Downloads\\store_CHG.xlsx');
