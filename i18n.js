/* Bundled dictionaries only. Native ChatGPT selectors never use this API. */
(()=>{
 'use strict';
 const dictionaries=globalThis.ColorsMessages;
 const languages=['en','ja','ko','zh_CN','zh_TW','es','pt_BR'];
 const key='thread-colors:v1:language';
 const automatic=()=>{const code=globalThis.chrome?.i18n?.getMessage('localeCode');return languages.includes(code)?code:'en';};
 let locale=automatic(),revision=0;
 const callbacks=new Set();
 const sourceKeys=new Map(Object.entries(dictionaries.ja).map(([k,v])=>[v.message,k]));
 function text(source){const k=sourceKeys.get(source);return k?(dictionaries[locale][k]?.message||dictionaries.en[k]?.message||source):source;}
 const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const allSources=new Map();
 for(const messages of Object.values(dictionaries))for(const [k,v] of Object.entries(messages))allSources.set(v.message,k);
 const fragments=new RegExp([...allSources.keys()].sort((a,b)=>b.length-a.length).map(escaped).join('|'),'g');
 // Only extension notices are passed here. Never process a chat name/input value.
 const notice=s=>s.replace(fragments,m=>dictionaries[locale][allSources.get(m)]?.message||m);
 function select(value){locale=languages.includes(value)?value:automatic();for(const fn of callbacks)fn(value);}
 const ready=globalThis.chrome?.storage?.local.get(key).then(v=>{if(!revision)select(v[key]);}).catch(()=>{})||Promise.resolve();
 globalThis.chrome?.storage?.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[key]){revision++;select(changes[key].newValue);}});
 function bind(root){
  const records=[];
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let n;
  while(n=walk.nextNode()){
   const node=n;
   if(n.nodeType===3){const raw=n.nodeValue,trim=raw.trim();if(sourceKeys.has(trim))records.push(()=>{node.nodeValue=raw.replace(trim,text(trim));});}
   else for(const attr of ['aria-label','title','placeholder'])if(sourceKeys.has(n.getAttribute(attr))){const source=n.getAttribute(attr);records.push(()=>node.setAttribute(attr,text(source)));}
  }
  const update=()=>records.forEach(fn=>fn());update();callbacks.add(update);return ()=>callbacks.delete(update);
 }
 globalThis.ColorsI18n={text,notice,bind,ready,languages,key,get locale(){return locale;},onChange:fn=>callbacks.add(fn)};
})();
