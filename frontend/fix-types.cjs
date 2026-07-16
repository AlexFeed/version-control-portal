const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix Roles
  content = content.replace(/'Admin'/g, "'ADMIN'");
  content = content.replace(/'Developer'/g, "'DEVELOPER'");
  content = content.replace(/'Viewer'/g, "'VIEWER'");
  content = content.replace(/"Admin"/g, "'ADMIN'");
  content = content.replace(/"Developer"/g, "'DEVELOPER'");
  content = content.replace(/"Viewer"/g, "'VIEWER'");

  // Fix User fields
  content = content.replace(/\buser\.name\b/g, "user.login");
  content = content.replace(/\bauthor\.name\b/g, "author.login");
  content = content.replace(/\bauthorName\b/g, "author?.login");
  content = content.replace(/\bu\.name\b/g, "u.login");
  content = content.replace(/\bname:\s*([^,]+),\s*email:\s*[^,]+/g, "login: $1");

  // Fix Optional changes
  content = content.replace(/version\.changes\.length/g, "(version.changes?.length || 0)");
  content = content.replace(/existingVersion\.changes\.length/g, "(existingVersion.changes?.length || 0)");
  content = content.replace(/version\.changes\.map/g, "(version.changes || []).map");

  // Fix Project Status
  content = content.replace(/status:\s*ProjectStatus/g, "status?: ProjectStatus");
  content = content.replace(/status:\s*'in_progress'/g, "");
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
