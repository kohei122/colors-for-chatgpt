const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core');
test('standard, project, and GPT conversation URLs share an ID', () => {
  assert.equal(C.threadId('https://chatgpt.com/c/abc-123'), 'abc-123');
  assert.equal(C.threadId('https://chatgpt.com/g/g-p-project-name/c/abc-123?x=1#y'), 'abc-123');
  assert.equal(C.threadId('https://chatgpt.com/g/g-custom/c/abc-123/'), 'abc-123');
});
test('unsaved, shared, unsupported and off-origin routes never get a conversation key', () => {
  for (const u of ['/', '/g/g-project', '/share/abc', '/codex', '/c/', '/c/a/extra', 'https://example.com/c/a']) assert.equal(C.threadId(u), null, u);
});
test('automatic color is stable and comes from the preset palette', () => {
  assert.equal(C.defaultColor('abc'), C.defaultColor('abc'));
  assert.ok(C.palette.includes(C.defaultColor('abc')));
  assert.ok(new Set(Array.from({length:64}, (_, i) => C.defaultColor('thread-' + i))).size > 4);
});
test('stored settings are validated before reaching CSS', () => {
  const v = C.settings({color:'url(https://example.com)',height:NaN,fontSize:999,border:-1}, 'a');
  assert.equal(v.color, C.defaultColor('a')); assert.equal(v.height,56); assert.equal(v.fontSize,36); assert.equal(v.border,0);
  assert.equal(C.settings({color:'#AbC123'},'a').color,'#abc123');
  assert.equal(C.settings(null,'a').border,6);
});
test('automatic text contrast covers black, white, and preset colors', () => {
  assert.equal(C.foreground('#000000'),'#ffffff'); assert.equal(C.foreground('#ffffff'),'#000000');
  function luminance(h) {const v=h.slice(1).match(/../g).map(x=>{const s=parseInt(x,16)/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];}
  for (const h of C.palette) {const l=luminance(h);const contrast=C.foreground(h)==='#000000'?(l+.05)/.05:1.05/(l+.05); assert.ok(contrast>=4.5);}
});
test('generic and branded document titles are normalized', () => {
  assert.equal(C.pageTitle('BOMmaker - ChatGPT'),'BOMmaker');
  assert.equal(C.pageTitle('ChatGPT'),'');assert.equal(C.pageTitle('新しいチャット'),'');
});
test('manifest confines injection to ChatGPT and requests storage only', () => {
  const m=require('../manifest.json');assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage']);
  assert.deepEqual(m.content_scripts[0].matches,['https://chatgpt.com/*']);assert.equal(m.content_scripts[0].all_frames,false);
  assert.equal(m.background,undefined);assert.equal(m.host_permissions,undefined);
});
const samples = ['#000000','#ffffff','#777777','#111111','#eeeeee','#ff0000','#00ff00','#0000ff','#ffff00','#00ffff','#ff00ff','#ffdddd','#ddffee', ...C.palette];
test('vivid colors are deterministic, chromatic and meet contrast on neutral, vivid and pale backgrounds', () => {
  for (const bg of samples) {
    const fg=C.vividForeground(bg);
    assert.equal(fg,C.vividForeground(bg)); assert.ok(C.contrast(bg,fg)>=4.5,`${bg} ${fg}`);
    const rgb=fg.slice(1).match(/../g).map(x=>parseInt(x,16));
    assert.ok(Math.max(...rgb)-Math.min(...rgb)>=30);
  }
  for(let i=0;i<4096;i++) {
    const bg='#'+(i*4097).toString(16).padStart(6,'0');
    assert.ok(C.contrast(bg,C.vividForeground(bg))>=4.5,bg);
  }
});
test('legacy settings preserve all old fields and validate new fields strictly', () => {
  const old={color:'#123456',height:74,fontSize:32,border:10};
  assert.deepEqual(C.settings(old,'a'),{...old,textMode:'auto',textColor:'#ffffff',alignment:'left'});
  for(const v of [null,[],true,42,{},'invalid']) {
    const cfg=C.settings({textMode:v,textColor:v,alignment:v},'a');
    assert.equal(cfg.textMode,'auto');assert.equal(cfg.textColor,'#ffffff');assert.equal(cfg.alignment,'left');
  }
  assert.equal(C.settings({textColor:'#AbCdEf'},'a').textColor,'#abcdef');
});
test('text mode chooses automatic, recalculated vivid or unchanged custom foreground', () => {
  for(const color of samples) {
    assert.equal(C.textForeground({color,textMode:'auto'}),C.foreground(color));
    assert.equal(C.textForeground({color,textMode:'vivid'}),C.vividForeground(color));
    assert.equal(C.textForeground({color,textMode:'custom',textColor:'#123456'}),'#123456');
  }
});
