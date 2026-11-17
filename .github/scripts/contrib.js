// Issue（ラベル db-contrib）を db/data/contrib.json に反映する
const fs = require('fs');
const F = 'db/data/contrib.json';
const KEYS = {'種類':'kind','年度':'year','大会':'district','学校・チーム':'team','試合':'round','内容':'content','出典':'source','出典・どこで見たか':'source'};
function parse(body) {
  const o = {};
  for (const part of (body || '').split(/^### /m).slice(1)) {
    const nl = part.indexOf('\n'); const k = KEYS[part.slice(0, nl).trim()];
    let v = part.slice(nl + 1).trim(); if (v === '_No response_') v = '';
    if (k) o[k] = v.slice(0, 2000);
  }
  return o;
}
const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const is = ev.issue; const labels = (is.labels || []).map(l => l.name);
let list = []; try { list = JSON.parse(fs.readFileSync(F, 'utf8')); } catch (e) {}
list = list.filter(c => c.id !== is.number);
const hide = !labels.includes('db-contrib') || labels.includes('rejected') || (is.state === 'closed' && is.state_reason === 'not_planned');
if (!hide) {
  const p = parse(is.body);
  list.push({id: is.number, ...p, year: parseInt(p.year) || null, author: is.user.login, url: is.html_url,
    created: is.created_at, updated: is.updated_at, status: labels.includes('confirmed') ? 'confirmed' : (is.state === 'closed' ? 'merged' : 'open')});
}
list.sort((a, b) => a.id - b.id);
fs.writeFileSync(F, JSON.stringify(list, null, 1) + '\n');
console.log(hide ? 'removed' : 'upserted', is.number);
