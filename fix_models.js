const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'mobile', 'lib', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.dart'));

for (const file of files) {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace json['id'] ?? '' with json['id']?.toString() ?? ''
  content = content.replace(/json\['([a-z_]+_)?id'\] \?\? ''/g, "json['$1id']?.toString() ?? ''");
  
  // Also handle cases where it's assigned directly without ?? ''
  // e.g. serviceId: json['service_id'],
  content = content.replace(/([a-zA-Z]+Id): json\['([a-z_]+_)?id'\],/g, "$1: json['$2id']?.toString(),");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
