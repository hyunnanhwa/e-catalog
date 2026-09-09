/* 전자카달로그 파워포인트형 에디터 (바닐라 JS)
   좌: 슬라이드 패널 / 중앙: 16:9 캔버스(드래그·리사이즈) / 우: 속성.
   요소 좌표=캔버스 % · 폰트=cqw(반응형). 자동저장(1.2s 디바운스)+수동저장. */
(function () {
  'use strict';
  var boot = JSON.parse(document.getElementById('ed-boot').textContent);
  var S = {
    catalogId: boot.catalogId, aspect: boot.aspect || '16:9', csrf: boot.csrf,
    saveUrl: boot.saveUrl, uploadUrl: boot.uploadUrl, cropUrl: boot.cropUrl||'/admin/media_crop.php', viewUrl: boot.viewUrl, token: boot.token,
    slides: boot.slides.map(normSlide), cur: 0, sel: null, selset: [], dirty: false,
    outerBg: (boot.settings&&boot.settings.outerBg)||'', outerImg: (boot.settings&&boot.settings.outerImg)||'',
    outerOpacity: (boot.settings&&boot.settings.outerOpacity!=null)?boot.settings.outerOpacity:1,
    outerBlur: (boot.settings&&boot.settings.outerBlur)||0,
    stageRadius: (boot.settings&&boot.settings.radius!=null)?boot.settings.radius:10,
    guides: { v: ((boot.settings&&boot.settings.guidesV)||[]).slice(), h: ((boot.settings&&boot.settings.guidesH)||[]).slice() }
  };
  var tmpSeq = 1;
  function normSlide(s){ return { id: s.id||0, tmpid: s.id? null : ('t'+(tmpSeq++)), bg: s.bg||null, elements: (s.elements||[]).map(normEl) }; }
  function normEl(e){ e.id = e.id || ('el'+Math.random().toString(36).slice(2,10)); e.z = e.z||1; e.aos = e.aos||''; return e; }
  function uid(){ return 'el'+Math.random().toString(36).slice(2,10); }
  function cur(){ return S.slides[S.cur]; }
  function selEl(){ var s=cur(); return s ? s.elements.find(function(e){return e.id===S.sel;}) : null; }
  // 다중 선택: S.selset=선택 id 배열, S.sel=단일 선택(=selset 1개일 때)
  function isSel(id){ return S.selset.indexOf(id)>=0; }
  function selSet(ids){ S.selset=(ids||[]).slice(); S.sel=(S.selset.length===1)?S.selset[0]:null; }
  function selClear(){ S.selset=[]; S.sel=null; }
  function selToggle(id){ var i=S.selset.indexOf(id); if(i>=0)S.selset.splice(i,1); else S.selset.push(id); S.sel=(S.selset.length===1)?S.selset[0]:null; }
  function groupEls(){ return S.selset.map(function(id){ return cur().elements.find(function(e){return e.id===id;}); }).filter(Boolean); }
  function groupBBox(){ var els=groupEls(); if(!els.length)return null;
    var x1=Math.min.apply(null,els.map(function(e){return e.x;})), y1=Math.min.apply(null,els.map(function(e){return e.y;})),
        x2=Math.max.apply(null,els.map(function(e){return e.x+e.w;})), y2=Math.max.apply(null,els.map(function(e){return e.y+e.h;}));
    return {x:x1,y:y1,w:x2-x1,h:y2-y1}; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function tabRad(e){ function v(x){ return (x==null?8:x); } return v(e.rtl)+'px '+v(e.rtr)+'px '+v(e.rbr)+'px '+v(e.rbl)+'px'; }
  function vidRad(e){ function v(x){ return (x==null?0:x); } return v(e.rtl)+'px '+v(e.rtr)+'px '+v(e.rbr)+'px '+v(e.rbl)+'px'; }
  function boxBg(e){ if(e.fillType!=='gradient') return (e.color1||'#3b82f6');
    var end=(e.gradEnd==='transparent')?hexA(e.color1||'#3b82f6',0):(e.color2||'#8b5cf6');
    var mid=e.grad3?(','+(e.color3||'#22d3ee')):'';
    return 'linear-gradient('+(e.gradAngle==null?135:e.gradAngle)+'deg,'+(e.color1||'#3b82f6')+mid+','+end+')'; }
  function hexA(hex,a){ hex=(hex||'#000000').replace('#',''); if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; var r=parseInt(hex.substr(0,2),16)||0,g=parseInt(hex.substr(2,2),16)||0,b=parseInt(hex.substr(4,2),16)||0; return 'rgba('+r+','+g+','+b+','+a+')'; }
  function shadowCss(e){ return e.shadow ? ('box-shadow:0 '+Math.round((e.shadowBlur||24)/3)+'px '+(e.shadowBlur||24)+'px '+hexA(e.shadowColor||'#000000',.4)+';') : ''; }
  function hoverCls(e){ return (e.hover && e.hover!=='none') ? (' hv-'+e.hover) : ''; }
  function textFillCss(e){ if(e.textFill!=='gradient') return 'color:'+(e.color||'#111')+';';
    var mid=e.tgrad3?(','+(e.gc3||'#22d3ee')):'';
    return 'background:linear-gradient('+(e.gAngle==null?90:e.gAngle)+'deg,'+(e.gc1||'#ff5a5a')+mid+','+(e.gc2||'#5a7bff')+');-webkit-background-clip:text;background-clip:text;color:transparent;'; }
  function aspNum(){ var p=(S.aspect||'16:9').split(':'); return (+p[0]||16)/(+p[1]||9); }

  // ── DOM 골격 ──────────────────────────────────────────────
  var root = document.getElementById('editor');
  root.innerHTML =
    '<div class="ed-top">'+
      '<a class="ed-back" href="app.html">← 나가기</a>'+
      '<div class="ed-title">'+esc(boot.title)+'</div>'+
      '<div class="ed-tools">'+
        '<button data-add="text" class="ed-tbtn">＋ 텍스트</button>'+
        '<button data-add="image" class="ed-tbtn">＋ 이미지</button>'+
        '<button data-add="video" class="ed-tbtn">＋ 영상</button>'+
        '<button data-add="tab" class="ed-tbtn">＋ 탭</button>'+
        '<button data-add="box" class="ed-tbtn">＋ 색상박스</button>'+
        '<button data-add="line" class="ed-tbtn">＋ 선</button>'+
        '<button data-add="carousel" class="ed-tbtn">＋ 슬라이드</button>'+
        '<button data-add="form" class="ed-tbtn">＋ 문의폼</button>'+
        '<button data-addslide class="ed-tbtn">＋ 페이지</button>'+
        '<button id="edGuideBtn" class="ed-tbtn ed-tbtn-toggle" type="button" title="정렬 가이드선 표시">⊹ 가이드</button>'+
        '<button id="edGVBtn" class="ed-tbtn" type="button" title="세로 가이드 추가 (드래그로 이동, 더블클릭 삭제)">│＋</button>'+
        '<button id="edGHBtn" class="ed-tbtn" type="button" title="가로 가이드 추가 (드래그로 이동, 더블클릭 삭제)">─＋</button>'+
      '</div>'+
      '<div class="ed-right-top">'+
        '<button class="ed-tbtn" id="edUndo" type="button" title="되돌리기 (Ctrl+Z)" disabled>↶</button>'+
        '<button class="ed-tbtn" id="edRedo" type="button" title="다시 실행 (Ctrl+Shift+Z)" disabled>↷</button>'+
        '<span class="ed-status" id="edStatus">저장됨</span>'+
        '<button class="ed-save" id="edSave">저장</button></div>'+
    '</div>'+
    '<div class="ed-main">'+
      '<aside class="ed-slides"><div class="ed-slides-list" id="edSlides"></div>'+
        '<button class="ed-addslide" id="edAddSlide">＋ 페이지 추가</button></aside>'+
      '<div class="ed-stage" id="edStage"><div class="ed-stage-bg" id="edStageBg"></div><div class="ed-canvas-wrap"><div class="ed-canvas" id="edCanvas"></div></div></div>'+
      '<aside class="ed-props" id="edProps"></aside>'+
    '</div>'+
    '<input type="file" id="edFile" accept="image/*,video/mp4" style="display:none">';

  var elSlides = document.getElementById('edSlides');
  var elCanvas = document.getElementById('edCanvas');
  var elStage  = document.getElementById('edStage');
  var elProps  = document.getElementById('edProps');
  var elStatus = document.getElementById('edStatus');
  var elFile   = document.getElementById('edFile');

  // ── 스냅(가장자리 0/50/100%) + 가이드선 ──
  var edVG=document.createElement('div'); edVG.className='ed-vguide';
  var edHG=document.createElement('div'); edHG.className='ed-hguide';
  // 정렬 가이드 오버레이(토글, 편집용 · 저장/뷰어 미반영): 중앙 + 3분할선
  var edGuides=document.createElement('div'); edGuides.className='ed-guides';
  edGuides.innerHTML=['33.333','50','66.667'].map(function(p){ var c=(p==='50')?' center':''; return '<i class="gv'+c+'" style="left:'+p+'%"></i><i class="gh'+c+'" style="top:'+p+'%"></i>'; }).join('');
  // 포토샵식 드래그 가이드(사용자 추가, 드래그 이동·더블클릭 삭제)
  var edCGuides=document.createElement('div'); edCGuides.className='ed-cguides';
  function renderGuides(){ edCGuides.innerHTML=''; S.guides.v.forEach(function(p,i){ edCGuides.appendChild(makeGuide('v',p,i)); }); S.guides.h.forEach(function(p,i){ edCGuides.appendChild(makeGuide('h',p,i)); }); }
  function makeGuide(axis,pct,idx){
    var g=document.createElement('div'); g.className='ed-cguide '+(axis==='v'?'cg-v':'cg-h');
    if(axis==='v') g.style.left=pct+'%'; else g.style.top=pct+'%';
    g.addEventListener('mousedown',function(ev){ ev.preventDefault(); ev.stopPropagation();
      var rect=elCanvas.getBoundingClientRect();
      function mv(m){ var p= axis==='v' ? ((m.clientX-rect.left)/rect.width*100) : ((m.clientY-rect.top)/rect.height*100);
        p=Math.max(0,Math.min(100,Math.round(p*10)/10)); if(axis==='v'){ g.style.left=p+'%'; S.guides.v[idx]=p; } else { g.style.top=p+'%'; S.guides.h[idx]=p; } }
      function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); markDirty(); }
      document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up); });
    g.addEventListener('dblclick',function(ev){ ev.stopPropagation(); S.guides[axis].splice(idx,1); renderGuides(); markDirty(); });
    return g;
  }
  function addGuide(axis){ S.guides[axis].push(50); elCanvas.classList.add('show-guides'); var gb=document.getElementById('edGuideBtn'); if(gb)gb.classList.add('on'); renderGuides(); markDirty(); }
  function xTargets(){ return [0,50,100].concat(S.guides.v); }
  function yTargets(){ return [0,50,100].concat(S.guides.h); }
  var SNAP=1.5;
  function showV(x){ edVG.style.left=x+'%'; edVG.style.display='block'; }
  function showH(y){ edHG.style.top=y+'%'; edHG.style.display='block'; }
  function hideGuides(){ edVG.style.display='none'; edHG.style.display='none'; }
  function snapMove(e){ hideGuides(); var XT=xTargets(), YT=yTargets();
    var xa=[e.x,e.x+e.w/2,e.x+e.w],best,bd,i;
    for(i=0;i<3;i++){ best=null;bd=SNAP; XT.forEach(function(L){var d=Math.abs(xa[i]-L); if(d<bd){bd=d;best=L;}}); if(best!==null){ e.x+=best-xa[i]; showV(best); break; } }
    var ya=[e.y,e.y+e.h/2,e.y+e.h],b2,d2,j;
    for(j=0;j<3;j++){ b2=null;d2=SNAP; YT.forEach(function(L){var d=Math.abs(ya[j]-L); if(d<d2){d2=d;b2=L;}}); if(b2!==null){ e.y+=b2-ya[j]; showH(b2); break; } }
  }
  function snapResize(e,h){ hideGuides(); var XT=xTargets(), YT=yTargets();
    if(h.indexOf('e')>=0)XT.forEach(function(L){ if(Math.abs(e.x+e.w-L)<=SNAP){ e.w=L-e.x; showV(L); } });
    if(h.indexOf('w')>=0)XT.forEach(function(L){ if(Math.abs(e.x-L)<=SNAP){ var nr=e.x+e.w; e.x=L; e.w=nr-L; showV(L); } });
    if(h.indexOf('s')>=0)YT.forEach(function(L){ if(Math.abs(e.y+e.h-L)<=SNAP){ e.h=L-e.y; showH(L); } });
    if(h.indexOf('n')>=0)YT.forEach(function(L){ if(Math.abs(e.y-L)<=SNAP){ var nb=e.y+e.h; e.y=L; e.h=nb-L; showH(L); } });
  }

  // ── 텍스트 선택영역 저장/복원 (속성패널 조작 시 선택 유지) + 부분 굵기 ──
  var savedRange=null;
  document.addEventListener('selectionchange',function(){
    var s=window.getSelection(); if(!s.rangeCount) return;
    var r=s.getRangeAt(0); var ed=elCanvas.querySelector('.el.editing .el-text');
    if(ed && ed.contains(r.commonAncestorContainer)) savedRange=r.cloneRange();
  });
  function restoreRange(){ var ed=elCanvas.querySelector('.el.editing .el-text'); if(!ed||!savedRange) return false;
    ed.focus(); var s=window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); return true; }
  function applyWeightToSelection(w){ var s=window.getSelection(); if(!s.rangeCount) return false; var r=s.getRangeAt(0); if(r.collapsed) return false;
    var span=document.createElement('span'); span.style.fontWeight=w;
    try{ r.surroundContents(span); }catch(e){ var f=r.extractContents(); span.appendChild(f); r.insertNode(span); } return true; }
  // 이모지/아이콘을 텍스트에 삽입 (편집 중=커서 위치, 아니면 요소 끝에 추가)
  function insertIntoText(html){
    var ed=elCanvas.querySelector('.el.editing .el-text');
    if(ed){ ed.focus(); restoreRange(); document.execCommand('insertHTML',false,html); syncText(); return; }
    var e=selEl(); if(e && e.type==='text'){ e.html=(e.html||'')+html; markDirty(); renderCanvas(); renderProps(); }
    else alert('텍스트를 더블클릭해 편집 상태에서 넣어주세요.');
  }

  document.querySelector('.ed-canvas-wrap').style.aspectRatio = aspNum();
  elCanvas.style.aspectRatio = aspNum();
  elCanvas.style.borderRadius = (S.stageRadius==null?10:S.stageRadius)+'px';

  // ── 렌더: 요소 → DOM ──────────────────────────────────────
  function elStyle(e){
    return 'left:'+e.x+'%;top:'+e.y+'%;width:'+e.w+'%;height:'+e.h+'%;z-index:'+(e.z||1)+';';
  }
  function renderElInner(e){
    if (e.type==='text'){
      var st='font-size:'+(e.size||3)+'cqw;'+textFillCss(e)+'text-align:'+(e.align||'left')+';'+
             'font-weight:'+(e.fw||(e.weight?700:400))+';'+(e.italic?'font-style:italic;':'')+(e.family?'font-family:\''+e.family+'\',sans-serif;':'')+
             (e.ls?'letter-spacing:'+e.ls+'em;':'')+'line-height:'+(e.lh==null?1.25:e.lh)+';'+(e.rot?'transform:rotate('+e.rot+'deg);':'')+'opacity:'+(e.opacity==null?1:e.opacity)+';';
      return '<div class="el-text" style="'+st+'">'+(e.html||'텍스트')+'</div>';
    }
    if (e.type==='box'){
      return '<div class="el-box" style="background:'+boxBg(e)+';border-radius:'+(e.radius||0)+'px;opacity:'+(e.opacity==null?1:e.opacity)+';'+(e.rot?'transform:rotate('+e.rot+'deg);':'')+shadowCss(e)+'"></div>';
    }
    if (e.type==='line'){
      return '<div class="el-line" style="border-top:'+(e.thick||3)+'px '+(e.lineStyle||'solid')+' '+(e.color||'#1a1a1a')+';opacity:'+(e.opacity==null?1:e.opacity)+';transform:translateY(-50%) rotate('+(e.rot||0)+'deg)"></div>';
    }
    if (e.type==='image'){
      return e.src ? '<img class="el-img" src="'+esc(e.src)+'" style="object-fit:'+(e.fit||'contain')+';border-radius:'+(e.radius||0)+'px;opacity:'+(e.opacity==null?1:e.opacity)+';filter:'+(e.blur?('blur('+e.blur+'px)'):'none')+';'+shadowCss(e)+'" draggable="false">'
                   : '<div class="el-empty">이미지 없음</div>';
    }
    if (e.type==='video'){
      return e.src ? '<video class="el-video" src="'+esc(e.src)+'" '+(e.muted?'muted':'')+' '+(e.loop?'loop':'')+' playsinline style="object-fit:'+(e.fit||'cover')+';border-radius:'+vidRad(e)+'"></video>'
                   : '<div class="el-empty">영상 없음</div>';
    }
    if (e.type==='tab'){
      return '<div class="el-tab" style="background:'+(e.bg||'#1a1a1a')+';color:'+(e.color||'#fff')+';font-size:'+(e.size||2.2)+'cqw;border-radius:'+tabRad(e)+(e.vertical?';writing-mode:vertical-rl':'')+'">'+esc(e.label||'탭')+'</div>';
    }
    if (e.type==='carousel'){
      var ims=e.images||[];
      if(!ims.length) return '<div class="el-empty">＋ 슬라이드 이미지를 추가하세요</div>';
      return crWrapHtml(e);
    }
    if (e.type==='form'){ return formHtml(e); }
    if (e.type==='field'){ return fieldHtml(e); }
    if (e.type==='submit'){ return submitHtml(e); }
    return '';
  }
  // ── 메일폼(문의) ──
  var FORM_ORDER=['name','company','phone','email','message'];
  var FORM_DEF={ name:{label:'이름',ph:'이름'}, company:{label:'회사명',ph:'회사명'}, phone:{label:'전화번호',ph:'010-0000-0000'}, email:{label:'이메일',ph:'you@example.com'}, message:{label:'내용',ph:'문의 내용을 입력하세요'} };
  // 개별 입력칸 요소(field) / 전송 버튼(submit)
  function fieldHtml(e){
    var d=FORM_DEF[e.fk]||{label:'입력',ph:''};
    var lab=(e.label!=null?e.label:d.label), ph=(e.ph!=null?e.ph:d.ph);
    var inpBg=(e.bg==='transparent')?'transparent':(e.bg||'#ffffff');
    var st='font-family:'+(e.family?("'"+e.family+"',sans-serif"):'inherit')+';color:'+(e.color||'#333333')+';font-size:'+(e.size||2.2)+'cqw;';
    var labHtml=(e.labelShow!==0)?'<div class="ef-lab" style="color:'+(e.labelColor||e.color||'#333333')+'">'+esc(lab)+(e.req?' <span class="ef-req">*</span>':'')+'</div>':'';
    var inpSt='background:'+inpBg+';border-radius:'+(e.radius==null?8:e.radius)+'px';
    var inp=(e.fk==='message')
      ? '<textarea class="ef-inp" placeholder="'+esc(ph)+'" style="'+inpSt+'"></textarea>'
      : '<input class="ef-inp" type="'+(e.fk==='email'?'email':e.fk==='phone'?'tel':'text')+'" placeholder="'+esc(ph)+'" style="'+inpSt+'">';
    return '<div class="el-field" style="'+st+'">'+labHtml+inp+'</div>';
  }
  function submitHtml(e){
    var bg=(e.bg==='transparent')?'transparent':(e.bg||'#1a1a1a');
    var st='background:'+bg+';color:'+(e.color||'#ffffff')+';font-size:'+(e.size||2.4)+'cqw;border-radius:'+(e.radius==null?8:e.radius)+'px;font-family:'+(e.family?("'"+e.family+"',sans-serif"):'inherit')+';'+((e.bg==='transparent')?'border:1.5px solid '+(e.color||'#1a1a1a')+';':'');
    return '<button class="el-submit" type="button" style="'+st+'">'+esc(e.text||'보내기')+'</button>';
  }
  function mkField(fk){ var d=FORM_DEF[fk]||{label:'입력',ph:''}; return { id:uid(), type:'field', fk:fk, x:32, y:38, w:36, h:(fk==='message'?18:11), z:maxZ()+1, aos:'', label:d.label, labelShow:1, ph:d.ph, req:(fk==='name'||fk==='email'||fk==='message')?1:0, family:'', color:'#333333', labelColor:'#333333', size:2.2, bg:'#ffffff', radius:8 }; }
  function mkSubmit(){ return { id:uid(), type:'submit', x:32, y:78, w:36, h:9, z:maxZ()+1, aos:'', text:'보내기', bg:'#1a1a1a', color:'#ffffff', family:'', size:2.4, radius:8, to:'' }; }
  function addFormSet(){ var order=['name','email','message'], x=32, w=36, y0=18, gap=14, ids=[];
    order.forEach(function(fk,i){ var e=mkField(fk); e.x=x; e.w=w; e.y=y0+i*gap; e.h=(fk==='message'?18:11); cur().elements.push(e); ids.push(e.id); });
    var sb=mkSubmit(); sb.x=x; sb.w=w; sb.y=y0+order.length*gap+2; cur().elements.push(sb);
    selSet([sb.id]); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
  function addField(fk){ var e=mkField(fk); e.x=32; e.y=40; e.z=maxZ()+1; cur().elements.push(e); selSet([e.id]); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
  function formHtml(e){
    var flds=e.fields||{};
    var rows=FORM_ORDER.map(function(k){
      var f=flds[k]||{}; if(f.on===0) return '';
      var d=FORM_DEF[k]; var lab=(f.label!=null?f.label:d.label); var ph=(f.ph!=null?f.ph:d.ph);
      var star=f.req?'<span class="ef-req">*</span>':'';
      var ctl=(k==='message')
        ? '<textarea class="ef-inp" rows="3" placeholder="'+esc(ph)+'"></textarea>'
        : '<input class="ef-inp" type="'+(k==='email'?'email':k==='phone'?'tel':'text')+'" placeholder="'+esc(ph)+'">';
      return '<label class="ef-row"><span class="ef-lab">'+esc(lab)+star+'</span>'+ctl+'</label>';
    }).join('');
    var panelSt='background:'+(e.bg||'#ffffff')+';border-radius:'+(e.radius==null?12:e.radius)+'px;--eflab:'+(e.labelColor||'#333333')+';';
    var title=e.title?'<div class="ef-title">'+esc(e.title)+'</div>':'';
    return '<form class="el-form" style="'+panelSt+'" onsubmit="return false">'+title+rows+'<button type="button" class="ef-btn" style="background:'+(e.btnBg||'#1a1a1a')+';color:'+(e.btnColor||'#ffffff')+'">'+esc(e.btnText||'보내기')+'</button></form>';
  }
  // ── 캐러셀(상장) Swiper 생명주기 ──
  function crItem(x){ return (x&&typeof x==='object')?{u:x.u||'',label:x.label||''}:{u:x||'',label:''}; }
  // 래퍼: 이미지(스와이퍼)는 중앙, 네비/라벨/페이지네이션은 이미지 바깥(측면 거터·하단 밴드)에 배치 → 상장에 겹치지 않음
  function crWrapHtml(e){
    var ims=e.images||[];
    var showLabel=(e.labelMode||'show')!=='none';
    var showPager=(e.pager==null)?true:!!e.pager;
    var np=e.navPos||'mid'; var hasNav=(e.effect!=='fade' && np!=='none');
    var slides=ims.map(function(it){ var o=crItem(it); return '<div class="swiper-slide" data-cap="'+esc(o.label)+'"><img src="'+esc(o.u)+'" draggable="false"></div>'; }).join('');
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
    return '<div class="cr-wrap" data-navpos="'+np+'" style="--navbg:'+(e.navBg||'#1a1a1a')+';--navcolor:'+(e.navColor||'#ffffff')+'">'+head+stage+foot+'</div>';
  }
  var edSwipers=[];
  function destroySwipers(){ edSwipers.forEach(function(s){ try{s.destroy(true,true);}catch(e){} }); edSwipers=[]; }
  function initSwipers(){ if(typeof Swiper==='undefined')return;
    elCanvas.querySelectorAll('.el-swiper').forEach(function(el){
      var wrap=el.closest('.cr-wrap'); if(!wrap) return;
      var eff=el.dataset.eff||'coverflow';
      var fit=el.dataset.fit||'fit', perView=parseInt(el.dataset.perview)||2;
      var opts={ effect:eff, loop:el.dataset.loop==='1', speed:600, allowTouchMove:false, spaceBetween:parseInt(el.dataset.space||0,10) };
      var pg=wrap.querySelector('.swiper-pagination'); if(pg) opts.pagination={el:pg,clickable:true};
      var pv=wrap.querySelector('.cr-prev'), nx=wrap.querySelector('.cr-next'); if(pv&&nx) opts.navigation={prevEl:pv,nextEl:nx};
      if(eff==='coverflow'){ opts.centeredSlides=true; opts.slidesPerView=(fit==='fit')?'auto':perView; opts.coverflowEffect={rotate:38,depth:140,modifier:1,slideShadows:el.dataset.dim!=='1'}; }
      else if(eff==='cards'||eff==='flip'||eff==='cube'){ opts.centeredSlides=true; }
      else { opts.slidesPerView=(fit==='fit')?'auto':perView; }
      if(el.dataset.autoplay==='1') opts.autoplay={delay:2400,disableOnInteraction:false};
      try{ var sw=new Swiper(el,opts); var cb=wrap.querySelector('.cr-capbar');
        if(cb){ var upd=function(){ var as=sw.slides[sw.activeIndex]; cb.textContent=as?(as.getAttribute('data-cap')||''):''; }; sw.on('slideChange',upd); upd(); }
        edSwipers.push(sw); }catch(err){}
    });
  }
  function renderCanvas(){
    destroySwipers();
    var s=cur();
    elCanvas.style.background = s && s.bg ? s.bg : '#ffffff';
    elCanvas.innerHTML='';
    if(!s) return;
    var single=(S.selset.length===1);
    s.elements.slice().sort(function(a,b){return (a.z||1)-(b.z||1);}).forEach(function(e){
      var d=document.createElement('div');
      d.className='el'+(isSel(e.id)?' sel':'')+(e.locked?' locked':'')+' el-'+e.type;
      d.style.cssText=elStyle(e);
      d.dataset.id=e.id;
      d.innerHTML=renderElInner(e)+lockBtnHtml(e)+((single&&isSel(e.id)&&!e.locked)?handlesHtml():'');
      elCanvas.appendChild(d);
    });
    if(S.selset.length>1){ var gb=groupBBox(); if(gb){ var gbx=document.createElement('div'); gbx.className='ed-groupbox';
      gbx.style.cssText='left:'+gb.x+'%;top:'+gb.y+'%;width:'+gb.w+'%;height:'+gb.h+'%;';
      gbx.innerHTML=['nw','n','ne','e','se','s','sw','w'].map(function(h){return '<span class="grh grh-'+h+'" data-h="'+h+'"></span>';}).join('');
      elCanvas.appendChild(gbx); } }
    elCanvas.appendChild(edGuides); elCanvas.appendChild(edCGuides); renderGuides(); elCanvas.appendChild(edVG); elCanvas.appendChild(edHG); hideGuides();
    initSwipers();
  }
  function handlesHtml(){
    return ['nw','n','ne','e','se','s','sw','w'].map(function(h){return '<span class="rh rh-'+h+'" data-h="'+h+'"></span>';}).join('')
      + '<span class="el-move" title="드래그로 이동"></span>';
  }
  function lockBtnHtml(e){ return '<button class="el-lock'+(e.locked?' on':'')+'" data-lockid="'+e.id+'" title="'+(e.locked?'잠금 해제':'잠금')+'">'+(e.locked?'🔒':'🔓')+'</button>'; }

  // ── 렌더: 슬라이드 패널 ───────────────────────────────────
  function renderSlides(){
    elSlides.innerHTML='';
    S.slides.forEach(function(s,i){
      var box=document.createElement('div');
      box.className='ed-slide'+(i===S.cur?' on':'');
      var mini=document.createElement('div'); mini.className='ed-mini'; mini.style.aspectRatio=aspNum();
      mini.style.background=s.bg||'#fff';
      s.elements.slice().sort(function(a,b){return (a.z||1)-(b.z||1);}).forEach(function(e){
        var m=document.createElement('div'); m.className='el el-'+e.type; m.style.cssText=elStyle(e); m.innerHTML=renderElInner(e); mini.appendChild(m);
      });
      box.appendChild(mini);
      var no=document.createElement('div'); no.className='ed-slide-no'; no.textContent=(i+1);
      box.appendChild(no);
      var ctl=document.createElement('div'); ctl.className='ed-slide-ctl';
      ctl.innerHTML='<button data-up title="위로">▲</button><button data-down title="아래로">▼</button><button data-dup title="페이지 복제">⧉</button><button data-del title="삭제">✕</button>';
      box.appendChild(ctl);
      box.addEventListener('click',function(ev){ if(ev.target.closest('.ed-slide-ctl'))return; S.cur=i; selClear(); renderAll(); });
      ctl.querySelector('[data-up]').addEventListener('click',function(){ moveSlide(i,-1); });
      ctl.querySelector('[data-down]').addEventListener('click',function(){ moveSlide(i,1); });
      ctl.querySelector('[data-dup]').addEventListener('click',function(){ dupSlide(i); });
      ctl.querySelector('[data-del]').addEventListener('click',function(){ delSlide(i); });
      elSlides.appendChild(box);
    });
  }
  function moveSlide(i,d){ var j=i+d; if(j<0||j>=S.slides.length)return; var t=S.slides[i]; S.slides[i]=S.slides[j]; S.slides[j]=t; if(S.cur===i)S.cur=j; else if(S.cur===j)S.cur=i; markDirty(); renderAll(); }
  function delSlide(i){ if(S.slides.length<=1){alert('최소 1페이지는 있어야 합니다.');return;} if(!confirm((i+1)+'페이지를 삭제할까요?'))return; S.slides.splice(i,1); if(S.cur>=S.slides.length)S.cur=S.slides.length-1; selClear(); markDirty(); renderAll(); }
  // 페이지(슬라이드) 복제 — 요소 전부 새 id로 복사해 바로 뒤에 삽입
  function dupSlide(i){ var src=S.slides[i];
    var els=JSON.parse(JSON.stringify(src.elements||[])); els.forEach(function(e){ e.id=uid(); });
    var copy=normSlide({id:0, bg:src.bg, elements:els});
    S.slides.splice(i+1,0,copy); S.cur=i+1; selClear(); markDirty(); renderAll(); }
  function addSlide(){ S.slides.push(normSlide({id:0,elements:[]})); S.cur=S.slides.length-1; selClear(); markDirty(); renderAll(); }
  document.getElementById('edAddSlide').addEventListener('click',addSlide);
  var tbAddSlide=document.querySelector('[data-addslide]'); if(tbAddSlide) tbAddSlide.addEventListener('click',addSlide);
  var gBtn=document.getElementById('edGuideBtn'); if(gBtn) gBtn.addEventListener('click',function(){ var on=elCanvas.classList.toggle('show-guides'); gBtn.classList.toggle('on',on); });
  var gvB=document.getElementById('edGVBtn'); if(gvB) gvB.addEventListener('click',function(){ addGuide('v'); });
  var ghB=document.getElementById('edGHBtn'); if(ghB) ghB.addEventListener('click',function(){ addGuide('h'); });
  var uBtn=document.getElementById('edUndo'); if(uBtn) uBtn.addEventListener('click',doUndo);
  var rBtn=document.getElementById('edRedo'); if(rBtn) rBtn.addEventListener('click',doRedo);
  document.addEventListener('keydown',function(ev){ var k=ev.key.toLowerCase();
    if((ev.ctrlKey||ev.metaKey)&&k==='z'){ if(elCanvas.querySelector('.el.editing'))return; ev.preventDefault(); ev.shiftKey?doRedo():doUndo(); }
    else if((ev.ctrlKey||ev.metaKey)&&k==='y'){ if(elCanvas.querySelector('.el.editing'))return; ev.preventDefault(); doRedo(); } });

  // ── 렌더: 속성 패널 ───────────────────────────────────────
  function renderProps(){
    // 다중 선택 → 그룹 위치·크기 패널
    if(S.selset.length>1){ var gb=groupBBox()||{x:0,y:0,w:0,h:0};
      elProps.innerHTML='<div class="pp-h">여러 요소 ('+S.selset.length+'개 선택)</div>'
        +'<p class="pp-hint">드래그로 함께 이동, 모서리 핸들로 함께 크기조절. 빈 곳 클릭 또는 Esc로 해제.</p>'
        +'<div class="pp-sec"><div class="pp-h">그룹 위치·크기 (%)</div><div class="pp-grid4">'
        +numField('X','ppGX',gb.x)+numField('Y','ppGY',gb.y)+numField('W','ppGW',gb.w)+numField('H','ppGH',gb.h)+'</div></div>'
        +'<div class="pp-order"><button id="ppGFront">맨 앞으로</button><button id="ppGBack">맨 뒤로</button></div>'
        +'<button class="pp-btn" id="ppGDup">📋 선택 복제</button>'
        +'<button class="pp-del" id="ppGDel">선택 삭제 ('+S.selset.length+'개)</button>';
      bindGroupProps();
      return;
    }
    var e=selEl();
    if(!e){ var ap=(S.aspect||'16:9').split(':'); var aw=(+ap[0]||16), ah=(+ap[1]||9);
      var AR_PRESETS=[['16:9','16:9 (가로형)'],['4:3','4:3'],['3:2','3:2'],['1:1','1:1 (정사각)'],['21:9','21:9 (와이드)'],['3:4','3:4 (세로형)'],['9:16','9:16 (세로형)']];
      var curRatio=aw/ah, matched=null;
      AR_PRESETS.forEach(function(p){ var q=p[0].split(':'); if(matched==null && Math.abs((+q[0]/+q[1])-curRatio)<0.005) matched=p[0]; });
      var arPresetOpts='<option value=""'+(matched?'':' selected')+'>사용자 지정</option>'+AR_PRESETS.map(function(p){return '<option value="'+p[0]+'"'+(p[0]===matched?' selected':'')+'>'+p[1]+'</option>';}).join('');
      var sr=(S.stageRadius==null?10:S.stageRadius);
      elProps.innerHTML='<div class="pp-empty">요소를 선택하면<br>여기서 편집합니다.</div>'
        +'<div class="pp-sec"><div class="pp-h">카달로그 비율</div>'
        +'<div class="pp-row"><label>대표 비율</label><div class="pp-ctl"><select id="ppArPreset">'+arPresetOpts+'</select></div></div>'
        +'<div class="pp-ar"><input type="number" id="ppArW" min="1" max="9999" step="1" value="'+aw+'"><span class="pp-ar-x">×</span><input type="number" id="ppArH" min="1" max="9999" step="1" value="'+ah+'"><span class="pp-ar-u">px</span></div>'
        +'<p class="pp-hint">가로·세로(px)로 비율을 정하거나 대표 비율을 선택하세요. 미지정 시 16:9.</p></div>'
        +'<div class="pp-sec"><div class="pp-h">카달로그 모서리 곡선</div>'
        +row('둥글기','<input type="range" id="ppStageRad" min="0" max="60" value="'+sr+'"><span class="pp-num">'+sr+'</span>')+'</div>'
        +'<div class="pp-sec"><div class="pp-h">페이지 배경 (현재 페이지)</div>'
        +'<input type="color" id="ppBg" value="'+((cur()&&cur().bg)||'#ffffff')+'"></div>'
        +'<div class="pp-sec"><div class="pp-h">카달로그 바깥 배경</div>'
        +'<div class="pp-row"><label>색상</label><div class="pp-ctl"><input type="color" id="ppOuterBg" value="'+(S.outerBg||'#0f172a')+'"></div></div>'
        +'<button class="pp-btn" id="ppOuterImg">🖼️ 배경 이미지 넣기</button>'
        +(S.outerImg?(
            '<button class="pp-btn" id="ppOuterClear">배경 이미지 제거</button>'
          + row('투명도','<input type="range" id="ppOuterOp" min="0" max="100" value="'+Math.round((S.outerOpacity==null?1:S.outerOpacity)*100)+'"><span class="pp-num">'+Math.round((S.outerOpacity==null?1:S.outerOpacity)*100)+'</span>')
          + row('블러','<input type="range" id="ppOuterBl" min="0" max="40" value="'+(S.outerBlur||0)+'"><span class="pp-num">'+(S.outerBlur||0)+'</span>')
          ):'')
        +'<p class="pp-hint">카달로그 뒤(바깥) 영역에 적용됩니다.</p></div>';
      function applyAspect(){ var r=aspNum(); var w=document.querySelector('.ed-canvas-wrap'); if(w)w.style.aspectRatio=r; elCanvas.style.aspectRatio=r; renderSlides(); }
      function setAspect(){ var w=Math.max(1,Math.min(9999,Math.round(+(arW&&arW.value)||0))), hh=Math.max(1,Math.min(9999,Math.round(+(arH&&arH.value)||0))); if(!w||!hh)return; S.aspect=w+':'+hh; applyAspect(); markDirty(); }
      var arW=document.getElementById('ppArW'), arH=document.getElementById('ppArH');
      if(arW) arW.addEventListener('change',setAspect);
      if(arH) arH.addEventListener('change',setAspect);
      var arP=document.getElementById('ppArPreset'); if(arP) arP.addEventListener('change',function(){ if(!arP.value)return; var pr=arP.value.split(':'); S.aspect=(+pr[0])+':'+(+pr[1]); applyAspect(); markDirty(); renderProps(); });
      var srI=document.getElementById('ppStageRad'); if(srI) srI.addEventListener('input',function(){ S.stageRadius=+srI.value; srI.nextSibling.textContent=srI.value; elCanvas.style.borderRadius=S.stageRadius+'px'; markDirty(); });
      var bg=document.getElementById('ppBg'); if(bg) bg.addEventListener('input',function(){ cur().bg=bg.value; markDirty(); renderCanvas(); renderSlides(); });
      var ob=document.getElementById('ppOuterBg'); if(ob) ob.addEventListener('input',function(){ S.outerBg=ob.value; S.outerImg=''; applyOuter(); markDirty(); });
      var oi=document.getElementById('ppOuterImg'); if(oi) oi.addEventListener('click',function(){ uploadOuter(); });
      var oc=document.getElementById('ppOuterClear'); if(oc) oc.addEventListener('click',function(){ S.outerImg=''; applyOuter(); markDirty(); renderProps(); });
      var oo=document.getElementById('ppOuterOp'); if(oo) oo.addEventListener('input',function(){ S.outerOpacity=(+oo.value)/100; oo.nextSibling.textContent=oo.value; applyOuter(); markDirty(); });
      var obl=document.getElementById('ppOuterBl'); if(obl) obl.addEventListener('input',function(){ S.outerBlur=+obl.value; obl.nextSibling.textContent=obl.value; applyOuter(); markDirty(); });
      enhanceColors();
      return;
    }
    var h='<div class="pp-h">'+(({text:'텍스트',image:'이미지',video:'영상',tab:'탭 메뉴',box:'색상박스',line:'선',carousel:'슬라이드',form:'문의폼',field:'입력칸',submit:'전송 버튼'}[e.type])||'요소')+'</div>';
    if(e.type==='line'){
      h+=row('색상','<input type="color" id="ppLnColor" value="'+rgbHex(e.color||'#1a1a1a')+'">')+
        row('굵기','<input type="range" id="ppLnThick" min="1" max="40" value="'+(e.thick||3)+'"><span class="pp-num">'+(e.thick||3)+'</span>')+
        row('선 종류','<select id="ppLnStyle">'+[['solid','실선'],['dashed','파선'],['dotted','점선']].map(function(o){return '<option value="'+o[0]+'"'+((e.lineStyle||'solid')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>')+
        row('투명도','<input type="range" id="ppLnOp" min="0" max="100" value="'+Math.round((e.opacity==null?1:e.opacity)*100)+'"><span class="pp-num">'+Math.round((e.opacity==null?1:e.opacity)*100)+'</span>')+
        rotRow('ppLnRot',e.rot)+
        '<p class="pp-hint">길이는 아래 위치·크기의 W(가로)로, 세로선은 회전 90°로 만드세요.</p>';
    }
    if(e.type==='text'){
      h+=fmtBar()+pickerPalette()+
        row('크기(px)', '<input type="range" id="ppSize" min="0.5" max="24" step="0.1" value="'+(e.size||3)+'"><input type="number" id="ppSizePx" class="pp-numin" min="5" max="400" value="'+Math.round((e.size||3)*10)+'">')+
        row('색상', '<input type="color" id="ppColor" value="'+rgbHex(e.color)+'">')+
        row('글자 채우기','<select id="ppTextFill"><option value="solid"'+(e.textFill!=='gradient'?' selected':'')+'>단색</option><option value="gradient"'+(e.textFill==='gradient'?' selected':'')+'>그라데이션</option></select>')+
        (e.textFill==='gradient'?(row('색상 1','<input type="color" id="ppGc1" value="'+rgbHex(e.gc1||'#ff5a5a')+'">')+row('가운데 색 추가','<input type="checkbox" id="ppTg3" '+(e.tgrad3?'checked':'')+'>')+(e.tgrad3?row('색상 2 (가운데)','<input type="color" id="ppGc3" value="'+rgbHex(e.gc3||'#22d3ee')+'">'):'')+row(e.tgrad3?'색상 3 (끝)':'색상 2','<input type="color" id="ppGc2" value="'+rgbHex(e.gc2||'#5a7bff')+'">')+row('방향','<input type="range" id="ppGang" min="0" max="360" value="'+(e.gAngle==null?90:e.gAngle)+'"><span class="pp-num">'+(e.gAngle==null?90:e.gAngle)+'</span>')):'')+
        row('정렬', alignBtns(e.align))+
        row('글꼴', fontSelect(e.family))+
        row('굵기', weightSelect(e.fw))+
        row('자간','<input type="range" id="ppLs" min="-0.1" max="0.5" step="0.01" value="'+(e.ls||0)+'"><span class="pp-num">'+(e.ls||0)+'</span>')+
        row('행간','<input type="range" id="ppLh" min="0.8" max="3" step="0.05" value="'+(e.lh==null?1.25:e.lh)+'"><span class="pp-num">'+(e.lh==null?1.25:e.lh)+'</span>')+
        row('투명도','<input type="range" id="ppTxtOp" min="0" max="100" value="'+Math.round((e.opacity==null?1:e.opacity)*100)+'"><span class="pp-num">'+Math.round((e.opacity==null?1:e.opacity)*100)+'</span>')+
        rotRow('ppTxtRot',e.rot);
    }
    if(e.type==='image'){
      h+=row('채움','<select id="ppFit"><option value="contain"'+(e.fit!=='cover'?' selected':'')+'>비율 유지 (기본)</option><option value="cover"'+(e.fit==='cover'?' selected':'')+'>꽉 채우기</option></select>')+
        row('모서리','<input type="range" id="ppRadius" min="0" max="40" value="'+(e.radius||0)+'"><span class="pp-num">'+(e.radius||0)+'</span>')+
        row('투명도','<input type="range" id="ppImgOp" min="0" max="100" value="'+Math.round((e.opacity==null?1:e.opacity)*100)+'"><span class="pp-num">'+Math.round((e.opacity==null?1:e.opacity)*100)+'</span>')+
        row('블러','<input type="range" id="ppImgBl" min="0" max="30" value="'+(e.blur||0)+'"><span class="pp-num">'+(e.blur||0)+'</span>')+
        shadowRows(e)+hoverRow(e,false)+
        '<button class="pp-btn" id="ppCrop">✂ 크롭(재단)</button>'+
        '<button class="pp-btn" id="ppReplace">이미지 교체</button>';
    }
    if(e.type==='video'){ h+='<button class="pp-btn" id="ppReplace">영상 교체</button>'+
        row('채움','<select id="ppVFit"><option value="cover"'+(e.fit!=='contain'?' selected':'')+'>꽉 채우기 (기본)</option><option value="contain"'+(e.fit==='contain'?' selected':'')+'>비율 유지</option></select>')+
        '<div class="pp-h" style="margin-top:8px">모서리 둥글기 (px)</div><div class="pp-grid4">'+
        numField('좌상','ppVrtl',e.rtl==null?0:e.rtl)+numField('우상','ppVrtr',e.rtr==null?0:e.rtr)+
        numField('좌하','ppVrbl',e.rbl==null?0:e.rbl)+numField('우하','ppVrbr',e.rbr==null?0:e.rbr)+'</div>'+
        row('반복','<input type="checkbox" id="ppLoop" '+(e.loop?'checked':'')+'>')+
        row('음소거','<input type="checkbox" id="ppMuted" '+(e.muted?'checked':'')+'>'); }
    if(e.type==='tab'){
      h+=row('라벨','<input type="text" id="ppLabel" value="'+esc(e.label||'')+'">')+
        row('버튼색','<input type="color" id="ppTbg" value="'+rgbHex(e.bg||'#1a1a1a')+'">')+
        row('글자색','<input type="color" id="ppTcolor" value="'+rgbHex(e.color||'#ffffff')+'">')+
        row('글자크기','<input type="range" id="ppTsize" min="1" max="8" step="0.2" value="'+(e.size||2.2)+'">')+
        row('글자 방향','<select id="ppTabDir"><option value="h"'+(e.vertical?'':' selected')+'>가로</option><option value="v"'+(e.vertical?' selected':'')+'>세로</option></select>')+
        row('동작','<select id="ppTabAction"><option value="page"'+(e.linkType!=='url'?' selected':'')+'>페이지 이동</option><option value="url"'+(e.linkType==='url'?' selected':'')+'>외부 링크</option></select>')+
        (e.linkType==='url'
          ? row('링크 URL','<input type="text" id="ppTabHref" value="'+esc(e.href||'')+'" placeholder="https://">')
          : row('이동 페이지','<select id="ppTarget">'+S.slides.map(function(s,i){return '<option value="'+i+'"'+((e.target||0)===i?' selected':'')+'>'+(i+1)+'페이지</option>';}).join('')+'</select>'))+
        '<div class="pp-h" style="margin-top:8px">모서리 둥글기 (px)</div><div class="pp-grid4">'+
        numField('좌상','ppRtl',e.rtl==null?8:e.rtl)+numField('우상','ppRtr',e.rtr==null?8:e.rtr)+
        numField('좌하','ppRbl',e.rbl==null?8:e.rbl)+numField('우하','ppRbr',e.rbr==null?8:e.rbr)+
        '</div>'+hoverRow(e,true);
    }
    if(e.type==='box'){
      h+=row('채우기','<select id="ppBoxFill"><option value="solid"'+(e.fillType!=='gradient'?' selected':'')+'>단색</option><option value="gradient"'+(e.fillType==='gradient'?' selected':'')+'>그라데이션</option></select>')+
        row('색상'+(e.fillType==='gradient'?' 1':''),'<input type="color" id="ppBoxC1" value="'+rgbHex(e.color1||'#3b82f6')+'">')+
        (e.fillType==='gradient' ? (
          row('가운데 색 추가','<input type="checkbox" id="ppBox3" '+(e.grad3?'checked':'')+'>')+
          (e.grad3 ? row('색상 2 (가운데)','<input type="color" id="ppBoxC3" value="'+rgbHex(e.color3||'#22d3ee')+'">') : '')+
          row('끝 색상','<select id="ppBoxEnd"><option value="color"'+(e.gradEnd!=='transparent'?' selected':'')+'>'+(e.grad3?'색상 3':'색상 2')+'</option><option value="transparent"'+(e.gradEnd==='transparent'?' selected':'')+'>투명</option></select>')+
          (e.gradEnd==='transparent' ? '' : row(e.grad3?'색상 3 (끝)':'색상 2','<input type="color" id="ppBoxC2" value="'+rgbHex(e.color2||'#8b5cf6')+'">'))+
          row('방향','<input type="range" id="ppBoxAng" min="0" max="360" value="'+(e.gradAngle==null?135:e.gradAngle)+'"><span class="pp-num">'+(e.gradAngle==null?135:e.gradAngle)+'</span>')
        ) : '')+
        rotRow('ppBoxRot',e.rot)+
        row('모서리','<input type="range" id="ppBoxRad" min="0" max="90" value="'+(e.radius||0)+'"><span class="pp-num">'+(e.radius||0)+'</span>')+
        row('투명도','<input type="range" id="ppBoxOp" min="0" max="100" value="'+Math.round((e.opacity==null?1:e.opacity)*100)+'"><span class="pp-num">'+Math.round((e.opacity==null?1:e.opacity)*100)+'</span>')+
        shadowRows(e)+hoverRow(e,true);
    }
    if(e.type==='carousel'){
      var ims=e.images||[];
      h+='<div class="pp-h">슬라이드 이미지 ('+ims.length+')</div><div class="cr-imgs">'+
        ims.map(function(it,i){ var o=crItem(it); return '<div class="cr-img"><img src="'+esc(o.u)+'"><div class="cr-body"><input class="cr-lab" data-crl="'+i+'" value="'+esc(o.label)+'" placeholder="라벨(슬라이드명)"><div class="cr-ic"><button data-cru="'+i+'" title="위로">↑</button><button data-crd="'+i+'" title="아래로">↓</button><button data-crr="'+i+'" title="교체">⟳</button><button data-crx="'+i+'" class="cr-del" title="삭제">✕</button></div></div></div>'; }).join('')+
        '</div><button class="pp-btn" id="ppCrAdd">＋ 이미지 추가</button>'+
        row('효과','<select id="ppCrEff">'+[['coverflow','코버플로우(3D 기울기)'],['slide','슬라이드'],['fade','페이드'],['cards','카드'],['flip','플립'],['cube','큐브']].map(function(o){return '<option value="'+o[0]+'"'+((e.effect||'coverflow')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>')+
        row('슬라이드 맞춤','<select id="ppCrFit">'+[['fit','이미지 크기맞춤 (여백X)'],['contain','비율 유지 (여백 투명)'],['cover','꽉 채우기 (잘림)']].map(function(o){return '<option value="'+o[0]+'"'+((e.imgFit||'fit')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>')+
        (((e.effect||'coverflow')==='coverflow'||e.effect==='slide')&&(e.imgFit||'fit')!=='fit' ? row('동시 노출 개수','<input type="range" id="ppCrPV" min="1" max="5" step="1" value="'+(e.perView||2)+'"><span class="pp-num">'+(e.perView||2)+'</span>') : '')+
        row('슬라이드 여백','<input type="range" id="ppCrSpace" min="0" max="120" value="'+(e.space==null?12:e.space)+'"><span class="pp-val">'+(e.space==null?12:e.space)+'</span>')+
        row('라벨 표시','<input type="checkbox" id="ppCrLabel" '+((e.labelMode||'show')!=='none'?'checked':'')+'>')+
        row('페이지 점 표시','<input type="checkbox" id="ppCrPager" '+((e.pager==null?1:e.pager)?'checked':'')+'>')+
        '<div class="pp-sec"><div class="pp-h">네비 버튼 (이미지 바깥)</div>'+
        row('버튼 배경','<input type="color" id="ppCrNbg" value="'+(e.navBg||'#1a1a1a')+'">')+
        row('화살표 색','<input type="color" id="ppCrNc" value="'+(e.navColor||'#ffffff')+'">')+
        row('버튼 위치','<select id="ppCrNpos">'+[['mid','좌우 측면'],['bottom','하단 밴드'],['top','상단 밴드'],['none','숨김']].map(function(o){return '<option value="'+o[0]+'"'+((e.navPos||'mid')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>')+
        '</div>'+
        row('비활성 어둡게','<input type="checkbox" id="ppCrDim" '+((e.dim==null?1:e.dim)?'checked':'')+'>')+
        row('자동재생','<input type="checkbox" id="ppCrAuto" '+(e.autoplay?'checked':'')+'>')+
        row('반복','<input type="checkbox" id="ppCrLoop" '+(e.loop?'checked':'')+'>');
    }
    if(e.type==='form'){
      var flds=e.fields||{};
      h+=row('제목','<input type="text" id="ppFmTitle" value="'+esc(e.title||'')+'" placeholder="문의하기">')+
        row('수신 이메일','<input type="email" id="ppFmTo" value="'+esc(e.to||'')+'" placeholder="회사 수신 메일">')+
        '<div class="pp-hint">비우면 배포 시 지정한 기본 수신메일로 전송됩니다.</div>'+
        '<div class="pp-sec"><div class="pp-h">입력 항목 (체크=사용, ✱=필수)</div><div class="fm-flds">'+
        FORM_ORDER.map(function(k){ var f=flds[k]||{}; var d=FORM_DEF[k];
          return '<div class="fm-fld">'+
            '<label class="fm-on"><input type="checkbox" data-fmon="'+k+'" '+(f.on===0?'':'checked')+'> '+d.label+'</label>'+
            '<input class="fm-lab" data-fmlabel="'+k+'" value="'+esc(f.label!=null?f.label:d.label)+'" placeholder="라벨">'+
            '<input class="fm-ph" data-fmph="'+k+'" value="'+esc(f.ph!=null?f.ph:d.ph)+'" placeholder="안내문구">'+
            '<label class="fm-req"><input type="checkbox" data-fmreq="'+k+'" '+(f.req?'checked':'')+'> 필수</label>'+
          '</div>'; }).join('')+
        '</div></div>'+
        '<div class="pp-sec"><div class="pp-h">스타일</div>'+
        row('배경색','<input type="color" id="ppFmBg" value="'+rgbHex(e.bg||'#ffffff')+'">')+
        row('라벨색','<input type="color" id="ppFmLc" value="'+rgbHex(e.labelColor||'#333333')+'">')+
        row('모서리','<input type="range" id="ppFmRad" min="0" max="40" value="'+(e.radius==null?12:e.radius)+'"><span class="pp-num">'+(e.radius==null?12:e.radius)+'</span>')+
        row('버튼 문구','<input type="text" id="ppFmBtn" value="'+esc(e.btnText||'보내기')+'">')+
        row('버튼 배경','<input type="color" id="ppFmBbg" value="'+rgbHex(e.btnBg||'#1a1a1a')+'">')+
        row('버튼 글자','<input type="color" id="ppFmBc" value="'+rgbHex(e.btnColor||'#ffffff')+'">')+
        '</div>';
    }
    var addFieldsRow='<div class="pp-sec"><div class="pp-h">＋ 입력칸 추가</div><div class="fm-add">'+
      FORM_ORDER.map(function(k){ return '<button type="button" class="pp-btn sm" data-addfield="'+k+'">'+FORM_DEF[k].label+'</button>'; }).join('')+'</div></div>';
    if(e.type==='field'){
      var fd=FORM_DEF[e.fk]||{label:'입력'};
      h+='<div class="pp-hint" style="margin-bottom:8px">종류: <b>'+esc(fd.label)+'</b></div>'+
        row('라벨','<input type="text" id="ppFdLabel" value="'+esc(e.label!=null?e.label:fd.label)+'">')+
        row('라벨 표시','<input type="checkbox" id="ppFdLabelShow" '+(e.labelShow!==0?'checked':'')+'>')+
        row('안내문구','<input type="text" id="ppFdPh" value="'+esc(e.ph!=null?e.ph:'')+'" placeholder="placeholder">')+
        row('필수','<input type="checkbox" id="ppFdReq" '+(e.req?'checked':'')+'>')+
        row('글꼴',fontSel('ppFdFamily',e.family))+
        row('글자색','<input type="color" id="ppFdColor" value="'+rgbHex(e.color||'#333333')+'">')+
        row('라벨색','<input type="color" id="ppFdLabelColor" value="'+rgbHex(e.labelColor||'#333333')+'">')+
        row('글자 크기(px)','<input type="range" id="ppFdSize" min="0.5" max="12" step="0.1" value="'+(e.size||2.2)+'"><input type="number" id="ppFdSizePx" class="pp-numin" min="5" max="200" value="'+Math.round((e.size||2.2)*10)+'">')+
        row('입력칸 배경','<input type="color" id="ppFdBg" value="'+rgbHex(e.bg==='transparent'?'#ffffff':(e.bg||'#ffffff'))+'">')+
        row('배경 투명','<input type="checkbox" id="ppFdTrans" '+(e.bg==='transparent'?'checked':'')+'>')+
        row('모서리','<input type="range" id="ppFdRad" min="0" max="30" value="'+(e.radius==null?8:e.radius)+'"><span class="pp-num">'+(e.radius==null?8:e.radius)+'</span>')+
        addFieldsRow;
    }
    if(e.type==='submit'){
      h+=row('버튼 문구','<input type="text" id="ppSbText" value="'+esc(e.text||'보내기')+'">')+
        row('배경색','<input type="color" id="ppSbBg" value="'+rgbHex(e.bg==='transparent'?'#1a1a1a':(e.bg||'#1a1a1a'))+'">')+
        row('배경 투명','<input type="checkbox" id="ppSbTrans" '+(e.bg==='transparent'?'checked':'')+'>')+
        row('글자색','<input type="color" id="ppSbColor" value="'+rgbHex(e.color||'#ffffff')+'">')+
        row('글꼴',fontSel('ppSbFamily',e.family))+
        row('글자 크기(px)','<input type="range" id="ppSbSize" min="0.5" max="12" step="0.1" value="'+(e.size||2.4)+'"><input type="number" id="ppSbSizePx" class="pp-numin" min="5" max="200" value="'+Math.round((e.size||2.4)*10)+'">')+
        row('모서리','<input type="range" id="ppSbRad" min="0" max="40" value="'+(e.radius==null?8:e.radius)+'"><span class="pp-num">'+(e.radius==null?8:e.radius)+'</span>')+
        row('수신 이메일','<input type="email" id="ppSbTo" value="'+esc(e.to||'')+'" placeholder="회사 수신 메일">')+
        '<div class="pp-hint">비우면 배포 시 지정한 기본 수신메일로 전송됩니다.</div>'+
        addFieldsRow;
    }
    // 공통: 위치·크기(수치) + AOS + z + 복제/삭제
    h+='<div class="pp-sec"><div class="pp-h">위치·크기 (%)</div><div class="pp-grid4">'+
      numField('X','ppX',e.x)+numField('Y','ppY',e.y)+numField('W','ppW',e.w)+numField('H','ppH',e.h)+
      '</div></div>'+
      '<div class="pp-sec"><div class="pp-h">애니메이션 (AOS)</div>'+
      '<select id="ppAos"><option value="">없음</option>'+
      ['fade-up:위로','fade-down:아래로','fade-left:왼쪽','fade-right:오른쪽'].map(function(o){var v=o.split(':'); return '<option value="'+v[0]+'"'+(e.aos===v[0]?' selected':'')+'>'+v[1]+'</option>';}).join('')+
      '</select>'+
      (e.aos ? (row('순서','<input type="number" id="ppAosOrder" class="pp-numin" min="0" max="999" value="'+(e.aosOrder||0)+'">')+
                row('딜레이(ms)','<input type="number" id="ppAosDelay" class="pp-numin" min="0" max="10000" step="50" value="'+(e.aosDelay||0)+'">')+
                '<p class="pp-hint">순서 작은 것부터 재생. 딜레이는 슬라이드 열린 뒤 이 요소가 시작하기까지 대기(ms). 딜레이 0이면 순서대로 90ms 간격 자동.</p>') : '')+
      '</div>'+
      '<div class="pp-order"><button id="ppFront">맨 앞으로</button><button id="ppBack">맨 뒤로</button></div>'+
      '<button class="pp-btn" id="ppDup">📋 요소 복제</button>'+
      '<button class="pp-del" id="ppDel">요소 삭제</button>';
    elProps.innerHTML=h;
    bindProps(e);
    enhanceColors();
  }
  // 모든 색상 선택기 옆에 hex 코드 입력칸 자동 추가(RGB 대신 코드로 입력)
  function enhanceColors(){
    elProps.querySelectorAll('input[type="color"]').forEach(function(ci){
      if(ci.dataset.hexed) return; ci.dataset.hexed='1';
      var tx=document.createElement('input'); tx.type='text'; tx.className='pp-hex'; tx.value=ci.value; tx.maxLength=7; tx.spellcheck=false; tx.setAttribute('aria-label','색상코드');
      ci.insertAdjacentElement('afterend', tx);
      tx.addEventListener('input',function(){ var v=tx.value.trim(); if(v&&v[0]!=='#')v='#'+v; if(/^#[0-9a-fA-F]{6}$/.test(v)){ ci.value=v; ci.dispatchEvent(new Event('input',{bubbles:true})); } });
      ci.addEventListener('input',function(){ tx.value=ci.value; });
    });
  }
  function row(l,c){ return '<div class="pp-row"><label>'+l+'</label><div class="pp-ctl">'+c+'</div></div>'; }
  function rotRow(id,val){ val=val||0; return row('회전(°)','<input type="range" id="'+id+'" min="-180" max="180" value="'+val+'"><input type="number" id="'+id+'N" class="pp-numin" min="-180" max="180" value="'+val+'">'); }
  function numField(l,id,v){ return '<div class="pp-nf"><span>'+l+'</span><input type="number" step="0.1" id="'+id+'" value="'+(Math.round((v||0)*10)/10)+'"></div>'; }
  function shadowRows(e){ return row('그림자','<input type="checkbox" id="ppShadow" '+(e.shadow?'checked':'')+'>')+
    (e.shadow?(row('그림자 강도','<input type="range" id="ppShadowB" min="0" max="90" value="'+(e.shadowBlur||24)+'"><span class="pp-num">'+(e.shadowBlur||24)+'</span>')+row('그림자 색','<input type="color" id="ppShadowC" value="'+(e.shadowColor||'#000000')+'">')):''); }
  function hoverRow(e, allowColor){
    var opt='<option value="none"'+(!e.hover||e.hover==='none'?' selected':'')+'>없음</option>'+
      '<option value="scale"'+(e.hover==='scale'?' selected':'')+'>확대</option>'+
      (allowColor?('<option value="color"'+(e.hover==='color'?' selected':'')+'>색상 전환</option>'):'');
    return row('호버 효과','<select id="ppHover">'+opt+'</select>')+
      ((allowColor && e.hover==='color')?(row('호버 배경','<input type="color" id="ppHoverBg" value="'+(e.hoverBg||'#ffffff')+'">')+row('호버 글자색','<input type="color" id="ppHoverC" value="'+(e.hoverColor||'#000000')+'">')):''); }
  function bindShadowHover(e){
    var s=document.getElementById('ppShadow'); if(s) s.addEventListener('change',function(){ e.shadow=s.checked?1:0; renderCanvas(); renderProps(); markDirty(); });
    var sb=document.getElementById('ppShadowB'); if(sb) sb.addEventListener('input',function(){ e.shadowBlur=+sb.value; sb.nextSibling.textContent=sb.value; renderCanvas(); markDirty(); });
    var sc=document.getElementById('ppShadowC'); if(sc) sc.addEventListener('input',function(){ e.shadowColor=sc.value; renderCanvas(); markDirty(); });
    var hv=document.getElementById('ppHover'); if(hv) hv.addEventListener('change',function(){ e.hover=hv.value; markDirty(); renderProps(); });
    var hb=document.getElementById('ppHoverBg'); if(hb) hb.addEventListener('input',function(){ e.hoverBg=hb.value; markDirty(); });
    var hc=document.getElementById('ppHoverC'); if(hc) hc.addEventListener('input',function(){ e.hoverColor=hc.value; markDirty(); });
  }
  function fmtBar(){ return '<div class="pp-fmt"><button data-cmd="bold"><b>B</b></button><button data-cmd="italic"><i>I</i></button>'+
      '<button data-cmd="underline"><u>U</u></button><input type="color" id="ppFore" title="선택 글자 색">'+
      '<button data-link="1" title="링크 삽입">🔗</button><button data-unlink="1" title="링크 제거">⛔</button>'+
      '<button data-picker="1" title="이모지·아이콘">😀</button>'+
      '<span class="pp-hint">글자 드래그 후 적용</span></div>'; }
  var EMOJIS=['😀','😊','😍','🥰','😎','🎉','❤️','🔥','✨','⭐','✅','❗','❓','💡','📌','📍','📞','✉️','🛒','🚀','👍','🙏','💯','🎁','🏆','⏰','📢','🔖','💬','☀️','🌙','🍀','🌈','💰','🕒','📦'];
  var FAICONS=['fa-solid fa-phone','fa-solid fa-envelope','fa-solid fa-location-dot','fa-solid fa-check','fa-solid fa-circle-check','fa-solid fa-star','fa-solid fa-heart','fa-solid fa-house','fa-solid fa-cart-shopping','fa-solid fa-arrow-right','fa-solid fa-arrow-down','fa-solid fa-angle-right','fa-solid fa-clock','fa-solid fa-gift','fa-solid fa-fire','fa-solid fa-thumbs-up','fa-solid fa-crown','fa-solid fa-bell','fa-solid fa-tag','fa-solid fa-truck','fa-solid fa-gear','fa-solid fa-magnifying-glass','fa-brands fa-instagram','fa-brands fa-youtube','fa-brands fa-facebook','fa-brands fa-x-twitter'];
  function pickerPalette(){
    return '<div class="pp-picker" id="ppPicker" style="display:none">'+
      '<div class="pk-row">'+EMOJIS.map(function(x){return '<button type="button" class="pk-emo" data-emo="'+x+'">'+x+'</button>';}).join('')+'</div>'+
      '<div class="pk-row">'+FAICONS.map(function(c){return '<button type="button" class="pk-ico" data-ico="'+c+'"><i class="'+c+'"></i></button>';}).join('')+'</div>'+
    '</div>'; }
  function alignBtns(a){ return ['left:≡','center:≡','right:≡'].map(function(x){var v=x.split(':'); return '<button class="pp-al'+(a===v[0]?' on':'')+'" data-al="'+v[0]+'">'+v[0][0].toUpperCase()+'</button>';}).join(''); }
  var FONTS=[['','기본(프레텐다드)'],['Pretendard','프레텐다드'],['Paperlogy','페이퍼로지'],['Gmarket Sans','지마켓산스'],['S-Core Dream','에스코어드림'],['SUIT','수트'],['Noto Sans KR','노토산스'],['Nanum Square','나눔스퀘어'],['Black Han Sans','검은고딕'],['Poppins','포핀스'],['Nanum Pen Script','나눔손글씨펜'],['Nanum Myeongjo','나눔명조']];
  function fontSelect(f){ return '<select id="ppFamily">'+FONTS.map(function(o){return '<option value="'+o[0]+'"'+(f===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>'; }
  function fontSel(id,f){ return '<select id="'+id+'">'+FONTS.map(function(o){return '<option value="'+o[0]+'"'+((f||'')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>'; }
  var WEIGHTS=[[100,'가장 얇게'],[300,'얇게'],[400,'보통'],[500,'중간'],[600,'세미볼드'],[700,'굵게'],[800,'매우 굵게'],[900,'블랙']];
  function weightSelect(w){ w=w||400; return '<select id="ppWeight">'+WEIGHTS.map(function(o){return '<option value="'+o[0]+'"'+(w===o[0]?' selected':'')+'>'+o[1]+' ('+o[0]+')</option>';}).join('')+'</select>'; }
  function rgbHex(c){ if(!c) return '#111111'; if(c[0]==='#'){ if(c.length===4) return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]; return c.slice(0,7);} return '#111111'; }

  function bindProps(e){
    function on(id,ev,fn){ var el=document.getElementById(id); if(el) el.addEventListener(ev,fn); }
    function bindRot(id){ var r=document.getElementById(id), n=document.getElementById(id+'N');
      function set(v){ v=Math.max(-180,Math.min(180,Math.round(+v||0))); e.rot=v; if(r)r.value=v; if(n)n.value=v; renderCanvas(); markDirty(); }
      if(r) r.addEventListener('input',function(){ set(r.value); }); if(n) n.addEventListener('input',function(){ set(n.value); }); }
    // 텍스트 서식 (선택영역)
    elProps.querySelectorAll('.pp-fmt [data-cmd]').forEach(function(b){ b.addEventListener('mousedown',function(ev){ ev.preventDefault(); document.execCommand(b.dataset.cmd,false,null); syncText(); }); });
    on('ppFore','input',function(ev){ document.execCommand('foreColor',false,ev.target.value); syncText(); });
    elProps.querySelectorAll('.pp-fmt [data-link]').forEach(function(b){ b.addEventListener('mousedown',function(ev){ ev.preventDefault();
      var url=prompt('링크 주소를 입력하세요 (http:// 또는 https://)','https://');
      if(url && /^https?:\/\//i.test(url)){ restoreRange(); document.execCommand('createLink',false,url); syncText(); }
      else if(url){ alert('http:// 또는 https:// 로 시작해야 합니다.'); } }); });
    elProps.querySelectorAll('.pp-fmt [data-unlink]').forEach(function(b){ b.addEventListener('mousedown',function(ev){ ev.preventDefault(); restoreRange(); document.execCommand('unlink',false,null); syncText(); }); });
    // 이모지·아이콘 팔레트
    elProps.querySelectorAll('.pp-fmt [data-picker]').forEach(function(b){ b.addEventListener('mousedown',function(ev){ ev.preventDefault(); var p=document.getElementById('ppPicker'); if(p) p.style.display=(p.style.display==='none'?'block':'none'); }); });
    elProps.querySelectorAll('.pk-emo').forEach(function(b){ b.addEventListener('mousedown',function(ev){ ev.preventDefault(); insertIntoText(b.dataset.emo); }); });
    elProps.querySelectorAll('.pk-ico').forEach(function(b){ b.addEventListener('mousedown',function(ev){ ev.preventDefault(); insertIntoText('<i class="'+b.dataset.ico+'"></i> '); }); });
    on('ppSize','input',function(ev){ e.size=+ev.target.value; var px=document.getElementById('ppSizePx'); if(px)px.value=Math.round(e.size*10); liveStyle(); markDirty(); });   // px = cqw×10 (설계기준 1000px)
    on('ppSizePx','input',function(ev){ var px=Math.max(5,Math.min(400,+ev.target.value||0)); e.size=Math.round(px/10*10)/10; var sl=document.getElementById('ppSize'); if(sl)sl.value=e.size; liveStyle(); markDirty(); });
    on('ppColor','input',function(ev){ e.color=ev.target.value; liveStyle(); markDirty(); });
    on('ppLs','input',function(ev){ e.ls=+ev.target.value; ev.target.nextSibling.textContent=e.ls; liveStyle(); markDirty(); });
    on('ppLh','input',function(ev){ e.lh=+ev.target.value; ev.target.nextSibling.textContent=e.lh; liveStyle(); markDirty(); });
    on('ppTxtOp','input',function(ev){ e.opacity=(+ev.target.value)/100; ev.target.nextSibling.textContent=ev.target.value; liveStyle(); markDirty(); });
    bindRot('ppTxtRot');
    elProps.querySelectorAll('[data-al]').forEach(function(b){ b.addEventListener('click',function(){ e.align=b.dataset.al; renderProps(); liveStyle(); markDirty(); }); });
    on('ppFamily','change',function(ev){ e.family=ev.target.value; liveStyle(); markDirty(); });
    on('ppWeight','change',function(ev){ var w=+ev.target.value;
      var ed=elCanvas.querySelector('.el.sel.editing .el-text');
      if(ed && restoreRange() && !window.getSelection().isCollapsed){ applyWeightToSelection(w); syncText(); }  // 드래그한 부분만
      else { e.fw=w; liveStyle(); markDirty(); }   // 편집 안 하거나 선택 없으면 전체
    });
    on('ppFit','change',function(ev){ e.fit=ev.target.value; renderCanvas(); markDirty(); });
    on('ppRadius','input',function(ev){ e.radius=+ev.target.value; ev.target.nextSibling.textContent=e.radius; renderCanvas(); markDirty(); });
    on('ppReplace','click',function(){ uploadFor(e); });
    on('ppCrop','click',function(){ openCrop(e); });
    on('ppImgOp','input',function(ev){ e.opacity=(+ev.target.value)/100; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    on('ppImgBl','input',function(ev){ e.blur=+ev.target.value; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    on('ppLoop','change',function(ev){ e.loop=ev.target.checked?1:0; markDirty(); });
    on('ppMuted','change',function(ev){ e.muted=ev.target.checked?1:0; markDirty(); });
    on('ppVFit','change',function(ev){ e.fit=ev.target.value; renderCanvas(); markDirty(); });
    on('ppVrtl','input',function(ev){ e.rtl=+ev.target.value||0; renderCanvas(); markDirty(); });
    on('ppVrtr','input',function(ev){ e.rtr=+ev.target.value||0; renderCanvas(); markDirty(); });
    on('ppVrbl','input',function(ev){ e.rbl=+ev.target.value||0; renderCanvas(); markDirty(); });
    on('ppVrbr','input',function(ev){ e.rbr=+ev.target.value||0; renderCanvas(); markDirty(); });
    on('ppLabel','input',function(ev){ e.label=ev.target.value; renderCanvas(); markDirty(); });
    on('ppTbg','input',function(ev){ e.bg=ev.target.value; renderCanvas(); markDirty(); });
    on('ppTcolor','input',function(ev){ e.color=ev.target.value; renderCanvas(); markDirty(); });
    on('ppTsize','input',function(ev){ e.size=+ev.target.value; renderCanvas(); markDirty(); });
    on('ppTarget','change',function(ev){ e.target=+ev.target.value; markDirty(); });
    on('ppTabDir','change',function(ev){ e.vertical=ev.target.value==='v'?1:0; renderCanvas(); markDirty(); });
    on('ppTabAction','change',function(ev){ e.linkType=ev.target.value; markDirty(); renderProps(); });
    on('ppTabHref','input',function(ev){ e.href=ev.target.value; markDirty(); });
    // 색상박스
    on('ppBoxFill','change',function(ev){ e.fillType=ev.target.value; renderCanvas(); renderProps(); markDirty(); });
    on('ppBoxC1','input',function(ev){ e.color1=ev.target.value; renderCanvas(); markDirty(); });
    on('ppBoxC2','input',function(ev){ e.color2=ev.target.value; renderCanvas(); markDirty(); });
    on('ppBoxAng','input',function(ev){ e.gradAngle=+ev.target.value; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    on('ppBoxEnd','change',function(ev){ e.gradEnd=ev.target.value; renderCanvas(); renderProps(); markDirty(); });
    on('ppBox3','change',function(ev){ e.grad3=ev.target.checked?1:0; renderCanvas(); renderProps(); markDirty(); });
    on('ppBoxC3','input',function(ev){ e.color3=ev.target.value; renderCanvas(); markDirty(); });
    bindRot('ppBoxRot');
    // 선(line)
    on('ppLnColor','input',function(ev){ e.color=ev.target.value; renderCanvas(); markDirty(); });
    on('ppLnThick','input',function(ev){ e.thick=+ev.target.value; ev.target.nextSibling.textContent=e.thick; renderCanvas(); markDirty(); });
    on('ppLnStyle','change',function(ev){ e.lineStyle=ev.target.value; renderCanvas(); markDirty(); });
    on('ppLnOp','input',function(ev){ e.opacity=(+ev.target.value)/100; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    bindRot('ppLnRot');
    // 캐러셀(상장)
    on('ppCrAdd','click',function(){ uploadCarousel(e); });
    on('ppCrEff','change',function(ev){ e.effect=ev.target.value; renderCanvas(); renderProps(); markDirty(); });
    on('ppCrFit','change',function(ev){ e.imgFit=ev.target.value; renderCanvas(); renderProps(); markDirty(); });
    on('ppCrPV','input',function(ev){ e.perView=+ev.target.value; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    on('ppCrAuto','change',function(ev){ e.autoplay=ev.target.checked?1:0; renderCanvas(); markDirty(); });
    on('ppCrLoop','change',function(ev){ e.loop=ev.target.checked?1:0; renderCanvas(); markDirty(); });
    on('ppCrSpace','input',function(ev){ ev.target.nextSibling.textContent=ev.target.value; });
    on('ppCrSpace','change',function(ev){ e.space=+ev.target.value; renderCanvas(); markDirty(); });
    on('ppCrLabel','change',function(ev){ e.labelMode=ev.target.checked?'show':'none'; renderCanvas(); markDirty(); });
    on('ppCrPager','change',function(ev){ e.pager=ev.target.checked?1:0; renderCanvas(); markDirty(); });
    on('ppCrNpos','change',function(ev){ e.navPos=ev.target.value; renderCanvas(); markDirty(); });
    on('ppCrDim','change',function(ev){ e.dim=ev.target.checked?1:0; renderCanvas(); markDirty(); });
    on('ppCrNbg','input',function(ev){ e.navBg=ev.target.value; var sw=elCanvas.querySelector('.el.sel .el-swiper'); if(sw)sw.style.setProperty('--navbg',e.navBg); markDirty(); });
    on('ppCrNc','input',function(ev){ e.navColor=ev.target.value; var sw=elCanvas.querySelector('.el.sel .el-swiper'); if(sw)sw.style.setProperty('--navcolor',e.navColor); markDirty(); });
    elProps.querySelectorAll('[data-crl]').forEach(function(inp){ var ix=+inp.dataset.crl;
      inp.addEventListener('input',function(){ e.images[ix]=crItem(e.images[ix]); e.images[ix].label=inp.value; markDirty(); });
      inp.addEventListener('change',function(){ renderCanvas(); }); });
    elProps.querySelectorAll('[data-cru]').forEach(function(b){ b.addEventListener('click',function(){ crMove(e,+b.dataset.cru,-1); }); });
    elProps.querySelectorAll('[data-crd]').forEach(function(b){ b.addEventListener('click',function(){ crMove(e,+b.dataset.crd,1); }); });
    elProps.querySelectorAll('[data-crr]').forEach(function(b){ b.addEventListener('click',function(){ uploadCarousel(e,+b.dataset.crr); }); });
    elProps.querySelectorAll('[data-crx]').forEach(function(b){ b.addEventListener('click',function(){ e.images.splice(+b.dataset.crx,1); markDirty(); renderCanvas(); renderProps(); }); });
    // 메일폼(문의)
    function fmFld(k){ e.fields=e.fields||{}; if(!e.fields[k]) e.fields[k]={on:1,label:FORM_DEF[k].label,ph:FORM_DEF[k].ph,req:0}; return e.fields[k]; }
    on('ppFmTitle','input',function(ev){ e.title=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFmTo','input',function(ev){ e.to=ev.target.value; markDirty(); });
    on('ppFmBg','input',function(ev){ e.bg=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFmLc','input',function(ev){ e.labelColor=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFmRad','input',function(ev){ e.radius=+ev.target.value; ev.target.nextSibling.textContent=e.radius; renderCanvas(); markDirty(); });
    on('ppFmBtn','input',function(ev){ e.btnText=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFmBbg','input',function(ev){ e.btnBg=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFmBc','input',function(ev){ e.btnColor=ev.target.value; renderCanvas(); markDirty(); });
    elProps.querySelectorAll('[data-fmon]').forEach(function(c){ c.addEventListener('change',function(){ fmFld(c.dataset.fmon).on=c.checked?1:0; renderCanvas(); markDirty(); }); });
    elProps.querySelectorAll('[data-fmreq]').forEach(function(c){ c.addEventListener('change',function(){ fmFld(c.dataset.fmreq).req=c.checked?1:0; renderCanvas(); markDirty(); }); });
    elProps.querySelectorAll('[data-fmlabel]').forEach(function(i){ i.addEventListener('input',function(){ fmFld(i.dataset.fmlabel).label=i.value; markDirty(); }); i.addEventListener('change',renderCanvas); });
    elProps.querySelectorAll('[data-fmph]').forEach(function(i){ i.addEventListener('input',function(){ fmFld(i.dataset.fmph).ph=i.value; markDirty(); }); i.addEventListener('change',renderCanvas); });
    // 개별 입력칸(field)
    on('ppFdLabel','input',function(ev){ e.label=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFdLabelShow','change',function(ev){ e.labelShow=ev.target.checked?1:0; renderCanvas(); markDirty(); });
    on('ppFdPh','input',function(ev){ e.ph=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFdReq','change',function(ev){ e.req=ev.target.checked?1:0; renderCanvas(); markDirty(); });
    on('ppFdFamily','change',function(ev){ e.family=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFdColor','input',function(ev){ e.color=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFdLabelColor','input',function(ev){ e.labelColor=ev.target.value; renderCanvas(); markDirty(); });
    on('ppFdSize','input',function(ev){ e.size=+ev.target.value; var px=document.getElementById('ppFdSizePx'); if(px)px.value=Math.round(e.size*10); renderCanvas(); markDirty(); });
    on('ppFdSizePx','input',function(ev){ var px=Math.max(5,Math.min(200,+ev.target.value||0)); e.size=px/10; var sl=document.getElementById('ppFdSize'); if(sl)sl.value=e.size; renderCanvas(); markDirty(); });
    on('ppFdBg','input',function(ev){ if(e.bg!=='transparent'){ e.bg=ev.target.value; renderCanvas(); markDirty(); } });
    on('ppFdTrans','change',function(ev){ e.bg=ev.target.checked?'transparent':(document.getElementById('ppFdBg')?document.getElementById('ppFdBg').value:'#ffffff'); renderCanvas(); markDirty(); });
    on('ppFdRad','input',function(ev){ e.radius=+ev.target.value; ev.target.nextSibling.textContent=e.radius; renderCanvas(); markDirty(); });
    // 전송 버튼(submit)
    on('ppSbText','input',function(ev){ e.text=ev.target.value; renderCanvas(); markDirty(); });
    on('ppSbBg','input',function(ev){ if(e.bg!=='transparent'){ e.bg=ev.target.value; renderCanvas(); markDirty(); } });
    on('ppSbTrans','change',function(ev){ e.bg=ev.target.checked?'transparent':(document.getElementById('ppSbBg')?document.getElementById('ppSbBg').value:'#1a1a1a'); renderCanvas(); markDirty(); });
    on('ppSbColor','input',function(ev){ e.color=ev.target.value; renderCanvas(); markDirty(); });
    on('ppSbFamily','change',function(ev){ e.family=ev.target.value; renderCanvas(); markDirty(); });
    on('ppSbSize','input',function(ev){ e.size=+ev.target.value; var px=document.getElementById('ppSbSizePx'); if(px)px.value=Math.round(e.size*10); renderCanvas(); markDirty(); });
    on('ppSbSizePx','input',function(ev){ var px=Math.max(5,Math.min(200,+ev.target.value||0)); e.size=px/10; var sl=document.getElementById('ppSbSize'); if(sl)sl.value=e.size; renderCanvas(); markDirty(); });
    on('ppSbRad','input',function(ev){ e.radius=+ev.target.value; ev.target.nextSibling.textContent=e.radius; renderCanvas(); markDirty(); });
    on('ppSbTo','input',function(ev){ e.to=ev.target.value; markDirty(); });
    elProps.querySelectorAll('[data-addfield]').forEach(function(b){ b.addEventListener('click',function(){ addField(b.dataset.addfield); }); });
    on('ppBoxRad','input',function(ev){ e.radius=+ev.target.value; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    on('ppBoxOp','input',function(ev){ e.opacity=(+ev.target.value)/100; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    // 텍스트 그라데이션
    on('ppTextFill','change',function(ev){ e.textFill=ev.target.value; renderCanvas(); renderProps(); markDirty(); });
    on('ppGc1','input',function(ev){ e.gc1=ev.target.value; renderCanvas(); markDirty(); });
    on('ppGc2','input',function(ev){ e.gc2=ev.target.value; renderCanvas(); markDirty(); });
    on('ppTg3','change',function(ev){ e.tgrad3=ev.target.checked?1:0; renderCanvas(); renderProps(); markDirty(); });
    on('ppGc3','input',function(ev){ e.gc3=ev.target.value; renderCanvas(); markDirty(); });
    on('ppGang','input',function(ev){ e.gAngle=+ev.target.value; ev.target.nextSibling.textContent=ev.target.value; renderCanvas(); markDirty(); });
    bindShadowHover(e);   // 그림자·호버 (box·image·tab 공용)
    ['Rtl:rtl','Rtr:rtr','Rbr:rbr','Rbl:rbl'].forEach(function(m){ var p=m.split(':'); on('pp'+p[0],'input',function(ev){ var v=parseFloat(ev.target.value); e[p[1]]=isNaN(v)?0:Math.max(0,Math.min(100,v)); renderCanvas(); markDirty(); }); });
    on('ppAos','change',function(ev){ e.aos=ev.target.value; renderProps(); markDirty(); });
    on('ppAosOrder','input',function(ev){ e.aosOrder=Math.max(0,Math.min(999,parseInt(ev.target.value)||0)); markDirty(); });
    on('ppAosDelay','input',function(ev){ e.aosDelay=Math.max(0,Math.min(10000,parseInt(ev.target.value)||0)); markDirty(); });
    on('ppFront','click',function(){ e.z=maxZ()+1; renderCanvas(); markDirty(); });
    on('ppBack','click',function(){ e.z=minZ()-1; renderCanvas(); markDirty(); });
    on('ppDup','click',function(){ duplicateEl(); });
    on('ppDel','click',function(){ delEl(e.id); });
    // 위치·크기 수치 입력
    ['X:x','Y:y','W:w','H:h'].forEach(function(m){ var p=m.split(':');
      on('pp'+p[0],'input',function(ev){ var val=parseFloat(ev.target.value); if(isNaN(val))return; e[p[1]]=Math.round(val*10)/10; positionSel(e); markDirty(); renderSlides(); });
    });
  }
  // 드래그/리사이즈 중 수치 입력 동기화
  function syncBoxInputs(e){ [['ppX','x'],['ppY','y'],['ppW','w'],['ppH','h']].forEach(function(p){ var el=document.getElementById(p[0]); if(el&&document.activeElement!==el) el.value=Math.round((e[p[1]]||0)*10)/10; }); }
  // 선택 요소 복제 (모든 스타일 유지)
  function duplicateEl(){ var e=selEl(); if(!e)return; var c=JSON.parse(JSON.stringify(e)); c.id=uid();
    c.x=Math.min(95,(e.x||0)+3); c.y=Math.min(95,(e.y||0)+3); c.z=maxZ()+1;
    cur().elements.push(c); selSet([c.id]); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
  function maxZ(){ return cur().elements.reduce(function(m,e){return Math.max(m,e.z||1);},1); }
  function minZ(){ return cur().elements.reduce(function(m,e){return Math.min(m,e.z||1);},1); }
  // 선택된 텍스트 요소만 스타일 갱신(리렌더 없이)
  function liveStyle(){ var d=elCanvas.querySelector('.el.sel .el-text'); var e=selEl(); if(!d||!e)return;
    d.style.fontSize=(e.size||3)+'cqw'; if(e.textFill!=='gradient') d.style.color=e.color; d.style.textAlign=e.align; d.style.fontWeight=e.fw||400; d.style.fontFamily=e.family?("'"+e.family+"',sans-serif"):'';
    d.style.letterSpacing=(e.ls?e.ls+'em':''); d.style.lineHeight=(e.lh==null?1.25:e.lh); d.style.transform=(e.rot?'rotate('+e.rot+'deg)':''); d.style.opacity=(e.opacity==null?1:e.opacity); }
  function syncText(){ var d=elCanvas.querySelector('.el.sel .el-text'); var e=selEl(); if(d&&e){ e.html=d.innerHTML; markDirty(); } }

  // ── 요소 추가 ─────────────────────────────────────────────
  function addEl(type){
    if(type==='form'){ addFormSet(); return; }   // 문의폼 = 개별 입력칸 + 전송버튼 세트(각각 이동/스타일)
    var e={id:uid(),type:type,x:30,y:35,w:40,h:20,z:maxZ()+1,aos:''};
    if(type==='text'){ e.html='텍스트를 입력하세요'; e.size=4; e.color='#111111'; e.align='left'; e.h=12; }
    if(type==='image'){ e.src=''; e.fit='contain'; }
    if(type==='video'){ e.src=''; e.fit='cover'; e.muted=1; e.loop=1; e.rtl=0; e.rtr=0; e.rbr=0; e.rbl=0; }
    if(type==='tab'){ e.label='메뉴'; e.bg='#1a1a1a'; e.color='#ffffff'; e.size=2.2; e.target=0; e.w=18; e.h=8; e.rtl=8; e.rtr=8; e.rbr=8; e.rbl=8; }
    if(type==='line'){ e.color='#1a1a1a'; e.thick=3; e.lineStyle='solid'; e.opacity=1; e.rot=0; e.w=40; e.h=6; }
    if(type==='box'){ e.fillType='solid'; e.color1='#3b82f6'; e.color2='#8b5cf6'; e.gradEnd='color'; e.gradAngle=135; e.radius=10; e.opacity=1; e.shadow=0; e.shadowBlur=24; e.shadowColor='#000000'; e.hover='none'; e.w=30; e.h=20; }
    if(type==='carousel'){ e.images=[]; e.effect='coverflow'; e.imgFit='fit'; e.perView=2; e.autoplay=0; e.loop=1; e.space=12; e.labelMode='show'; e.pager=1; e.navBg='#1a1a1a'; e.navColor='#ffffff'; e.navPos='mid'; e.dim=1; e.w=60; e.h=45; }
    if(type==='form'){ e.title='문의하기'; e.to=''; e.btnText='보내기'; e.btnBg='#1a1a1a'; e.btnColor='#ffffff'; e.bg='#ffffff'; e.radius=12; e.labelColor='#333333';
      e.fields={ name:{on:1,label:'이름',ph:'이름',req:1}, company:{on:1,label:'회사명',ph:'회사명',req:0}, phone:{on:1,label:'전화번호',ph:'010-0000-0000',req:0}, email:{on:1,label:'이메일',ph:'you@example.com',req:1}, message:{on:1,label:'내용',ph:'문의 내용을 입력하세요',req:1} };
      e.w=36; e.h=60; }
    cur().elements.push(e); selSet([e.id]); markDirty(); renderCanvas(); renderProps();
    if(type==='image'||type==='video') uploadFor(e);
    if(type==='carousel') uploadCarousel(e);
  }
  function delEl(id){ var s=cur(); s.elements=s.elements.filter(function(e){return e.id!==id;}); selClear(); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
  document.querySelectorAll('[data-add]').forEach(function(b){ b.addEventListener('click',function(){ addEl(b.dataset.add); }); });

  // ── 업로드 ────────────────────────────────────────────────
  var uploadTarget=null;
  function uploadFor(e){ uploadTarget=e; elFile.accept = e.type==='video'?'video/mp4':'image/*'; elFile.value=''; elFile.click(); }
  function uploadOuter(){ uploadTarget={outer:true}; elFile.accept='image/*'; elFile.value=''; elFile.click(); }
  function uploadCarousel(e,idx){ uploadTarget={carousel:e, idx:(idx==null?-1:idx)}; elFile.accept='image/*'; elFile.value=''; elFile.click(); }
  function crMove(e,i,d){ var j=i+d; if(j<0||j>=e.images.length)return; var t=e.images[i]; e.images[i]=e.images[j]; e.images[j]=t; markDirty(); renderCanvas(); renderProps(); }
  function applyOuter(){
    if(!elStage) return;
    elStage.style.background = S.outerBg || '#f1f5f9';
    var bg=document.getElementById('edStageBg'); if(!bg) return;
    if(S.outerImg){ bg.style.display='block'; bg.style.backgroundImage="url('"+S.outerImg+"')";
      bg.style.opacity=(S.outerOpacity==null?1:S.outerOpacity); bg.style.filter=S.outerBlur?('blur('+S.outerBlur+'px)'):'none'; }
    else { bg.style.display='none'; }
  }
  elFile.addEventListener('change',function(){
    var f=elFile.files[0]; if(!f||!uploadTarget)return;
    setStatus('업로드 중…');
    var fd=new FormData(); fd.append('file',f);
    fetch(S.uploadUrl,{method:'POST',headers:{'X-CSRF':S.csrf},body:fd}).then(function(r){return r.json();}).then(function(j){
      if(!j.ok){ alert('업로드 실패: '+(j.err||'')); setStatus('저장됨'); return; }
      if(uploadTarget.outer){ S.outerImg=j.url; applyOuter(); markDirty(); renderProps(); return; }
      if(uploadTarget.carousel){ var ce=uploadTarget.carousel; if(uploadTarget.idx>=0){ var old=crItem(ce.images[uploadTarget.idx]); ce.images[uploadTarget.idx]={u:j.url,label:old.label}; } else ce.images.push({u:j.url,label:''}); markDirty(); renderCanvas(); renderProps(); setStatus('● 저장 안 됨'); return; }
      uploadTarget.src=j.url;
      if(j.w&&j.h){ var ar=aspNum(); uploadTarget.h=Math.min(80, uploadTarget.w*(j.h/j.w)*ar); }
      markDirty(); renderCanvas(); renderProps(); renderSlides();
    }).catch(function(){ alert('업로드 오류'); setStatus('저장됨'); });
  });

  // ── 선택 / 드래그 / 리사이즈 (단일 + 다중) ────────────────
  elCanvas.addEventListener('mousedown',function(ev){
    if(ev.button!==0) return;
    var handle=ev.target.closest('.rh');
    var grHandle=ev.target.closest('.grh');
    var groupBox=ev.target.closest('.ed-groupbox');
    var elBox=ev.target.closest('.el');
    var editing=elCanvas.querySelector('.el.editing');
    // 잠금 토글 버튼
    var lockBtn=ev.target.closest('.el-lock');
    if(lockBtn){ ev.preventDefault(); ev.stopPropagation(); if(editing) exitEdit();
      var le=cur().elements.find(function(x){return x.id===lockBtn.dataset.lockid;});
      if(le){ le.locked=le.locked?0:1; markDirty(); renderCanvas(); renderProps(); } return; }
    if(editing && editing.contains(ev.target) && !handle) return;
    if(editing) exitEdit();
    // 그룹(다중) 핸들·박스
    if(grHandle){ startGroupResize(ev, grHandle.dataset.h); return; }
    if(groupBox){ startGroupMove(ev); return; }
    // 단일 리사이즈 핸들
    if(handle&&elBox){ startResize(ev,elBox.dataset.id,handle.dataset.h); return; }
    if(elBox){
      var id=elBox.dataset.id, eb=cur().elements.find(function(x){return x.id===id;});
      if(ev.shiftKey){ selToggle(id); renderCanvas(); renderProps(); return; }   // Shift+클릭 = 선택 토글
      if(S.selset.length>1 && isSel(id)){ startGroupMove(ev); return; }           // 이미 그룹에 속한 요소 드래그 = 그룹 이동
      if(!isSel(id)||S.selset.length!==1){ selSet([id]); renderCanvas(); renderProps(); }
      if(!(eb&&eb.locked)) startMove(ev,id);
      return;
    }
    // 빈 캔버스 → 마퀴(드래그 선택)
    startMarquee(ev);
  });
  // 텍스트 더블클릭 → 편집
  elCanvas.addEventListener('dblclick',function(ev){
    var t=ev.target.closest('.el-text'); var box=ev.target.closest('.el');
    if(t&&box){ var de=cur().elements.find(function(x){return x.id===box.dataset.id;}); if(de&&de.locked) return;   // 잠금 시 편집 금지
      box.classList.add('editing'); t.setAttribute('contenteditable','true'); t.focus();
      var e=cur().elements.find(function(x){return x.id===box.dataset.id;});
      if(e && (e.html==='텍스트를 입력하세요' || e.html==='텍스트')){ try{ document.execCommand('selectAll',false,null); }catch(_){} }
    }
  });
  function exitEdit(){ var ed=elCanvas.querySelector('.el.editing'); if(!ed)return;
    var t=ed.querySelector('.el-text'); var e=cur().elements.find(function(x){return x.id===ed.dataset.id;});
    if(t&&e){ e.html=t.innerHTML; markDirty(); }   // ★ 편집 요소 id로 직접 저장(선택상태 무관)
    ed.classList.remove('editing'); if(t) t.removeAttribute('contenteditable'); }

  function rectPct(ev){ var r=elCanvas.getBoundingClientRect(); return { r:r, px:(ev.clientX-r.left)/r.width*100, py:(ev.clientY-r.top)/r.height*100 }; }
  function startMove(ev,id){
    ev.preventDefault(); var e=cur().elements.find(function(x){return x.id===id;}); if(!e)return;
    var st=rectPct(ev), ox=e.x, oy=e.y;
    function mv(m){ var p=rectPct(m); e.x=Math.round((ox+(p.px-st.px))*10)/10; e.y=Math.round((oy+(p.py-st.py))*10)/10; snapMove(e); e.x=Math.round(e.x*10)/10; e.y=Math.round(e.y*10)/10; positionSel(e); syncBoxInputs(e); }
    function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); hideGuides(); markDirty(); renderSlides(); }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  }
  function startResize(ev,id,h){
    ev.preventDefault(); ev.stopPropagation(); var e=cur().elements.find(function(x){return x.id===id;}); if(!e||e.locked)return;
    var st=rectPct(ev), o={x:e.x,y:e.y,w:e.w,h:e.h};
    function mv(m){ var p=rectPct(m), dx=p.px-st.px, dy=p.py-st.py;
      if(h.indexOf('e')>=0){ e.w=Math.max(3,o.w+dx); }
      if(h.indexOf('s')>=0){ e.h=Math.max(3,o.h+dy); }
      if(h.indexOf('w')>=0){ e.w=Math.max(3,o.w-dx); e.x=o.x+dx; }
      if(h.indexOf('n')>=0){ e.h=Math.max(3,o.h-dy); e.y=o.y+dy; }
      snapResize(e,h);
      e.w=Math.round(e.w*10)/10; e.h=Math.round(e.h*10)/10; e.x=Math.round(e.x*10)/10; e.y=Math.round(e.y*10)/10;
      positionSel(e); syncBoxInputs(e);
    }
    function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); hideGuides(); markDirty(); renderSlides(); }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  }
  function positionSel(e){ var d=elCanvas.querySelector('.el.sel'); if(d){ d.style.left=e.x+'%'; d.style.top=e.y+'%'; d.style.width=e.w+'%'; d.style.height=e.h+'%'; } }

  // ── 다중 선택: 마퀴 / 그룹 이동 / 그룹 리사이즈 ──────────
  function elNode(id){ return elCanvas.querySelector('.el[data-id="'+id+'"]'); }
  function repositionGroupBox(){ var gb=groupBBox(), box=elCanvas.querySelector('.ed-groupbox'); if(gb&&box){ box.style.left=gb.x+'%'; box.style.top=gb.y+'%'; box.style.width=gb.w+'%'; box.style.height=gb.h+'%'; } }
  function positionAll(full){ S.selset.forEach(function(id){ var e=cur().elements.find(function(x){return x.id===id;}), d=elNode(id); if(e&&d){ d.style.left=e.x+'%'; d.style.top=e.y+'%'; if(full){ d.style.width=e.w+'%'; d.style.height=e.h+'%'; } } }); repositionGroupBox(); }
  function startMarquee(ev){
    ev.preventDefault(); var add=ev.shiftKey; if(!add) selClear();
    var r0=rectPct(ev), box=document.createElement('div'); box.className='ed-marquee'; elCanvas.appendChild(box); var moved=false;
    function mv(m){ var r=rectPct(m), x=Math.min(r0.px,r.px),y=Math.min(r0.py,r.py),w=Math.abs(r.px-r0.px),h=Math.abs(r.py-r0.py);
      if(w>0.8||h>0.8)moved=true; box.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%;'; }
    function up(m){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); box.remove();
      if(moved){ var r=rectPct(m), x1=Math.min(r0.px,r.px),y1=Math.min(r0.py,r.py),x2=Math.max(r0.px,r.px),y2=Math.max(r0.py,r.py);
        var ids=cur().elements.filter(function(e){ return !e.locked && e.x<x2 && (e.x+e.w)>x1 && e.y<y2 && (e.y+e.h)>y1; }).map(function(e){return e.id;});
        if(add){ ids.forEach(function(id){ if(S.selset.indexOf(id)<0)S.selset.push(id); }); S.sel=(S.selset.length===1)?S.selset[0]:null; }
        else selSet(ids);
      }
      renderCanvas(); renderProps(); }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  }
  function startGroupMove(ev){
    ev.preventDefault(); var els=groupEls().filter(function(e){return !e.locked;}); if(!els.length)return;
    var st=rectPct(ev), orig=els.map(function(e){return {e:e,x:e.x,y:e.y};});
    function mv(m){ var p=rectPct(m), dx=p.px-st.px, dy=p.py-st.py; orig.forEach(function(o){ o.e.x=Math.round((o.x+dx)*10)/10; o.e.y=Math.round((o.y+dy)*10)/10; }); positionAll(false); }
    function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); markDirty(); renderCanvas(); renderSlides(); }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  }
  function startGroupResize(ev,hd){
    ev.preventDefault(); ev.stopPropagation(); var gb=groupBBox(); if(!gb)return;
    var els=groupEls().filter(function(e){return !e.locked;}); if(!els.length)return;
    var st=rectPct(ev), g0={x:gb.x,y:gb.y,w:Math.max(2,gb.w),h:Math.max(2,gb.h)};
    var ax=(hd.indexOf('w')>=0)?(g0.x+g0.w):g0.x, ay=(hd.indexOf('n')>=0)?(g0.y+g0.h):g0.y;   // 고정 앵커=반대 모서리
    var orig=els.map(function(e){return {e:e,x:e.x,y:e.y,w:e.w,h:e.h};});
    function mv(m){ var p=rectPct(m), dx=p.px-st.px, dy=p.py-st.py, nw=g0.w, nh=g0.h;
      if(hd.indexOf('e')>=0)nw=Math.max(2,g0.w+dx); if(hd.indexOf('w')>=0)nw=Math.max(2,g0.w-dx);
      if(hd.indexOf('s')>=0)nh=Math.max(2,g0.h+dy); if(hd.indexOf('n')>=0)nh=Math.max(2,g0.h-dy);
      var sx=(hd.indexOf('e')>=0||hd.indexOf('w')>=0)?nw/g0.w:1, sy=(hd.indexOf('s')>=0||hd.indexOf('n')>=0)?nh/g0.h:1;
      orig.forEach(function(o){ o.e.x=Math.round((ax+(o.x-ax)*sx)*10)/10; o.e.w=Math.round((o.w*sx)*10)/10; o.e.y=Math.round((ay+(o.y-ay)*sy)*10)/10; o.e.h=Math.round((o.h*sy)*10)/10; }); positionAll(true); }
    function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); markDirty(); renderCanvas(); renderSlides(); }
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  }

  // 그룹 속성패널 바인딩(위치=이동, 크기=스케일, 순서, 복제, 삭제)
  function bindGroupProps(){
    function gv(id){ return document.getElementById(id); }
    function translateGroup(dx,dy){ groupEls().forEach(function(e){ if(e.locked)return; if(dx)e.x=Math.round((e.x+dx)*10)/10; if(dy)e.y=Math.round((e.y+dy)*10)/10; }); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
    function scaleGroup(sx,sy){ var gb=groupBBox(); if(!gb)return; groupEls().forEach(function(e){ if(e.locked)return; e.x=Math.round((gb.x+(e.x-gb.x)*sx)*10)/10; e.w=Math.round((e.w*sx)*10)/10; e.y=Math.round((gb.y+(e.y-gb.y)*sy)*10)/10; e.h=Math.round((e.h*sy)*10)/10; }); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
    var x=gv('ppGX'),y=gv('ppGY'),w=gv('ppGW'),h=gv('ppGH');
    if(x)x.addEventListener('change',function(){ var gb=groupBBox(); if(gb)translateGroup((+x.value||0)-gb.x,0); });
    if(y)y.addEventListener('change',function(){ var gb=groupBBox(); if(gb)translateGroup(0,(+y.value||0)-gb.y); });
    if(w)w.addEventListener('change',function(){ var gb=groupBBox(); if(gb&&gb.w>0)scaleGroup(Math.max(1,+w.value||1)/gb.w,1); });
    if(h)h.addEventListener('change',function(){ var gb=groupBBox(); if(gb&&gb.h>0)scaleGroup(1,Math.max(1,+h.value||1)/gb.h); });
    var f=gv('ppGFront'); if(f)f.addEventListener('click',function(){ var mz=maxZ(); groupEls().slice().sort(function(a,c){return (a.z||1)-(c.z||1);}).forEach(function(e){ e.z=(++mz); }); markDirty(); renderCanvas(); });
    var b=gv('ppGBack'); if(b)b.addEventListener('click',function(){ var mn=Math.min.apply(null,cur().elements.map(function(e){return e.z||1;}))-1; groupEls().slice().sort(function(a,c){return (c.z||1)-(a.z||1);}).forEach(function(e){ e.z=(mn--); }); markDirty(); renderCanvas(); });
    var dp=gv('ppGDup'); if(dp)dp.addEventListener('click',dupGroup);
    var dl=gv('ppGDel'); if(dl)dl.addEventListener('click',function(){ if(!confirm(S.selset.length+'개 요소를 삭제할까요?'))return; var ids=S.selset.slice(), s=cur(); s.elements=s.elements.filter(function(e){return ids.indexOf(e.id)<0;}); selClear(); markDirty(); renderCanvas(); renderProps(); renderSlides(); });
  }
  function dupGroup(){ var news=[]; groupEls().forEach(function(e){ var c=JSON.parse(JSON.stringify(e)); c.id=uid(); c.x=Math.min(150,(c.x||0)+2); c.y=Math.min(150,(c.y||0)+2); c.z=maxZ()+1; cur().elements.push(c); news.push(c.id); }); if(news.length){ selSet(news); markDirty(); renderCanvas(); renderProps(); renderSlides(); } }

  // ── 이미지 크롭(재단) ─────────────────────────────────────
  function openCrop(e){
    if(e.type!=='image'||!e.src){ alert('이미지를 먼저 업로드하세요.'); return; }
    var back=document.createElement('div'); back.className='ed-crop-back';
    back.innerHTML='<div class="ed-crop">'+
      '<div class="ed-crop-head">이미지 크롭(재단) <span>영역을 드래그·모서리로 조절 후 [적용]</span></div>'+
      '<div class="ed-crop-body"><div class="ed-crop-stage" id="cropStage"><img id="cropImg" alt=""><div class="ed-crop-box" id="cropBox">'+
        ['nw','ne','se','sw'].map(function(h){return '<span class="ch ch-'+h+'" data-h="'+h+'"></span>';}).join('')+
      '</div></div></div>'+
      '<div class="ed-crop-foot"><span class="ed-crop-msg" id="cropMsg"></span><button class="pp-btn" id="cropCancel">취소</button><button class="btn-primary" id="cropApply">적용</button></div>'+
    '</div>';
    document.body.appendChild(back);
    var img=back.querySelector('#cropImg'), box=back.querySelector('#cropBox'), stage=back.querySelector('#cropStage');
    var msg=back.querySelector('#cropMsg');
    function close(){ back.remove(); }
    back.addEventListener('mousedown',function(ev){ if(ev.target===back) close(); });
    back.querySelector('#cropCancel').addEventListener('click',close);

    img.onload=function(){
      var iw=img.clientWidth, ih=img.clientHeight;
      var b={x:iw*0.1,y:ih*0.1,w:iw*0.8,h:ih*0.8};
      function draw(){ box.style.left=b.x+'px'; box.style.top=b.y+'px'; box.style.width=b.w+'px'; box.style.height=b.h+'px'; }
      draw();
      function clampBox(){ b.w=Math.max(20,Math.min(b.w,iw)); b.h=Math.max(20,Math.min(b.h,ih)); b.x=Math.max(0,Math.min(b.x,iw-b.w)); b.y=Math.max(0,Math.min(b.y,ih-b.h)); }
      box.addEventListener('mousedown',function(ev){
        var handle=ev.target.closest('.ch'); ev.preventDefault(); ev.stopPropagation();
        var sx=ev.clientX, sy=ev.clientY, o={x:b.x,y:b.y,w:b.w,h:b.h};
        function mv(m){ var dx=m.clientX-sx, dy=m.clientY-sy;
          if(!handle){ b.x=o.x+dx; b.y=o.y+dy; }
          else { var h=handle.dataset.h;
            if(h.indexOf('e')>=0) b.w=o.w+dx; if(h.indexOf('s')>=0) b.h=o.h+dy;
            if(h.indexOf('w')>=0){ b.w=o.w-dx; b.x=o.x+dx; } if(h.indexOf('n')>=0){ b.h=o.h-dy; b.y=o.y+dy; }
          }
          clampBox(); draw();
        }
        function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
        document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
      });
      back.querySelector('#cropApply').addEventListener('click',function(){
        var rect={ x:b.x/iw, y:b.y/ih, w:b.w/iw, h:b.h/ih };
        msg.textContent='자르는 중…';
        fetch(S.cropUrl,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF':S.csrf},
          body:JSON.stringify({csrf:S.csrf, src:e.src, x:rect.x, y:rect.y, w:rect.w, h:rect.h})})
          .then(function(r){return r.json();}).then(function(j){
            if(!j.ok){ msg.textContent='실패: '+(j.err||''); return; }
            e.src=j.url; if(e.fit==null) e.fit='contain';
            if(j.w&&j.h){ var na=j.w/j.h; e.h=Math.max(3,Math.min(120, e.w*aspNum()/na)); }  // 새 비율 맞춰 왜곡 방지
            markDirty(); renderCanvas(); renderProps(); renderSlides(); close();
          }).catch(function(){ msg.textContent='오류'; });
      });
    };
    img.src=e.src;
  }

  // ── 저장 ──────────────────────────────────────────────────
  // 자동저장 없음 — [저장] 버튼으로만 저장. 편집 시 '저장 안 됨' 표시.
  // ── 되돌리기(Undo)/다시실행(Redo) ──
  var undoStack=[], redoStack=[], prevSnap=null, snapTimer=null;
  function snapshot(){ return JSON.stringify({ slides:S.slides, aspect:S.aspect, stageRadius:S.stageRadius, outerBg:S.outerBg, outerImg:S.outerImg, outerOpacity:S.outerOpacity, outerBlur:S.outerBlur, guides:S.guides, cur:S.cur, selset:S.selset }); }
  function restore(js){ var d=JSON.parse(js); S.slides=d.slides; S.aspect=d.aspect||'16:9'; S.stageRadius=d.stageRadius; S.outerBg=d.outerBg; S.outerImg=d.outerImg; S.outerOpacity=d.outerOpacity; S.outerBlur=d.outerBlur; S.guides=d.guides||{v:[],h:[]}; S.cur=Math.min(d.cur||0, Math.max(0,S.slides.length-1)); selSet(d.selset||(d.sel?[d.sel]:[]));
    applyOuter(); var wr=document.querySelector('.ed-canvas-wrap'); if(wr)wr.style.aspectRatio=aspNum(); elCanvas.style.aspectRatio=aspNum(); elCanvas.style.borderRadius=(S.stageRadius==null?10:S.stageRadius)+'px';
    renderCanvas(); renderSlides(); renderProps(); }
  function recordHistory(){ if(prevSnap==null){ prevSnap=snapshot(); return; }
    if(!snapTimer){ undoStack.push(prevSnap); if(undoStack.length>60) undoStack.shift(); redoStack=[]; updateUndoBtns(); }
    clearTimeout(snapTimer); snapTimer=setTimeout(function(){ snapTimer=null; prevSnap=snapshot(); }, 400); }
  function doUndo(){ if(!undoStack.length || elCanvas.querySelector('.el.editing')) return; clearTimeout(snapTimer); snapTimer=null; redoStack.push(snapshot()); var s=undoStack.pop(); restore(s); prevSnap=s; S.dirty=true; setStatus('● 저장 안 됨'); elStatus.classList.add('dirty'); updateUndoBtns(); }
  function doRedo(){ if(!redoStack.length) return; clearTimeout(snapTimer); snapTimer=null; undoStack.push(snapshot()); var s=redoStack.pop(); restore(s); prevSnap=s; S.dirty=true; setStatus('● 저장 안 됨'); elStatus.classList.add('dirty'); updateUndoBtns(); }
  function updateUndoBtns(){ var u=document.getElementById('edUndo'), r=document.getElementById('edRedo'); if(u)u.disabled=!undoStack.length; if(r)r.disabled=!redoStack.length; }

  function markDirty(){ recordHistory(); S.dirty=true; setStatus('● 저장 안 됨'); elStatus.classList.add('dirty'); }
  function setStatus(t){ elStatus.textContent=t; }
  function save(){
    exitEdit(); setStatus('저장 중…');
    var payload={ act:'save', csrf:S.csrf, catalog_id:S.catalogId, aspect:S.aspect||'16:9',
      settings:{ outerBg:S.outerBg, outerImg:S.outerImg, outerOpacity:S.outerOpacity, outerBlur:S.outerBlur, radius:S.stageRadius, guidesV:S.guides.v, guidesH:S.guides.h },
      slides:S.slides.map(function(s){ return { id:s.id||0, tmpid:s.tmpid, bg:s.bg, elements:s.elements }; }) };
    return fetch(S.saveUrl,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF':S.csrf},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j.ok){ setStatus('저장 실패'); alert('저장 실패: '+(j.err||'')); return; }
        // 새 슬라이드 id 매핑
        if(j.idMap){ S.slides.forEach(function(s){ if(s.tmpid&&j.idMap[s.tmpid]){ s.id=j.idMap[s.tmpid]; s.tmpid=null; } }); }
        S.dirty=false; setStatus('저장됨 ✓'); elStatus.classList.remove('dirty');
      }).catch(function(){ setStatus('저장 실패'); });
  }
  document.getElementById('edSave').addEventListener('click',save);
  // 나가기: 미저장 변경 있으면 경고(저장 안 하고 나감)
  var backLink=document.querySelector('.ed-back');
  if(backLink) backLink.addEventListener('click',function(ev){
    if(S.dirty && !confirm('저장하지 않은 변경사항이 있습니다.\n저장하지 않고 나가시겠습니까?')) ev.preventDefault();
  });
  // 브라우저 뒤로가기/새로고침/탭닫기 — 네이티브 경고
  window.addEventListener('beforeunload',function(e){ if(S.dirty){ e.preventDefault(); e.returnValue=''; } });

  // 단축키: Ctrl+D 복제 / Delete·Backspace 삭제 (텍스트 편집·입력 중 제외)
  document.addEventListener('keydown',function(ev){
    var t=ev.target, tag=(t.tagName||'').toLowerCase();
    var typing = tag==='input'||tag==='select'||tag==='textarea'|| (t.getAttribute&&t.getAttribute('contenteditable')==='true') || elCanvas.querySelector('.el.editing');
    if(ev.key==='Escape' && S.selset.length){ selClear(); renderCanvas(); renderProps(); return; }
    if((ev.ctrlKey||ev.metaKey) && (ev.key==='d'||ev.key==='D')){ if(S.selset.length>1){ ev.preventDefault(); dupGroup(); } else if(S.sel){ ev.preventDefault(); duplicateEl(); } return; }
    if((ev.ctrlKey||ev.metaKey) && (ev.key==='a'||ev.key==='A') && !typing){ ev.preventDefault(); selSet(cur().elements.filter(function(e){return !e.locked;}).map(function(e){return e.id;})); renderCanvas(); renderProps(); return; }
    if((ev.key==='Delete'||ev.key==='Backspace') && !typing){
      if(S.selset.length>1){ ev.preventDefault(); var ids=S.selset.slice(), s=cur(); s.elements=s.elements.filter(function(e){return ids.indexOf(e.id)<0;}); selClear(); markDirty(); renderCanvas(); renderProps(); renderSlides(); }
      else if(S.sel){ ev.preventDefault(); delEl(S.sel); }
    }
  });

  function renderAll(){ renderSlides(); renderCanvas(); renderProps(); applyOuter(); }
  renderAll();
  prevSnap = snapshot();   // 되돌리기 기준 상태
  updateUndoBtns();
})();
