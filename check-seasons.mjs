import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readAppearance,seasonPhotos} from './lib/ambience.ts';
assert.equal(readAppearance({season:'winter',period:'夜晚',effects:false}).effects,false);
assert.equal(readAppearance({season:'winter',period:'夜晚'}).effects,true);
assert.equal(new Set(Object.values(seasonPhotos)).size,4);
for(const path of Object.values(seasonPhotos))assert.ok(fs.statSync('public'+path).size>1000);
const page=fs.readFileSync('app/page.tsx','utf8'),native=fs.readFileSync('mobile/android/MainActivity.java','utf8');
assert.ok(!page.includes('{phase}'));
assert.ok(page.includes('className="message-time"')&&page.includes('second:"2-digit"'));
assert.ok(page.includes('tab!=="chat"&&<header'));
assert.ok(native.includes('c.show(android.view.WindowInsets.Type.systemBars())'));
assert.ok(native.includes('onWindowFocusChanged'));
assert.ok(fs.readFileSync('components/connections.tsx','utf8').includes('connections.apply(connections.model,next);setW(next)'));
console.log('PASS: four distinct packaged photos, animation setting migration, full timestamps, single context-aware header, location persistence, visible system bars');

assert.ok(native.includes('lp.setMargins(bars.left,bars.top,bars.right,bars.bottom)'));
assert.ok(!native.includes('c.hide(')&&!native.includes('web.setPadding('));
