import * as xlsx from 'xlsx';
import * as fs from 'fs';

const wb = xlsx.readFile('Edunura_Hill_County_registrations.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

const formattedData = [];

for (const row of rows) {
  if (!row || row.length === 0) continue;
  
  // Index 12 is phone, 13 is parent name, 8 is child name (based on previous output)
  // Let's dynamically find them if possible or just use indices.
  let phone = String(row[12] || '').trim();
  let name = String(row[13] || '').trim();
  
  if (!name) {
    name = String(row[8] || '').trim();
  }
  
  if (!phone || phone === 'undefined' || phone.length < 8) continue;
  
  // Clean phone
  phone = phone.replace(/[^\d+]/g, '');
  if (!phone.startsWith('+')) {
    if (phone.length === 10) {
      phone = '+91' + phone;
    } else if (phone.length === 12 && phone.startsWith('91')) {
      phone = '+' + phone;
    }
  }
  
  formattedData.push({
    'Name': name,
    'Phone number': phone
  });
}

const newWs = xlsx.utils.json_to_sheet(formattedData);
const newWb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWb, newWs, "Contacts");
xlsx.writeFile(newWb, "Formatted_Contacts.xlsx");

console.log(`Successfully formatted ${formattedData.length} contacts.`);
