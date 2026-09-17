const fs = require('fs');
let content = fs.readFileSync('src/components/InventoryView.tsx', 'utf8');

// First replace all occurrences back to the original
content = content.split(") : selectedCategory === 'mold_sparepart' && activeGroupId ? (\n        <InventoryMoldSubTable items={filteredItems} />\n      ) : (").join(") : (");

// Then do a targeted replacement for the actual place we want
const searchString = `      {/* MAIN INVENTORY TABLE OR SUMMARY TABLE */}
      {selectedCategory === 'mold_sparepart' && !activeGroupId ? (
        <InventoryMoldSummaryTable items={inventoryItems.filter(i => i.category === 'mold_sparepart')} />
      ) : (`;

const replaceString = `      {/* MAIN INVENTORY TABLE OR SUMMARY TABLE */}
      {selectedCategory === 'mold_sparepart' && !activeGroupId ? (
        <InventoryMoldSummaryTable items={inventoryItems.filter(i => i.category === 'mold_sparepart')} />
      ) : selectedCategory === 'mold_sparepart' && activeGroupId ? (
        <InventoryMoldSubTable items={filteredItems} />
      ) : (`;

content = content.replace(searchString, replaceString);

fs.writeFileSync('src/components/InventoryView.tsx', content);
console.log("Fixed");
