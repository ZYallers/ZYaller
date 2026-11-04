/**
 * 构建脚本：扫描 tag/ 下所有分类目录的 .md 文章，
 * 解析元信息并打包生成 site/assets/data.js
 * 运行：node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TAG_DIR = path.join(ROOT, 'tag');
const OUT = path.join(ROOT, 'assets', 'data.js');

// 分类目录名 -> 展示名
const CATEGORY_LABELS = {
  api: '接口',
  app: '应用',
  git: 'Git',
  golang: 'Golang',
  javascript: 'JavaScript',
  linux: 'Linux',
  php: 'PHP',
  redis: 'Redis',
  computer: '计算机',
  database: '数据库',
  web: '互联网',
  safety: '安全'
};

// 封面缺省时的渐变色板
const GRADIENTS = [
  ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'], ['#ff9a9e', '#fecfef'], ['#fbc2eb', '#a6c1ee'],
  ['#fdcbf1', '#e6dee9'], ['#667eea', '#f093fb'], ['#0ba360', '#3cba92'],
];

// 扫描图片目录，返回相对仓库根目录的路径列表
function scanImages(dirName) {
  const dir = path.join(ROOT, 'static', dirName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort()
    .map(f => `static/${dirName}/${f}`);
}
const BACKGROUNDS = scanImages('background');
const SECTIONS = scanImages('section');

function stripMd(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_\-\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArticle(catKey, fileName) {
  const filePath = path.join(TAG_DIR, catKey, fileName);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split('\n');

  // 首行元信息: [//]:# (2021/7/15 11:33|GOLANG|https://...)
  let date = null, cover = null;
  const metaMatch = lines[0] && lines[0].match(/^\[\/\/\]:#\s*\(([^)]*)\)/);
  let bodyLines = lines;
  if (metaMatch) {
    const parts = metaMatch[1].split('|').map(s => s.trim());
    if (parts[0]) date = parts[0];
    if (parts[2]) cover = parts[2];
    bodyLines = lines.slice(1);
  }

  const body = bodyLines.join('\n');
  // 标题：第一个 # 标题，否则用文件名
  let title = null;
  const titleMatch = body.match(/^#\s+(.+)$/m);
  if (titleMatch) title = titleMatch[1].trim();
  if (!title) title = fileName.replace(/\.md$/, '');

  // 去掉正文首行的 # 标题（页面已单独渲染标题，避免重复）
  const content = titleMatch ? body.replace(/^#\s+.*(\r?\n)?/m, '').trim() : body.trim();

  // 作者：标题后紧跟的 > [name](url)
  let author = null, authorUrl = null;
  const authorMatch = body.match(/^>\s*\[([^\]]+)\]\(([^)]+)\)/m);
  if (authorMatch) { author = authorMatch[1].trim(); authorUrl = authorMatch[2].trim(); }

  const plain = stripMd(content.replace(/^>\s*\[[^\]]+\]\([^)]+\)\s*$/m, ''));
  return {
    id: `${catKey}/${fileName.replace(/\.md$/, '')}`,
    cat: catKey,
    catLabel: CATEGORY_LABELS[catKey] || catKey,
    file: fileName.replace(/\.md$/, ''),
    title,
    date,
    cover,
    author,
    authorUrl,
    excerpt: plain.slice(0, 120),
    content,
  };
}

const categories = [];
const articles = [];

const dirs = fs.readdirSync(TAG_DIR).filter(d =>
  fs.statSync(path.join(TAG_DIR, d)).isDirectory()
).sort((a, b) => a.localeCompare(b));

for (const dir of dirs) {
  const files = fs.readdirSync(path.join(TAG_DIR, dir)).filter(f => f.endsWith('.md'));
  if (!files.length) continue;
  categories.push({ key: dir, label: CATEGORY_LABELS[dir] || dir, count: files.length });
  for (const f of files) {
    try {
      articles.push(parseArticle(dir, f));
    } catch (e) {
      console.error(`跳过解析失败的文章: ${dir}/${f}: ${e.message}`);
    }
  }
}

// 按日期倒序（无日期的排后面）
articles.sort((a, b) => {
  if (a.date && b.date) return b.date.localeCompare(a.date);
  if (a.date) return -1;
  if (b.date) return 1;
  return 0;
});

const payload = JSON.stringify({
  categories, articles, gradients: GRADIENTS,
  backgrounds: BACKGROUNDS, sections: SECTIONS,
});
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `window.BLOG_DATA=${payload};`, 'utf8');

console.log(`✅ 构建完成: ${categories.length} 个分类, ${articles.length} 篇文章`);
console.log(`   背景图 ${BACKGROUNDS.length} 张, 占位图 ${SECTIONS.length} 张`);
console.log(`   输出: ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
