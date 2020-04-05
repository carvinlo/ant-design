const fs = require('fs');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const packageInfo = require('./package.json');
const defaultVars = require('./scripts/default-vars');
const darkVars = require('./scripts/dark-vars');
const compactVars = require('./scripts/compact-vars');

// We need compile additional content for antd user
function finalizeCompile() {
  if (fs.existsSync(path.join(__dirname, './lib'))) {
    // Build package.json version to lib/version/index.js
    // prevent json-loader needing in user-side
    const versionFilePath = path.join(process.cwd(), 'lib', 'version', 'index.js');
    const versionFileContent = fs.readFileSync(versionFilePath).toString();
    fs.writeFileSync(
      versionFilePath,
      versionFileContent.replace(
        /require\(('|")\.\.\/\.\.\/package\.json('|")\)/,
        `{ version: '${packageInfo.version}' }`,
      ),
    );
    // eslint-disable-next-line no-console
    console.log('Wrote version into lib/version/index.js');

    // Build package.json version to lib/version/index.d.ts
    // prevent https://github.com/ant-design/ant-design/issues/4935
    const versionDefPath = path.join(process.cwd(), 'lib', 'version', 'index.d.ts');
    fs.writeFileSync(
      versionDefPath,
      `declare var _default: "${packageInfo.version}";\nexport default _default;\n`,
    );
    // eslint-disable-next-line no-console
    console.log('Wrote version into lib/version/index.d.ts');

    // Build a entry less file to dist/antd.less
    const componentsPath = path.join(process.cwd(), 'components');
    let componentsLessContent = '';
    // Build components in one file: lib/style/components.less
    fs.readdir(componentsPath, (err, files) => {
      files.forEach(file => {
        if (fs.existsSync(path.join(componentsPath, file, 'style', 'index.less'))) {
          componentsLessContent += `@import "../${path.join(file, 'style', 'index.less')}";\n`;
        }
      });
      fs.writeFileSync(
        path.join(process.cwd(), 'lib', 'style', 'components.less'),
        componentsLessContent,
      );
    });
  }
}

function buildThemeFile(theme, vars) {
  // Build less entry file: dist/antd.${theme}.less
  fs.writeFileSync(
    path.join(process.cwd(), 'dist', `antd.${theme}.less`),
    `@import "../lib/style/${theme}.less";\n@import "../lib/style/components.less";`,
  );

  // eslint-disable-next-line no-console
  console.log(`Built a entry less file to dist/antd.${theme}.less`);

  // Build ${theme}.js: dist/${theme}-theme.js, for less-loader

  fs.writeFileSync(
    path.join(process.cwd(), 'dist', `${theme}-theme.js`),
    `module.exports = ${JSON.stringify(vars, null, 2)};`,
  );

  // eslint-disable-next-line no-console
  console.log(`Built a ${theme} theme js file to dist/${theme}-theme.js`);
}

function finalizeDist() {
  if (fs.existsSync(path.join(__dirname, './dist'))) {
    // Build less entry file: dist/antd.less
    fs.writeFileSync(
      path.join(process.cwd(), 'dist', 'antd.less'),
      '@import "../lib/style/index.less";\n@import "../lib/style/components.less";',
    );
    // eslint-disable-next-line no-console
    console.log('Built a entry less file to dist/antd.less');
    buildThemeFile('default', defaultVars);
    buildThemeFile('dark', darkVars);
    buildThemeFile('compact', compactVars);
  }
}

module.exports = {
  compile: {
    finalize: finalizeCompile,
  },
  dist: {
    finalize: finalizeDist,
  },
};
