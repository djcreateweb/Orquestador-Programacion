const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname);
const files = ['index.html', 'contacto.html', 'nosotros.html', 'seguros.html'];

const cssContent = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(dir, 'script.js'), 'utf8');

for (const file of files) {
  const htmlContent = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // Extract body content
  let bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyText = bodyMatch ? bodyMatch[1] : '';
  
  // Remove the script tag for script.js
  bodyText = bodyText.replace(/<script\s+src=[\"\']\.\/script\.js[\"\'][^>]*><\/script>/ig, '');
  
  // We place JS at the end
  const finalContent = bodyText.trim() + '\n<script>\n' + jsContent + '\n</script>';
  
  const diviJson = {
    name: "divi/section",
    props: {
        admin_label: "Seccion Principal"
    },
    children: [
      {
        name: "divi/row",
        props: {},
        children: [
          {
            name: "divi/column",
            props: {},
            children: [
              {
                name: "divi/code",
                props: {
                  content: finalContent,
                  advanced: {
                    custom_css: {
                      free_form: cssContent
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  };
  
  const outName = 'LAYOUT-' + file.replace('.html', '').toUpperCase() + '.json';
  fs.writeFileSync(path.join(dir, outName), JSON.stringify(diviJson, null, 2));
  console.log('Created ' + outName);
}
