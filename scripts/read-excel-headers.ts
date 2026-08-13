import * as xlsx from 'xlsx';
const wb = xlsx.readFile('Edunura_Hill_County_registrations.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = xlsx.utils.sheet_to_json(sheet);
if (json.length > 0) {
  console.log(Object.keys(json[0]));
  console.log(json.slice(0,2));
} else {
  console.log("Empty sheet");
}
