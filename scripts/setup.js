#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Helper function to generate different name formats
function generateNameFormats(projectName) {
  const cleanName = projectName.trim();
  return {
    original: cleanName,
    kebabCase: cleanName.toLowerCase().replace(/\s+/g, '-'),
    camelCase: cleanName.replace(/\s+(.)/g, (_, char) => char.toUpperCase()).replace(/^\w/, c => c.toLowerCase()),
    pascalCase: cleanName.replace(/\s+(.)/g, (_, char) => char.toUpperCase()).replace(/^\w/, c => c.toUpperCase()),
    dotCase: cleanName.toLowerCase().replace(/\s+/g, '.'),
    underscoreCase: cleanName.toLowerCase().replace(/\s+/g, '_'),
    upperCase: cleanName.toUpperCase(),
    titleCase: cleanName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  };
}

function updatePackageJson(projectName, description) {
  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const nameFormats = generateNameFormats(projectName);
  
  packageJson.name = nameFormats.kebabCase;
  packageJson.description = description;
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
}

function updateIndexHtml(projectName, description) {
  const indexHtmlPath = join(__dirname, '../index.html');
  let indexHtml = readFileSync(indexHtmlPath, 'utf8');
  
  // Update title
  indexHtml = indexHtml.replace(
    /<title>.*<\/title>/,
    `<title>${projectName}</title>`
  );
  
  // Update description meta tag
  indexHtml = indexHtml.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${description}" />`
  );
  
  writeFileSync(indexHtmlPath, indexHtml);
  console.log('✅ Updated index.html');
}

function updateElectronBuilder(projectName) {
  const electronBuilderPath = join(__dirname, '../electron-builder.yml');
  if (!existsSync(electronBuilderPath)) return;
  
  let content = readFileSync(electronBuilderPath, 'utf8');
  const nameFormats = generateNameFormats(projectName);
  
  // Update productName
  content = content.replace(
    /productName:\s*FMT Template/,
    `productName: ${nameFormats.original}`
  );
  
  // Update appId (use kebab-case for domain-style naming)
  content = content.replace(
    /appId:\s*com\.fmtsoftware\.appname/,
    `appId: com.fmtsoftware.${nameFormats.kebabCase}`
  );
  
  // Update artifactName
  content = content.replace(
    /artifactName:\s*fmt-template-setup-\$\{version\}\.\$\{ext\}/,
    `artifactName: ${nameFormats.kebabCase}-setup-\${version}.\${ext}`
  );
  
  // Update shortcutName
  content = content.replace(
    /shortcutName:\s*FMT Template/,
    `shortcutName: ${nameFormats.original}`
  );
  
  // Update menuCategory
  content = content.replace(
    /menuCategory:\s*'FMT Template'/,
    `menuCategory: '${nameFormats.original}'`
  );
  
  writeFileSync(electronBuilderPath, content);
  console.log('✅ Updated electron-builder.yml');
}

function updateHelpDrawer(projectName, description) {
  const helpDrawerPath = join(__dirname, '../src/components/shared/HelpDrawer.tsx');
  if (!existsSync(helpDrawerPath)) return;
  
  let content = readFileSync(helpDrawerPath, 'utf8');
  
  // Update application name
  content = content.replace(
    /<h4 className="font-medium">FMT Template Application<\/h4>/,
    `<h4 className="font-medium">${projectName}</h4>`
  );
  
  // Update description
  content = content.replace(
    /A reusable project template for FMT Software solutions\./,
    description
  );
  
  writeFileSync(helpDrawerPath, content);
  console.log('✅ Updated HelpDrawer.tsx');
}

function updateErrorHtml(projectName) {
  const errorHtmlPath = join(__dirname, '../electron-app/error.html');
  if (!existsSync(errorHtmlPath)) return;
  
  let content = readFileSync(errorHtmlPath, 'utf8');
  
  // Update title
  content = content.replace(
    /<title>FMT Template - Error<\/title>/,
    `<title>${projectName} - Error</title>`
  );
  
  // Update error message
  content = content.replace(
    /FMT Template encountered an error while loading\./,
    `${projectName} encountered an error while loading.`
  );
  
  writeFileSync(errorHtmlPath, content);
  console.log('✅ Updated error.html');
}

function updateMainTs(projectName) {
  const mainTsPath = join(__dirname, '../electron-app/main.ts');
  if (!existsSync(mainTsPath)) return;
  
  let content = readFileSync(mainTsPath, 'utf8');
  const nameFormats = generateNameFormats(projectName);
  
  // Update temp directory name
  content = content.replace(
    /path\.join\(os\.tmpdir\(\), 'fmt-template-updates'\)/,
    `path.join(os.tmpdir(), '${nameFormats.kebabCase}-updates')`
  );
  
  writeFileSync(mainTsPath, content);
  console.log('✅ Updated main.ts');
}

