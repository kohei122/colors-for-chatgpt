/* Read-only, works even with the extension disabled. 3s preparation + 8s capture.
   No text, title, value, URL, attribution, storage, clicks or network collection. */
(() => {
  'use strict';
  window.__ctcFocusStop?.();
  const result=window.__ctcFocusDiagnostic={schema:1,status:'preparing',preparationMs:3000,observationMs:8000,
    pointer:null,focus:null,nextFrameMs:null,events:[],longTasks:[],cleanup:false};
  const path=location.pathname,selector='#prompt-textarea,main textarea,main [contenteditable="true"][role="textbox"]';
  let prepare,end,frame,started=0,focusAt=0,stopped=false;
  const observers=[];
  const rounded=n=>Math.round(n*10)/10;
  const isInput=node=>node instanceof Element&&Boolean(node.closest(selector));
  function valid(){
    if(stopped)return false;
    if(location.pathname!==path){stop('navigation');return false;}
    if(started&&performance.now()-started>=8000){stop();return false;}
    return true;
  }
  function pointer(e){
    if(!valid()||result.pointer||!isInput(e.target))return;
    const now=performance.now(),delay=now-e.timeStamp;
    result.pointer={atMs:rounded(now-started),dispatchDelayMs:delay>=0&&delay<60000?rounded(delay):null};
  }
  function focus(e){
    if(!valid()||result.focus||!isInput(e.target))return;
    focusAt=performance.now();result.focus={atMs:rounded(focusAt-started)};
    frame=requestAnimationFrame(()=>{
      if(valid())result.nextFrameMs=rounded(performance.now()-focusAt);
    });
  }
  function pagehide(){stop('pagehide');}
  function stop(reason='complete'){
    if(stopped)return;
    stopped=true;clearTimeout(prepare);clearTimeout(end);cancelAnimationFrame(frame);
    for(const observer of observers)observer.disconnect();
    document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('focusin',focus,true);
    window.removeEventListener('pagehide',pagehide);
    result.status=reason;result.cleanup=true;
    result.elapsedMs=started?rounded(performance.now()-started):0;
    if(window.__ctcFocusStop===stopHandle)delete window.__ctcFocusStop;
  }
  window.__ctcFocusStop=()=>stop('cancelled');
  const stopHandle=window.__ctcFocusStop;
  // No observer is armed during preparation.
  prepare=setTimeout(()=>{
    if(!valid())return;
    try {
    started=performance.now();result.status='observing';
    const host=document.getElementById('marusin-thread-colors');
    result.extensionPresent=!!host;
    result.bandVisible=!!host&&getComputedStyle(host).display!=='none';
    result.layoutActive=document.documentElement.hasAttribute('data-thread-colors-active');
    result.viewport={width:innerWidth,height:innerHeight};
    result.supported={};
    for(const type of ['longtask','event']){
      result.supported[type]=PerformanceObserver.supportedEntryTypes.includes(type);
      if(!result.supported[type])continue;
      const observer=new PerformanceObserver(list=>{
        if(!valid())return;
        for(const entry of list.getEntries()){
          if(entry.startTime<started)continue;
          if(type==='longtask'&&result.longTasks.length<20)
            result.longTasks.push({atMs:rounded(entry.startTime-started),durationMs:rounded(entry.duration)});
          if(type==='event'&&result.events.length<12&&isInput(entry.target)&&
            ['pointerdown','mousedown','pointerup','mouseup','click'].includes(entry.name))
            result.events.push({type:entry.name,durationMs:rounded(entry.duration),
              dispatchDelayMs:rounded(entry.processingStart-entry.startTime),handlerMs:rounded(entry.processingEnd-entry.processingStart)});
        }
      });
      observers.push(observer);
      observer.observe(type==='event'?{type,durationThreshold:16}:{type});
    }
    document.addEventListener('pointerdown',pointer,true);document.addEventListener('focusin',focus,true);
    end=setTimeout(()=>stop(location.pathname===path?'complete':'navigation'),8000);
    } catch {stop('read-error');}
  },3000);
  window.addEventListener('pagehide',pagehide);
  return '3秒後から8秒間測定します。4秒ほど待って本文入力欄を一度クリックし、12秒後に結果をコピーしてください。';
})();
