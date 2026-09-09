/* 전자카달로그 공개 뷰어 — 바깥 배경 + 축소 카달로그 + 우상단 재생/BGM + 바깥 하단 현재/전체·동그라미 페이지. */
(function () {
  'use strict';
  var boot = JSON.parse(document.getElementById('cv-boot').textContent);
  var slides = boot.slides && boot.slides.length ? boot.slides : [{bg:'#fff',elements:[]}];
  var idx = 0, playing = false, timer = null, bgmOn = false;
  var AUTO_MS = 4000;
  // SVG 아이콘(이모지 배경 문제 회피, 크로스플랫폼 일관)
  var SVG_PLAY='<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z"/></svg>';
  var SVG_PAUSE='<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';
  var SVG_EXPAND='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em" aria-hidden="true"><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/></svg>';
  var SVG_COMPRESS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em" aria-hidden="true"><path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20"/></svg>';
  var SVG_SOUND='<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 8.5a5 5 0 0 1 0 7M18.7 6a8 8 0 0 1 0 12"/></svg>';
  var SVG_MUTE='<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>';
  function asp(){ var p=(boot.aspect||'16:9').split(':'); return (+p[0]||16)/(+p[1]||9); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function cItem(x){ return (x&&typeof x==='object')?{u:x.u||'',label:x.label||''}:{u:x||'',label:''}; }
  function vcorners(e){ function v(x){return (x==null?0:x);} return v(e.rtl)+'px '+v(e.rtr)+'px '+v(e.rbr)+'px '+v(e.rbl)+'px'; }
  // 캐러셀 래퍼: 네비/라벨/페이지네이션을 이미지 바깥(측면·하단)에 배치 → 상장에 안 겹침
  function crWrapHtml(e){
    var ims=e.images||[];
    var showLabel=(e.labelMode||'show')!=='none';
    var showPager=(e.pager==null)?true:!!e.pager;
    var np=e.navPos||'mid'; var hasNav=(e.effect!=='fade' && np!=='none');
    var slides=ims.map(function(it){ var o=cItem(it); return '<div class="swiper-slide" data-cap="'+esc(o.label)+'"><img src="'+esc(o.u)+'"></div>'; }).join('');
    var swiper='<div class="swiper el-swiper" data-eff="'+(e.effect||'coverflow')+'" data-loop="'+(e.loop?1:0)+'" data-autoplay="'+(e.autoplay?1:0)+'" data-space="'+(e.space==null?12:e.space)+'" data-dim="'+(e.dim?1:0)+'" data-fit="'+(e.imgFit||'fit')+'" data-perview="'+(e.perView||2)+'"><div class="swiper-wrapper">'+slides+'</div></div>';
    var prev=hasNav?'<button class="cr-nav cr-prev" type="button" aria-label="이전"></button>':'';
    var next=hasNav?'<button class="cr-nav cr-next" type="button" aria-label="다음"></button>':'';
    var stage='<div class="cr-stage">'+((hasNav&&np==='mid')?prev:'')+swiper+((hasNav&&np==='mid')?next:'')+'</div>';
    var head=(hasNav&&np==='top')?'<div class="cr-bar cr-head">'+prev+next+'</div>':'';
    var cap=showLabel?'<div class="cr-capbar"></div>':'';
    var pager=showPager?'<div class="swiper-pagination"></div>':'';
    var foot='';
    if(hasNav&&np==='bottom') foot='<div class="cr-foot">'+cap+'<div class="cr-bar">'+prev+pager+next+'</div></div>';
    else if(cap||pager) foot='<div class="cr-foot">'+cap+pager+'</div>';
    return '<div class="cr-wrap" data-navpos="'+np+'" style="--navbg:'+esc(e.navBg||'#1a1a1a')+';--navcolor:'+esc(e.navColor||'#ffffff')+'">'+head+stage+foot+'</div>';
  }
  function vboxBg(e){ if(e.fillType!=='gradient') return (e.color1||'#3b82f6');
    var end=(e.gradEnd==='transparent')?vhexA(e.color1||'#3b82f6',0):(e.color2||'#8b5cf6');
    var mid=e.grad3?(','+(e.color3||'#22d3ee')):'';
    return 'linear-gradient('+(e.gradAngle==null?135:e.gradAngle)+'deg,'+(e.color1||'#3b82f6')+mid+','+end+')'; }
  function vhexA(hex,a){ hex=(hex||'#000000').replace('#',''); if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; var r=parseInt(hex.substr(0,2),16)||0,g=parseInt(hex.substr(2,2),16)||0,b=parseInt(hex.substr(4,2),16)||0; return 'rgba('+r+','+g+','+b+','+a+')'; }
  function vshadow(e){ return e.shadow?('box-shadow:0 '+Math.round((e.shadowBlur||24)/3)+'px '+(e.shadowBlur||24)+'px '+vhexA(e.shadowColor||'#000000',.4)+';'):''; }
  function vtextFill(e){ if(e.textFill!=='gradient') return 'color:'+(e.color||'#111')+';';
    var mid=e.tgrad3?(','+(e.gc3||'#22d3ee')):'';
    return 'background:linear-gradient('+(e.gAngle==null?90:e.gAngle)+'deg,'+(e.gc1||'#ff5a5a')+mid+','+(e.gc2||'#5a7bff')+');-webkit-background-clip:text;background-clip:text;color:transparent;'; }

  // 메일폼(문의)
  var FORM_ORDER=['name','company','phone','email','message'];
  var FORM_DEF={ name:{label:'이름',ph:'이름'}, company:{label:'회사명',ph:'회사명'}, phone:{label:'전화번호',ph:'010-0000-0000'}, email:{label:'이메일',ph:'you@example.com'}, message:{label:'내용',ph:'문의 내용을 입력하세요'} };
  function formHtml(e){
    var flds=e.fields||{};
    var rows=FORM_ORDER.map(function(k){
      var f=flds[k]||{}; if(f.on===0) return '';
      var d=FORM_DEF[k]; var lab=(f.label!=null?f.label:d.label); var ph=(f.ph!=null?f.ph:d.ph);
      var star=f.req?'<span class="ef-req">*</span>':'';
      var ctl=(k==='message')
        ? '<textarea class="ef-inp" name="'+k+'" rows="3" placeholder="'+esc(ph)+'"'+(f.req?' required':'')+'></textarea>'
        : '<input class="ef-inp" name="'+k+'" type="'+(k==='email'?'email':k==='phone'?'tel':'text')+'" placeholder="'+esc(ph)+'"'+(f.req?' required':'')+'>';
      return '<label class="ef-row"><span class="ef-lab">'+esc(lab)+star+'</span>'+ctl+'</label>';
    }).join('');
    var panelSt='background:'+(e.bg||'#ffffff')+';border-radius:'+(e.radius==null?12:e.radius)+'px;--eflab:'+(e.labelColor||'#333333')+';';
    var title=e.title?'<div class="ef-title">'+esc(e.title)+'</div>':'';
    var hp='<input type="text" name="website" class="ef-hp" tabindex="-1" autocomplete="off" aria-hidden="true">';
    return '<form class="el-form" style="'+panelSt+'">'+title+rows+hp+'<button type="submit" class="ef-btn" style="background:'+(e.btnBg||'#1a1a1a')+';color:'+(e.btnColor||'#ffffff')+'">'+esc(e.btnText||'보내기')+'</button><div class="ef-msg" role="status"></div></form>';
  }
  function fieldHtml(e){
    var d=FORM_DEF[e.fk]||{label:'입력',ph:''};
    var lab=(e.label!=null?e.label:d.label), ph=(e.ph!=null?e.ph:d.ph);
    var inpBg=(e.bg==='transparent')?'transparent':(e.bg||'#ffffff');
    var st='font-family:'+(e.family?("'"+e.family+"',sans-serif"):'inherit')+';color:'+(e.color||'#333333')+';font-size:'+(e.size||2.2)+'cqw;';
    var labHtml=(e.labelShow!==0)?'<div class="ef-lab" style="color:'+(e.labelColor||e.color||'#333333')+'">'+esc(lab)+(e.req?' <span class="ef-req">*</span>':'')+'</div>':'';
    var inpSt='background:'+inpBg+';border-radius:'+(e.radius==null?8:e.radius)+'px';
    var inp=(e.fk==='message')
      ? '<textarea class="ef-inp" name="'+esc(e.fk)+'" placeholder="'+esc(ph)+'"'+(e.req?' required':'')+' style="'+inpSt+'"></textarea>'
      : '<input class="ef-inp" name="'+esc(e.fk)+'" type="'+(e.fk==='email'?'email':e.fk==='phone'?'tel':'text')+'" placeholder="'+esc(ph)+'"'+(e.req?' required':'')+' style="'+inpSt+'">';
    return '<div class="el-field" style="'+st+'">'+labHtml+inp+'</div>';
  }
  function submitHtml(e){
    var bg=(e.bg==='transparent')?'transparent':(e.bg||'#1a1a1a');
    var st='background:'+bg+';color:'+(e.color||'#ffffff')+';font-size:'+(e.size||2.4)+'cqw;border-radius:'+(e.radius==null?8:e.radius)+'px;font-family:'+(e.family?("'"+e.family+"',sans-serif"):'inherit')+';'+((e.bg==='transparent')?'border:1.5px solid '+(e.color||'#1a1a1a')+';':'');
    return '<button class="el-submit" type="button" style="'+st+'">'+esc(e.text||'보내기')+'</button><input class="ef-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">';
  }
  function elHtml(e){
    var pos='left:'+e.x+'%;top:'+e.y+'%;width:'+e.w+'%;height:'+e.h+'%;z-index:'+(e.z||1)+';';
    var aos=e.aos?(' aos '+e.aos):'';
    var inner='';
    if(e.type==='text'){
      var st='font-size:'+(e.size||3)+'cqw;'+vtextFill(e)+'text-align:'+(e.align||'left')+';'+
             'font-weight:'+(e.fw||(e.weight?700:400))+';'+(e.italic?'font-style:italic;':'')+(e.family?'font-family:\''+e.family+'\',sans-serif;':'')+
             (e.ls?'letter-spacing:'+e.ls+'em;':'')+'line-height:'+(e.lh==null?1.25:e.lh)+';'+(e.rot?'transform:rotate('+e.rot+'deg);':'')+'opacity:'+(e.opacity==null?1:e.opacity)+';';
      inner='<div class="el-text" style="'+st+'">'+(e.html||'')+'</div>';
    } else if(e.type==='box'){
      inner='<div class="el-box" style="background:'+vboxBg(e)+';border-radius:'+(e.radius||0)+'px;opacity:'+(e.opacity==null?1:e.opacity)+';'+(e.rot?'transform:rotate('+e.rot+'deg);':'')+vshadow(e)+'"></div>';
    } else if(e.type==='image' && e.src){
      inner='<img class="el-img" src="'+esc(e.src)+'" style="object-fit:'+(e.fit||'contain')+';border-radius:'+(e.radius||0)+'px;opacity:'+(e.opacity==null?1:e.opacity)+';filter:'+(e.blur?('blur('+e.blur+'px)'):'none')+';'+vshadow(e)+'" alt="">';
    } else if(e.type==='video' && e.src){
      inner='<video class="el-video" src="'+esc(e.src)+'" '+(e.muted?'muted':'')+' '+(e.loop?'loop':'')+' autoplay playsinline style="object-fit:'+(e.fit||'cover')+';border-radius:'+vcorners(e)+'"></video>';
    } else if(e.type==='carousel'){
      inner=crWrapHtml(e);
    } else if(e.type==='line'){
      inner='<div class="el-line" style="border-top:'+(e.thick||3)+'px '+(e.lineStyle||'solid')+' '+(e.color||'#1a1a1a')+';opacity:'+(e.opacity==null?1:e.opacity)+';transform:translateY(-50%) rotate('+(e.rot||0)+'deg)"></div>';
    } else if(e.type==='form'){
      inner=formHtml(e);
    } else if(e.type==='field'){
      inner=fieldHtml(e);
    } else if(e.type==='submit'){
      inner=submitHtml(e);
    } else if(e.type==='tab'){
      function rv(x){return x==null?8:x;}
      var trad=rv(e.rtl)+'px '+rv(e.rtr)+'px '+rv(e.rbr)+'px '+rv(e.rbl)+'px';
      inner='<div class="el-tab" style="background:'+(e.bg||'#1a1a1a')+';color:'+(e.color||'#fff')+';font-size:'+(e.size||2.2)+'cqw;border-radius:'+trad+(e.vertical?';writing-mode:vertical-rl':'')+'">'+esc(e.label||'')+'</div>';
    }
    var hv=(e.hover&&e.hover!=='none')?(' hv-'+e.hover):'';
    var hstyle=(e.hover==='color')?(';--hbg:'+(e.hoverBg||'#ffffff')+';--hcolor:'+(e.hoverColor||'#000000')):'';
    var cls='cv-el'+aos+hv+(e.type==='tab'?' tab-el':'')+(e.type==='line'?' cv-line':'');
    var data='';
    if(e.aos){ data+=' data-aos-order="'+(e.aosOrder||0)+'" data-aos-delay="'+(e.aosDelay||0)+'"'; }
    if(e.type==='tab'){ data+=(e.linkType==='url'&&e.href)?(' data-href="'+esc(e.href)+'"'):(' data-target="'+(e.target||0)+'"'); }
    if(e.type==='form'){ data+=' data-eid="'+esc(e.id||'')+'"'; }
    if(e.type==='field'){ data+=' data-eid="'+esc(e.id||'')+'" data-field="1" data-fk="'+esc(e.fk||'')+'"'; }
    if(e.type==='submit'){ data+=' data-eid="'+esc(e.id||'')+'" data-submit="1"'; }
    return '<div class="'+cls+'" style="'+pos+hstyle+'"'+data+'>'+inner+'</div>';
  }

  var root=document.getElementById('cv');
  root.style.setProperty('--pt', boot.point || '#1a1a1a');
  // 바깥 영역 배경: 색은 #cv, 이미지는 별도 레이어(투명도·블러 적용 — 카달로그엔 영향 없음)
  if(boot.outerBg){ root.style.background=boot.outerBg; }
  var bgLayerHtml='';
  if(boot.outerImg){
    var op=(boot.outerOpacity==null?1:boot.outerOpacity), bl=boot.outerBlur||0;
    bgLayerHtml='<div class="cv-bg" style="background-image:url(\''+esc(boot.outerImg)+'\');opacity:'+op+';filter:'+(bl?('blur('+bl+'px)'):'none')+'"></div>';
  }

  var slidesHtml=slides.map(function(s){
    return '<div class="cv-slide" style="background:'+(s.bg||'#ffffff')+'">'+
      (s.elements||[]).slice().sort(function(a,b){return (a.z||1)-(b.z||1);}).map(elHtml).join('')+'</div>';
  }).join('');
  var dotsHtml=slides.map(function(_,i){ return '<button class="cv-dot" data-i="'+i+'" aria-label="'+(i+1)+'페이지"></button>'; }).join('');

  function flagImg(l,cls){ return l.cc?('<img class="'+cls+'" src="https://flagcdn.com/w80/'+esc(l.cc)+'.png" srcset="https://flagcdn.com/w160/'+esc(l.cc)+'.png 2x" alt="'+esc(l.name)+'">'):('<span class="'+cls+'">'+esc(l.flag||'')+'</span>'); }
  var langsHtml='';
  if(boot.langs && boot.langs.length>1){
    var curL=boot.langs.filter(function(l){return l.lang===boot.curLang;})[0]||boot.langs[0];
    var items=boot.langs.map(function(l){
      return '<button class="cv-lang'+(l.lang===boot.curLang?' on':'')+'" data-token="'+esc(l.token)+'" title="'+esc(l.name)+'" aria-label="'+esc(l.name)+'">'+flagImg(l,'cv-flag-img')+'</button>';
    }).join('');
    // 드롭다운: 현재 국기 + 아래화살표 → 클릭(또는 PC 호버)하면 국기 목록
    langsHtml='<div class="cv-langs" id="cvLangs"><button class="cv-lang-trig" id="cvLangTrig" aria-label="언어 선택">'+flagImg(curL,'cv-flag-img cv-flag-cur')+'<span class="cv-lang-arr" aria-hidden="true">▾</span></button><div class="cv-lang-menu">'+items+'</div></div>';
  }
  root.innerHTML=
    bgLayerHtml+langsHtml+
    '<div class="cv-top">'+
      (boot.bgmYt?'<button class="cv-cbtn cv-bgm" id="cvBgm" aria-label="배경음악">'+SVG_MUTE+'</button>':'')+
      '<button class="cv-cbtn cv-play" id="cvPlay" aria-label="재생">'+SVG_PLAY+'</button>'+
      '<button class="cv-cbtn cv-full" id="cvFull" aria-label="전체보기" title="전체보기">'+SVG_EXPAND+'</button>'+
    '</div>'+
    '<div class="cv-mid">'+
      '<button class="cv-nav cv-prev" id="cvPrev" aria-label="이전"><svg viewBox="0 0 320 512" aria-hidden="true"><path fill="currentColor" d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg></button>'+
      '<div class="cv-stage-wrap"><div class="cv-stage" id="cvStage" style="aspect-ratio:'+asp()+';border-radius:'+(boot.radius==null?10:boot.radius)+'px">'+slidesHtml+'</div></div>'+
      '<button class="cv-nav cv-next" id="cvNext" aria-label="다음"><svg viewBox="0 0 320 512" aria-hidden="true"><path fill="currentColor" d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/></svg></button>'+
    '</div>'+
    '<div class="cv-bottom">'+
      '<div class="cv-ind" id="cvInd"></div>'+
      '<div class="cv-dots" id="cvDots">'+dotsHtml+'</div>'+
    '</div>'+
    (boot.bgmYt?'<div id="cvYt" class="cv-yt"></div>':'')+
    '<div class="cv-rotate"><div class="ic">📱</div><div>휴대폰을 가로로 돌려서 보세요</div></div>';

  root.querySelectorAll('.cv-lang').forEach(function(b){ b.addEventListener('click',function(){ var t=b.dataset.token; if(t) window.location.href='view.html?id='+encodeURIComponent(t); }); });
  var langTrig=document.getElementById('cvLangTrig'), langsBox=document.getElementById('cvLangs');
  if(langTrig&&langsBox){ langTrig.addEventListener('click',function(ev){ ev.stopPropagation(); langsBox.classList.toggle('open'); });
    document.addEventListener('click',function(){ langsBox.classList.remove('open'); }); }

  // 전체보기(풀스크린) — 카달로그 영역을 화면 꽉차게(비율 유지)
  var fullBtn=document.getElementById('cvFull');
  if(fullBtn) fullBtn.addEventListener('click',function(){
    var el=root, rq=el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen;
    var ex=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen;
    var fs=document.fullscreenElement||document.webkitFullscreenElement;
    try{ if(!fs){ rq&&rq.call(el); } else { ex&&ex.call(document); } }catch(e){}
  });
  document.addEventListener('fullscreenchange',function(){ var on=!!(document.fullscreenElement||document.webkitFullscreenElement); root.classList.toggle('cv-fs',on); if(fullBtn) fullBtn.innerHTML=on?SVG_COMPRESS:SVG_EXPAND; });

  // 모바일: 클래스 부여 + 가로모드 뷰포트 1000px로 고정(데스크톱형 레이아웃)
  var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  if(isMobile) root.classList.add('cv-mobile');
  function setVP(){ var vp=document.querySelector('meta[name="viewport"]'); if(!vp||!isMobile) return;
    if(matchMedia('(orientation:landscape)').matches) vp.setAttribute('content','width=1000, viewport-fit=cover');
    else vp.setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover'); }
  setVP(); window.addEventListener('orientationchange',function(){ setTimeout(setVP,200); });

  var stage=document.getElementById('cvStage');
  var slideEls=stage.querySelectorAll('.cv-slide');
  var prev=document.getElementById('cvPrev'), next=document.getElementById('cvNext');
  var playBtn=document.getElementById('cvPlay'), bgmBtn=document.getElementById('cvBgm');
  var indEl=document.getElementById('cvInd');
  var dotEls=root.querySelectorAll('.cv-dot');

  function show(n){
    idx=Math.max(0,Math.min(slides.length-1,n));
    slideEls.forEach(function(el,i){
      el.classList.toggle('on',i===idx);
      el.querySelectorAll('video').forEach(function(v){ if(i===idx){ v.play&&v.play().catch(function(){}); } else { v.pause&&v.pause(); } });
      el.querySelectorAll('.aos').forEach(function(a){ a.classList.remove('play'); });
    });
    var on=slideEls[idx];
    setTimeout(function(){
      // 순서(order) 오름차순 정렬(동순위는 DOM=z순서 유지) → 각 요소는 자기 딜레이(ms), 딜레이 0이면 순서대로 90ms 간격
      var arr=Array.prototype.slice.call(on.querySelectorAll('.aos'));
      arr.map(function(a,i){ return {a:a, order:parseInt(a.getAttribute('data-aos-order'))||0, delay:parseInt(a.getAttribute('data-aos-delay'))||0, i:i}; })
         .sort(function(x,y){ return (x.order-y.order)||(x.i-y.i); })
         .forEach(function(o,rank){ var d=o.delay>0?o.delay:(rank*90); setTimeout(function(){ o.a.classList.add('play'); }, d); });
    }, 60);
    prev.disabled=(idx===0 && !playing); next.disabled=(idx===slides.length-1 && !playing);
    dotEls.forEach(function(d,i){ d.classList.toggle('on',i===idx); });
    if(indEl) indEl.textContent=(idx+1)+' / '+slides.length;
  }
  function go(n){ if(n<0||n>=slides.length)return; show(n); }

  // 재생 = 자동 페이지 넘김
  function startAuto(){ playing=true; playBtn.innerHTML=SVG_PAUSE; playBtn.classList.add('playing'); clearInterval(timer);
    timer=setInterval(function(){ var n=idx+1; if(n>=slides.length)n=0; show(n); }, AUTO_MS); prev.disabled=false; next.disabled=false; }
  function stopAuto(){ playing=false; playBtn.innerHTML=SVG_PLAY; playBtn.classList.remove('playing'); clearInterval(timer); show(idx); }
  playBtn.addEventListener('click',function(){ playing?stopAuto():startAuto(); });

  // BGM = 유튜브 무료음원 (IFrame Player)
  var ytPlayer=null, ytReady=false;
  if(boot.bgmYt && bgmBtn){
    window.onYouTubeIframeAPIReady=function(){
      ytPlayer=new YT.Player('cvYt',{ videoId:boot.bgmYt,
        playerVars:{ autoplay:0, controls:0, loop:1, playlist:boot.bgmYt, modestbranding:1, playsinline:1, rel:0 },
        events:{ 'onReady':function(){ ytReady=true; if(boot.autoplay) tryBgm(); } } });
    };
    var tag=document.createElement('script'); tag.src='https://www.youtube.com/iframe_api'; document.head.appendChild(tag);
    function tryBgm(){ if(!ytReady||!ytPlayer)return; try{ ytPlayer.unMute(); ytPlayer.playVideo(); bgmOn=true; bgmBtn.innerHTML=SVG_SOUND; }catch(e){} }
    function stopBgm(){ if(ytPlayer){ try{ ytPlayer.pauseVideo(); }catch(e){} } bgmOn=false; bgmBtn.innerHTML=SVG_MUTE; }
    bgmBtn.addEventListener('click',function(){ if(!ytReady)return; bgmOn?stopBgm():tryBgm(); });
    if(boot.autoplay){ window.addEventListener('pointerdown',function once(){ tryBgm(); window.removeEventListener('pointerdown',once); }); }
  }

  prev.addEventListener('click',function(){go(idx-1);});
  next.addEventListener('click',function(){go(idx+1);});
  dotEls.forEach(function(b){ b.addEventListener('click',function(){ go(+b.dataset.i); }); });
  window.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft')go(idx-1); if(e.key==='ArrowRight')go(idx+1); });
  stage.addEventListener('click',function(e){ var t=e.target.closest('.tab-el'); if(!t)return;
    if(t.dataset.href){ window.open(t.dataset.href,'_blank','noopener'); }   // 외부 링크
    else { go(parseInt(t.dataset.target,10)||0); }                          // 페이지 이동
  });

  var sx=0,sy=0,mv=false;
  stage.addEventListener('touchstart',function(e){ if(!e.touches[0]||e.target.closest('.el-swiper,.el-form,.el-field'))return; sx=e.touches[0].clientX; sy=e.touches[0].clientY; mv=true; },{passive:true});
  stage.addEventListener('touchend',function(e){ if(!mv)return; mv=false; var t=e.changedTouches[0]; var dx=t.clientX-sx, dy=t.clientY-sy;
    if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){ dx<0?go(idx+1):go(idx-1); } },{passive:true});

  // 캐러셀(상장) Swiper 초기화 — 네비/페이지네이션/라벨은 래퍼 하위 외부요소 참조
  if(typeof Swiper!=='undefined'){
    root.querySelectorAll('.el-swiper').forEach(function(el){
      var wrap=el.closest('.cr-wrap'); if(!wrap) return;
      var eff=el.dataset.eff||'coverflow';
      var fit=el.dataset.fit||'fit', perView=parseInt(el.dataset.perview)||2;
      var opts={ effect:eff, loop:el.dataset.loop==='1', speed:600, grabCursor:true, spaceBetween:parseInt(el.dataset.space||0,10) };
      var pg=wrap.querySelector('.swiper-pagination'); if(pg) opts.pagination={el:pg,clickable:true};
      var pv=wrap.querySelector('.cr-prev'), nx=wrap.querySelector('.cr-next'); if(pv&&nx) opts.navigation={prevEl:pv,nextEl:nx};
      if(eff==='coverflow'){ opts.centeredSlides=true; opts.slidesPerView=(fit==='fit')?'auto':perView; opts.coverflowEffect={rotate:38,depth:140,modifier:1,slideShadows:el.dataset.dim!=='1'}; }
      else if(eff==='cards'||eff==='flip'||eff==='cube'){ opts.centeredSlides=true; }
      else { opts.slidesPerView=(fit==='fit')?'auto':perView; }
      if(el.dataset.autoplay==='1') opts.autoplay={delay:2400,disableOnInteraction:false};
      try{ var sw=new Swiper(el,opts); var cb=wrap.querySelector('.cr-capbar');
        if(cb){ var upd=function(){ var as=sw.slides[sw.activeIndex]; cb.textContent=as?(as.getAttribute('data-cap')||''):''; }; sw.on('slideChange',upd); upd(); }
      }catch(err){}
    });
  }

  // 메일폼(문의) 제출
  root.querySelectorAll('.el-form').forEach(function(fm){
    fm.addEventListener('submit',function(ev){
      ev.preventDefault();
      var hp=fm.querySelector('.ef-hp'); if(hp&&hp.value) return;   // 허니팟
      var msg=fm.querySelector('.ef-msg'), btn=fm.querySelector('.ef-btn');
      var host=fm.closest('.cv-el');
      var payload={ token:boot.token, el:(host?host.getAttribute('data-eid'):'')||'', website:hp?hp.value:'' };
      fm.querySelectorAll('.ef-inp').forEach(function(i){ payload[i.name]=i.value; });
      if(btn) btn.disabled=true; if(msg){ msg.textContent='전송 중…'; msg.className='ef-msg'; }
      fetch(boot.formUrl||'/form_submit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){return r.json();}).then(function(j){
          if(j&&j.ok){ fm.reset(); if(msg){ msg.textContent='문의가 접수되었습니다. 감사합니다.'; msg.className='ef-msg ok'; } }
          else { if(msg){ msg.textContent=(j&&j.err)||'전송에 실패했습니다.'; msg.className='ef-msg err'; } if(btn) btn.disabled=false; }
        }).catch(function(){ if(msg){ msg.textContent='전송 오류가 발생했습니다.'; msg.className='ef-msg err'; } if(btn) btn.disabled=false; });
    });
  });

  // 개별 입력칸 폼 — 같은 슬라이드의 field들 모아서 전송
  root.querySelectorAll('.el-submit').forEach(function(btn){
    btn.addEventListener('click',function(){
      var host=btn.closest('.cv-el'), slide=btn.closest('.cv-slide'); if(!slide)return;
      var hp=host?host.querySelector('.ef-hp'):null; if(hp&&hp.value) return;   // 허니팟
      var fieldIds=[], values={}, missing=false;
      slide.querySelectorAll('.cv-el[data-field="1"]').forEach(function(fe){
        var fk=fe.getAttribute('data-fk'), inp=fe.querySelector('.ef-inp'), v=inp?inp.value.trim():'';
        fieldIds.push(fe.getAttribute('data-eid')); if(fk) values[fk]=v;
        if(inp&&inp.hasAttribute('required')&&!v) missing=true;
      });
      if(missing){ alert('필수 항목을 입력해주세요.'); return; }
      var payload={ token:boot.token, submit:(host?host.getAttribute('data-eid'):''), fieldIds:fieldIds, values:values, website:hp?hp.value:'' };
      var orig=btn.textContent; btn.disabled=true; btn.textContent='전송 중…';
      fetch(boot.formUrl||'/form_submit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){return r.json();}).then(function(j){
          if(j&&j.ok){ btn.textContent='접수되었습니다 ✓'; slide.querySelectorAll('.cv-el[data-field="1"] .ef-inp').forEach(function(i){ i.value=''; }); }
          else { alert((j&&j.err)||'전송에 실패했습니다.'); btn.disabled=false; btn.textContent=orig; }
        }).catch(function(){ alert('전송 오류가 발생했습니다.'); btn.disabled=false; btn.textContent=orig; });
    });
  });

  show(0);
})();
