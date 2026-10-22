(async()=>{
const version=chrome.runtime?.getManifest?.().version;
if(version)document.getElementById('app-version').textContent=`ver ${version}`;
const I=globalThis.ColorsI18n;
if(I)await I.ready;
const T=source=>I?I.text(source):source;
I?.bind(document.body);
const language=document.getElementById('language');
if(I){
 document.documentElement.lang=I.locale.replace('_','-');
 try{const value=(await chrome.storage.local.get(I.key))[I.key];language.value=I.languages.includes(value)?value:'auto';}catch{}
 language.addEventListener('change',async()=>{
  language.disabled=true;
  try{await chrome.storage.local.set({[I.key]:language.value});}
  catch{document.getElementById('status').textContent=T('設定を保存できませんでした。');try{const saved=(await chrome.storage.local.get(I.key))[I.key];language.value=I.languages.includes(saved)?saved:'auto';}catch{language.disabled=true;return;}}
  finally{language.disabled=false;}
 });
 I.onChange(value=>{language.value=I.languages.includes(value)?value:'auto';document.documentElement.lang=I.locale.replace('_','-');for(const id of ['status','chat-status']){const e=document.getElementById(id);e.textContent=I.notice(e.textContent);}});
}
const key = "thread-colors:v1:enabled";
const toggle = document.getElementById("enabled");
const individual = document.getElementById("individual");
const message = document.getElementById("status");
const chatMessage = document.getElementById("chat-status");
const isOn=button=>button.getAttribute('aria-checked')==='true';
function showState(button,value){button.setAttribute('aria-checked',String(value));button.textContent=value?'ON':'OFF';}
let globalSaving=false, displayRevision=0;
let target=null, updating=false, checking=false, stopped=false;
let openingTarget, openingDone=false;
async function setDisplay(selected,value){
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(stopped||tab?.id!==selected.tab)throw Error(T('チャットが切り替わりました。'));
  const reply=await chrome.tabs.sendMessage(selected.tab,{type:'chat-colors:set-display',id:selected.id,value});
  if(!reply?.ok)throw Error(reply?.error||T('設定を保存できませんでした。'));
}
async function refresh() {
  if(checking || updating || stopped)return;
  checking=true;
  const revision=displayRevision;
  try {
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(openingTarget===undefined)openingTarget={tab:tab?.id,id:undefined};
    const state=await chrome.tabs.sendMessage(tab.id,{type:'chat-colors:state'});
    if(stopped||revision!==displayRevision)return;
    target=state.id?{tab:tab.id,id:state.id}:null;
    if(!openingDone){
      if(openingTarget.id===undefined)openingTarget.id=state.id;
      if(!target||tab.id!==openingTarget.tab||state.id!==openingTarget.id){
        openingDone=true;
        if(target)message.textContent=T('チャットが切り替わったため、自動で有効にしませんでした。');
      }else if(state.ready){
        openingDone=true; // One attempt per popup, never a retry/toggle on polling.
        if(!state.individual){
          try{await setDisplay(openingTarget,true);state.individual=true;}
          catch(e){message.textContent=I?I.notice(e.message):e.message;}
        }
      }
    }
    showState(individual,state.individual===true);
    individual.disabled=!target||!state.ready;
    chatMessage.textContent=!target?T('新規チャット画面では設定できません。'):!state.ready?T('設定を読み込み中…'):!isOn(toggle)&&state.individual?T('全体OFFのため非表示'):'';
  } catch {if(revision!==displayRevision)return;openingDone=true;target=null;individual.disabled=true;showState(individual,false);chatMessage.textContent=T('保存済みのChatGPTチャットを開いてください。');}
  finally {checking=false;}
}
chrome.storage.local.get(key).then(v=>{showState(toggle,v[key]!==false);toggle.disabled=false;void refresh();})
  .catch(()=>{message.textContent=T('設定を読み込めませんでした。拡張機能を再読み込みしてください。');});
toggle.addEventListener('click',async()=>{
  if(globalSaving||toggle.disabled)return;
  const value=!isOn(toggle);
  globalSaving=true;toggle.disabled=true;toggle.setAttribute('aria-busy','true');
  try {await chrome.storage.local.set({[key]:value});message.textContent='';}
  catch {message.textContent=T('保存できませんでした。もう一度お試しください。');}
  finally {
    try {const saved=await chrome.storage.local.get(key);showState(toggle,saved[key]!==false);toggle.disabled=false;}
    catch {message.textContent=T('保存状態を確認できません。ポップアップを開き直してください。');}
    globalSaving=false;toggle.removeAttribute('aria-busy');void refresh();
  }
});
individual.addEventListener('click',async()=>{
  if(updating||individual.disabled||!target)return;
  displayRevision++;updating=true;individual.disabled=true;individual.setAttribute('aria-busy','true');
  const selected={...target},value=!isOn(individual);
  try {
    await setDisplay(selected,value);
    message.textContent='';
  } catch(e){message.textContent=I?I.notice(e.message):e.message;}
  finally {updating=false;individual.removeAttribute('aria-busy');void refresh();}
});
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local')return;
  if(changes[key])showState(toggle,changes[key].newValue!==false);
  void refresh();
});
const timer=setInterval(refresh,600);
window.addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);});

})();