function updateReadme(projectName, description) {
  const readmePath = join(__dirname, '../README.md');
  if (!existsSync(readmePath)) return;
  
  let content = readFileSync(readmePath, 'utf8');
  const nameFormats = generateNameFormats(projectName);
  
  // Update main title
  content = content.replace(
    /# FMT Template 1/,
    `# ${projectName}`
  );
  
  // Update description in the first paragraph
  content = content.replace(
    /A comprehensive React application template for FMT Software Solutions that can be packaged as both an Electron desktop app and a web application\./,
    description
  );
  
  // Update clone directory reference
  content = content.replace(
    /cd fmt-template-1/,
    `cd ${nameFormats.kebabCase}`
  );
  
  writeFileSync(readmePath, content);
  console.log('✅ Updated README.md');
}

function updateAutoUpdateFiles(projectName) {
  const nameFormats = generateNameFormats(projectName);
  
  // Update updateConfigManager.ts
  const updateConfigPath = join(__dirname, '../electron-app/updateConfigManager.ts');
  if (existsSync(updateConfigPath)) {
    let content = readFileSync(updateConfigPath, 'utf8');
    content = content.replace(
      /path\.join\(os\.homedir\(\), 'AppData', 'Roaming', 'FMT Template'\)/,
      `path.join(os.homedir(), 'AppData', 'Roaming', '${nameFormats.original}')`
    );
    writeFileSync(updateConfigPath, content);
    console.log('✅ Updated updateConfigManager.ts');
  }
  
  // Update release/README.md
  const releaseReadmePath = join(__dirname, '../release/README.md');
  if (existsSync(releaseReadmePath)) {
    let content = readFileSync(releaseReadmePath, 'utf8');
    content = content.replace(
      /# FMT Template Release Process/,
      `# ${projectName} Release Process`
    );
    content = content.replace(
      /FMT Template Electron application/,
      `${projectName} Electron application`
    );
    writeFileSync(releaseReadmePath, content);
    console.log('✅ Updated release/README.md');
  }
  
  // Update release/release-config.js
  const releaseConfigPath = join(__dirname, '../release/release-config.js');
  if (existsSync(releaseConfigPath)) {
    let content = readFileSync(releaseConfigPath, 'utf8');
    content = content.replace(
      /appName: "FMT Template"/,
      `appName: "${nameFormats.original}"`
    );
    writeFileSync(releaseConfigPath, content);
    console.log('✅ Updated release/release-config.js');
  }
  
  // Update release/scripts/release-manifest.js
  const releaseManifestPath = join(__dirname, '../release/scripts/release-manifest.js');
  if (existsSync(releaseManifestPath)) {
    let content = readFileSync(releaseManifestPath, 'utf8');
    content = content.replace(
      /project: 'FMT Template'/,
      `project: '${nameFormats.original}'`
    );
    content = content.replace(
      /description: 'Release manifest for FMT Template application'/,
      `description: 'Release manifest for ${nameFormats.original} application'`
    );
    writeFileSync(releaseManifestPath, content);
    console.log('✅ Updated release/scripts/release-manifest.js');
  }
  
  // Update release scripts
  const releaseScripts = [
    '../release/scripts/release.bat',
    '../release/scripts/release.ps1',
    '../release/scripts/release.sh'
  ];
  
  releaseScripts.forEach(scriptPath => {
    const fullPath = join(__dirname, scriptPath);
    if (existsSync(fullPath)) {
      let content = readFileSync(fullPath, 'utf8');
      content = content.replace(
        /FMT Template Release Script/,
        `${nameFormats.original} Release Script`
      );
      writeFileSync(fullPath, content);
    }
  });
  console.log('✅ Updated release scripts');
  
  // Update React components
  const reactComponents = [
    '../src/modules/auto-update/RestartToUpdateButton.tsx',
    '../src/modules/auto-update/hooks/useAutoUpdateCheck.ts',
    '../src/modules/auto-update/UpdateSettings.tsx'
  ];
  
  reactComponents.forEach(componentPath => {
    const fullPath = join(__dirname, componentPath);
    if (existsSync(fullPath)) {
      let content = readFileSync(fullPath, 'utf8');
      content = content.replace(
        /FMT-Template-/g,
        `${nameFormats.kebabCase}-`
      );
      writeFileSync(fullPath, content);
    }
  });
  console.log('✅ Updated auto-update React components');
}

async function main() {
  console.log('🚀 FMT Template Setup');
  console.log('This script will help you customize the template for your project.\n');

  const projectName = await question('Enter your project name: ');
  const description = await question('Enter your project description: ');

  console.log('\n📝 Updating files...');
  
  updatePackageJson(projectName, description);
  updateIndexHtml(projectName, description);
  updateElectronBuilder(projectName);
  updateHelpDrawer(projectName, description);
  updateErrorHtml(projectName);
  updateMainTs(projectName);
  updateReadme(projectName, description);
  updateAutoUpdateFiles(projectName);

  console.log('\n✨ Setup complete!');
  console.log('All template references have been updated with your project details.');
  console.log('\nNext steps:');
  console.log('1. Install dependencies: bun install');
  console.log('2. Set up your environment variables in .env.local');
  console.log('3. Start development: bun run dev');
  
  rl.close();
}

main().catch(console.error);