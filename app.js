(function(){
"use strict";
var TD = window.TD, C = window.TeloCalc;
var PALS = {
 vino:{main:"5E1A1E",acc:"A8823C",line:"C6A15B",ink:"3A2A22",mute:"7C6B5C",rule:"DCCBAA",card:"EFE3D2"},
 lilac:{main:"5E3A8C",acc:"A8823C",line:"C6A15B",ink:"2F2A38",mute:"6F6680",rule:"E3D8EE",card:"E9E0F3"},
 tealpink:{main:"0F6B70",acc:"C94F7C",line:"E58BA8",ink:"1F3436",mute:"5B7576",rule:"CBE5E6",card:"DDF0F0"}
};
var ROLE_M = {phys:"Физика: как тревога проявляется в теле", energy:"Энергия: откуда берутся силы", emo:"Эмоции: что чувствуется внутри"};
var ROLE_S = {phys:"Физика (день рождения)", energy:"Энергия (месяц рождения)", emo:"Эмоции"};
var ROLE_SHORT = {phys:"Физика", energy:"Энергия", emo:"Эмоции"};
var NOTE = "Разбор составлен по вашей дате рождения и описывает возможные сценарии, а не приговор. Если в описании вы не узнаёте себя, значит, этот вариант вам не близок или давно остался в прошлом. Материал не заменяет консультацию врача или психолога: если тревога держится больше двух недель, повторяются панические приступы или нарушен сон, обратитесь к специалисту.";
var pal = "vino", R = null;

function pad(n){ return (n < 10 ? "0" : "") + n; }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function $(id){ return document.getElementById(id); }
function parse(str){
  var m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(str).trim());
  if(!m) return null;
  var d = +m[1], mo = +m[2], y = +m[3];
  var dt = new Date(y, mo - 1, d);
  if(dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  if(y < 1900 || dt > new Date()) return null;
  return {d:d, m:mo, y:y};
}
function ename(n){ return TD.e[n].name; }

/* ---------- содержание разбора: один набор блоков для экрана, PDF и Word ---------- */
function uniq(row){
  var order = ["phys","energy","emo"], seen = {}, out = [];
  order.forEach(function(k){
    var n = row[k];
    if(seen[n] === undefined){ seen[n] = out.length; out.push({n:n, roles:[k]}); }
    else out[seen[n]].roles.push(k);
  });
  return out;
}
function rolesText(roles, M){
  var R_ = M ? ROLE_M : ROLE_S;
  return roles.map(function(r){ return R_[r]; }).join(". Она же: ");
}
function practiceBlock(p){
  if(p.common === "ground"){
    return {k:"com", t:"Практика 9. Опора через тело", text:"Выполняется по общему описанию в разделе Опора для глубокого уровня в конце разбора. Для этой энергии завершите её фразой: " + p.phrase, code:p.code};
  }
  if(p.common === "support"){
    return {k:"com", t:"Практика " + p.n + ". Просьба о поддержке", text:"Выполняется по общему описанию в разделе Опора для глубокого уровня в конце разбора. Для этой энергии подойдёт такое сообщение: " + p.msg, code:p.code};
  }
  return {k:"prac", t:"Практика " + p.n + ". " + p.t, time:p.time, steps:p.steps, code:p.code};
}
function buildDoc(){
  var secs = [];
  var mul = R.c.mul, sah = R.c.sah;
  /* 1. ключ */
  var K = TD.k[mul.key];
  var kb = [{k:"pi", t:"Ключ показывает, на чём у вас держится чувство опоры и в каком месте она даёт сбой, когда приходит тревога."}];
  K.items.forEach(function(it){
    if(it.text !== undefined){ kb.push({k:"p", b:it.label + ".", t:it.text}); }
    else if(it.ul){ kb.push({k:"h4", t:it.label}); kb.push({k:it.label === "В плюсе" ? "plus" : "minus", items:it.ul}); }
    else if(it.ol){ kb.push({k:"h4", t:it.label}); kb.push({k:"ol", items:it.ol}); }
  });
  secs.push({eb:"Ключ вашей Муладхары", t:"Ключ " + mul.key + ". " + K.name, blocks:kb, pb:false});
  /* 2. энергии Муладхары */
  uniq(mul).forEach(function(u){
    var E = TD.e[u.n], b = [];
    b.push({k:"pi", t:rolesText(u.roles, true) + "."});
    b.push({k:"pi", t:E.tag});
    E.sec.forEach(function(s, i){
      b.push({k:"h5", t:s.t});
      s.p.forEach(function(p){ b.push({k:"p", t:p}); });
      if(s.phr.length){ b.push({k:"h4", t:"Фразы, по которым узнаётся тревога этой энергии"}); b.push({k:"quote", items:s.phr}); }
      if(s.note) b.push({k:"small", t:s.note});
    });
    b.push({k:"h5", t:"Практики на три уровня минуса"});
    if(E.levelinfo.length) b.push({k:"lvl", items:E.levelinfo});
    if(E.warn) b.push({k:"small", t:E.warn});
    E.levels.forEach(function(L){
      b.push({k:"lvlh", t:L.t});
      L.pr.forEach(function(p){ b.push(practiceBlock(p)); });
    });
    secs.push({eb:"Муладхара · " + u.roles.map(function(r){ return ROLE_SHORT[r].toLowerCase(); }).join(" и "), t:u.n + ". " + E.name, blocks:b, pb:true});
  });
  /* 3. Сахасрара */
  var sb = [{k:"pi", t:"Сахасрара это верхняя строка карты здоровья: голова, смысл, предназначение. Когда Муладхара устойчива, а тревога отступила, наступает время Сахасрары. Ниже ресурс каждой её энергии: на что можно опереться дальше."}];
  uniq(sah).forEach(function(u){
    var E = TD.e[u.n], S = E.sah;
    sb.push({k:"h5", t:u.n + ". " + E.name + " · " + rolesText(u.roles, false)});
    sb.push({k:"p", t:S.intro});
    sb.push({k:"p", b:"Что это даёт.", t:S.give});
    sb.push({k:"p", b:"Как открыть этот ресурс.", t:S.open});
    sb.push({k:"h4", t:"Три вопроса для вечера"}); sb.push({k:"ul", items:S.q});
    sb.push({k:"phr", t:"Фраза-опора. " + S.phrase});
  });
  secs.push({eb:"Верхняя строка карты", t:"Сахасрара: ваш ресурс", blocks:sb, pb:true});
  /* 4. общее */
  var cb = [{k:"pi", t:"Практики, общие для всех энергий. Их стоит делать каждый день, пока тревога не отпустит."}];
  TD.common.practices.forEach(function(p, i){ cb.push({k:"prac", t:"Практика " + (i + 1) + ". " + p.t, time:p.time, steps:p.steps, code:p.code}); });
  cb.push({k:"h5", t:"Когда нужна помощь специалиста"});
  cb.push({k:"p", t:TD.common.help.intro});
  cb.push({k:"ul", items:TD.common.help.items});
  cb.push({k:"p", t:TD.common.help.end});
  secs.push({eb:"В конце", t:"Опора для глубокого уровня", blocks:cb, pb:true});
  return secs;
}

/* ---------- экран ---------- */
function blockHtml(b){
  switch(b.k){
    case "p": return "<p>" + (b.b ? "<b>" + esc(b.b) + "</b> " : "") + esc(b.t) + "</p>";
    case "pi": return "<p><em>" + esc(b.t) + "</em></p>";
    case "small": return '<p class="warn">' + esc(b.t) + "</p>";
    case "h4": return '<h4 class="sm">' + esc(b.t) + "</h4>";
    case "h5": return "<h5>" + esc(b.t) + "</h5>";
    case "lvlh": return '<div class="lvlh">' + esc(b.t) + "</div>";
    case "ul": return "<ul>" + b.items.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    case "minus": return '<ul class="minus">' + b.items.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    case "plus": return '<ul class="plus">' + b.items.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    case "ol": return "<ol>" + b.items.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
    case "quote": return '<div class="phr">' + b.items.map(function(x){ return "<p>" + esc(x) + "</p>"; }).join("") + "</div>";
    case "phr": return '<div class="phr"><p>' + esc(b.t) + "</p></div>";
    case "lvl": return '<div class="lvl">' + b.items.map(function(x){ return "<p>" + esc(x) + "</p>"; }).join("") + "</div>";
    case "prac": return '<div class="pr"><h6>' + esc(b.t) + '</h6><div class="tm">' + esc(b.time) + "</div><ol>" + b.steps.map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + '</ol><div class="cd"><b>Слово-код</b>' + esc(b.code) + "</div></div>";
    case "com": return '<div class="pr com"><h6>' + esc(b.t) + "</h6><p>" + esc(b.text) + '</p><div class="cd"><b>Слово-код</b>' + esc(b.code) + "</div></div>";
  }
  return "";
}
function chain(label, parts, total){
  var s = parts.join(" + ") + " = " + total;
  if(total > 22){ var t2 = C.r22(total); s += ", затем " + String(total).split("").join(" + ") + " = " + t2; }
  return "<li><b>" + label + ":</b> " + s + "</li>";
}
function calcBlock(o, c){
  var t = '<details class="calc"><summary>Как это посчитано</summary><ul>';
  var yd = String(o.y).split("");
  t += "<li><b>Физика Муладхары:</b> цифры года " + yd.join(" + ") + " = " + C.digs(o.y) + (C.digs(o.y) > 22 ? ", затем ещё раз " + String(C.digs(o.y)).split("").join(" + ") + " = " + c.V : "") + "</li>";
  t += "<li><b>День, приведённый к 22 или меньше:</b> " + o.d + (o.d > 22 ? " = " + String(o.d).split("").join(" + ") + " = " + c.A : "") + "</li>";
  t += chain("Энергия Муладхары (точка Г)", [c.A, o.m, c.V], c.A + o.m + c.V);
  t += chain("Эмоции Муладхары", [c.mul.phys, c.mul.energy], c.mul.phys + c.mul.energy);
  t += "<li><b>Ключ Муладхары:</b> " + [c.mul.phys, c.mul.energy, c.mul.emo].join(" + ") + " = " + c.mul.sum + (c.mul.sum > 9 ? ", затем " + String(c.mul.sum).split("").join(" + ") + " = " + c.mul.key : "") + "</li>";
  t += "<li><b>Сахасрара:</b> физика это день (" + c.sah.phys + "), энергия это месяц (" + c.sah.energy + "), эмоции " + c.sah.phys + " + " + c.sah.energy + " = " + (c.sah.phys + c.sah.energy) + (c.sah.phys + c.sah.energy > 22 ? ", затем " + c.sah.emo : "") + "</li>";
  return t + "</ul></details>";
}
function rowHtml(title, row, keyline){
  var h = '<div class="row"><h4>' + title + '</h4><div class="three">';
  ["phys","energy","emo"].forEach(function(k){
    h += '<div class="cell"><b>' + ROLE_SHORT[k] + '</b><div class="disc">' + row[k] + '</div><em>' + esc(ename(row[k])) + "</em></div>";
  });
  h += "</div>" + (keyline ? '<div class="keybadge">' + keyline + "</div>" : "") + "</div>";
  return h;
}
function render(){
  var c = R.c, who = R.name ? esc(R.name) : "Ваш разбор";
  var h = '<div class="card rhead"><div class="logo">Точка опоры</div><h2>' + who + '</h2><div class="sub">Тело знает раньше · ' + R.date + '</div>';
  h += '<div class="two">' + rowHtml("Муладхара", c.mul, "Ключ <b>" + c.mul.key + ". " + esc(TD.k[c.mul.key].name) + "</b>") + rowHtml("Сахасрара", c.sah, "") + "</div>";
  h += '<p class="how">' + esc(NOTE) + "</p>" + calcBlock(R.o, c) + "</div>";
  h += '<div class="acts"><button class="btn" id="pdf">Скачать PDF</button><button class="btn alt" id="doc">Скачать Word</button></div>';
  R.doc.forEach(function(s){
    h += '<section class="card sec"><div class="eb">' + esc(s.eb) + "</div><h3>" + esc(s.t) + "</h3><hr>" + s.blocks.map(blockHtml).join("") + "</section>";
  });
  var res = $("result"); res.innerHTML = h; res.hidden = false;
  $("pdf").onclick = function(){ busy(this, exportPdf); };
  $("doc").onclick = function(){ busy(this, exportWord); };
  res.scrollIntoView({behavior:"smooth", block:"start"});
}
function busy(btn, fn){
  var t = btn.textContent; btn.disabled = true; btn.textContent = "Готовим файл…";
  Promise.resolve().then(fn).catch(function(e){ if(window.console) console.warn(e); }).then(function(){ btn.disabled = false; btn.textContent = t; });
}
function download(blob, name){
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1500);
}
function fileBase(){ return ("Тело знает раньше" + (R.name ? " " + R.name : "") + " " + R.date).replace(/[\\\/:*?"<>|]/g, ""); }
function loadScript(u){ return new Promise(function(res, rej){ var s = document.createElement("script"); s.src = u; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

/* ---------- PDF ---------- */
function exportPdf(){
  var P = PALS[pal];
  return loadScript("pdfmake.min.js").then(function(){ return loadScript("pdf-fonts.js"); }).then(function(){
    window.pdfMake.fonts = {
      Montserrat:{normal:"mont-400.ttf",bold:"mont-600.ttf",italics:"mont-400.ttf",bolditalics:"mont-600.ttf"},
      Playfair:{normal:"play-500.ttf",bold:"play-500.ttf",italics:"play-500.ttf",bolditalics:"play-500.ttf"}};
    var c = [], col = function(x){ return "#" + x; };
    c.push({text:"ТОЧКА ОПОРЫ", fontSize:8, bold:true, color:col(P.acc), characterSpacing:3, alignment:"center"});
    c.push({text:"Тело знает раньше", font:"Playfair", fontSize:30, color:col(P.main), alignment:"center", margin:[0,8,0,2]});
    c.push({text:"Ваша Муладхара, ключ опоры и Сахасрара по дате рождения", fontSize:9, color:col(P.mute), alignment:"center", margin:[0,0,0,4]});
    c.push({text:(R.name ? R.name + " · " : "") + R.date, fontSize:10, color:col(P.mute), alignment:"center", margin:[0,0,0,14]});
    [["МУЛАДХАРА", R.c.mul], ["САХАСРАРА", R.c.sah]].forEach(function(pair){
      var head = [], row = [], nm = [];
      ["phys","energy","emo"].forEach(function(k){
        head.push({text:ROLE_SHORT[k].toUpperCase(), fontSize:7, bold:true, color:col(P.acc), alignment:"center", characterSpacing:1});
        row.push({text:String(pair[1][k]), font:"Playfair", fontSize:20, color:col(P.main), alignment:"center"});
        nm.push({text:ename(pair[1][k]), fontSize:8.5, color:col(P.mute), alignment:"center"});
      });
      c.push({text:pair[0], fontSize:8, bold:true, color:col(P.main), characterSpacing:2, margin:[0,2,0,4]});
      c.push({table:{widths:["*","*","*"], body:[head,row,nm]}, layout:{hLineColor:col(P.rule), vLineColor:col(P.rule), hLineWidth:function(){return .6;}, vLineWidth:function(){return .6;}, paddingTop:function(){return 5;}, paddingBottom:function(){return 5;}}, margin:[0,0,0,pair[0] === "МУЛАДХАРА" ? 4 : 12]});
      if(pair[0] === "МУЛАДХАРА") c.push({text:"Ключ " + R.c.mul.key + ". " + TD.k[R.c.mul.key].name, font:"Playfair", fontSize:12, color:col(P.main), alignment:"center", margin:[0,0,0,12]});
    });
    c.push({text:NOTE, fontSize:9, color:col(P.mute), lineHeight:1.4, margin:[0,0,0,6]});
    R.doc.forEach(function(s, si){
      c.push({text:s.eb.toUpperCase(), fontSize:7.5, bold:true, color:col(P.acc), characterSpacing:1.6, margin:[0,0,0,3], pageBreak:si >= 0 && s.pb ? "before" : undefined});
      c.push({text:s.t, font:"Playfair", fontSize:18, color:col(P.main), margin:[0,0,0,4]});
      c.push({canvas:[{type:"line", x1:0, y1:0, x2:515, y2:0, lineWidth:.8, lineColor:col(P.line)}], margin:[0,0,0,8]});
      s.blocks.forEach(function(b){
        switch(b.k){
          case "p": c.push({text:b.b ? [{text:b.b + " ", bold:true, color:col(P.main)}, b.t] : b.t, fontSize:10, color:col(P.ink), lineHeight:1.5, margin:[0,0,0,6]}); break;
          case "pi": c.push({text:b.t, italics:true, fontSize:9.5, color:col(P.mute), lineHeight:1.45, margin:[0,0,0,6]}); break;
          case "small": c.push({text:b.t, fontSize:8.8, color:col(P.mute), lineHeight:1.4, margin:[0,0,0,6]}); break;
          case "h4": c.push({text:b.t.toUpperCase(), fontSize:7.5, bold:true, color:col(P.acc), characterSpacing:1.4, margin:[0,8,0,3]}); break;
          case "h5": c.push({text:b.t, font:"Playfair", fontSize:13, color:col(P.main), margin:[0,12,0,4]}); break;
          case "lvlh": c.push({text:b.t, font:"Playfair", fontSize:12, color:col(P.main), margin:[0,12,0,6]}); break;
          case "ul": case "minus": case "plus": c.push({ul:b.items, fontSize:9.8, color:col(P.ink), lineHeight:1.45, margin:[0,0,0,6]}); break;
          case "ol": c.push({ol:b.items, fontSize:9.8, color:col(P.ink), lineHeight:1.45, margin:[0,0,0,6]}); break;
          case "quote": c.push({text:b.items.join("\n"), italics:true, font:"Playfair", fontSize:10.5, color:col(P.main), lineHeight:1.5, margin:[10,0,0,8]}); break;
          case "phr": c.push({text:b.t, italics:true, font:"Playfair", fontSize:10.5, color:col(P.main), lineHeight:1.5, margin:[10,2,0,8]}); break;
          case "lvl": c.push({text:b.items.map(function(x){ return x; }).join("\n"), fontSize:9.2, color:col(P.mute), lineHeight:1.45, margin:[0,0,0,6]}); break;
          case "prac":
            c.push({stack:[{text:b.t, font:"Playfair", fontSize:11, color:col(P.main)}, {text:b.time.toUpperCase(), fontSize:7, bold:true, color:col(P.acc), characterSpacing:1.2, margin:[0,2,0,4]}, {ol:b.steps, fontSize:9.6, color:col(P.ink), lineHeight:1.4}, {text:"Слово-код: " + b.code, fontSize:9, italics:true, color:col(P.main), margin:[0,4,0,0]}], margin:[0,0,0,8], unbreakable:true}); break;
          case "com":
            c.push({stack:[{text:b.t, font:"Playfair", fontSize:11, color:col(P.main)}, {text:b.text, fontSize:9.4, color:col(P.ink), lineHeight:1.4, margin:[0,3,0,0]}, {text:"Слово-код: " + b.code, fontSize:9, italics:true, color:col(P.main), margin:[0,4,0,0]}], margin:[0,0,0,8], unbreakable:true}); break;
        }
      });
    });
    c.push({text:"КЛУБ И КАНАЛ", fontSize:7.5, bold:true, color:col(P.acc), characterSpacing:1.6, margin:[0,22,0,3], pageBreak:"before"});
    c.push({text:"Клуб Точка опоры", font:"Playfair", fontSize:16, color:col(P.main), margin:[0,0,0,4]});
    c.push({text:"Обучение по подписке: девять факультетов и записанные уроки, которые можно смотреть в своём темпе.", fontSize:10, lineHeight:1.5, margin:[0,0,0,4]});
    c.push({text:"Подписка: tochka-opory.lpxl.ru/podpiska", link:"https://tochka-opory.lpxl.ru/podpiska", fontSize:10, color:col(P.main), decoration:"underline", margin:[0,0,0,2]});
    c.push({text:"Телеграм-канал: t.me/nadin_matrix", link:"https://t.me/nadin_matrix", fontSize:10, color:col(P.main), decoration:"underline", margin:[0,0,0,2]});
    c.push({text:"Бесплатный калькулятор матрицы: matrica.nadezhdakukhtina.ru", link:"https://matrica.nadezhdakukhtina.ru", fontSize:10, color:col(P.main), decoration:"underline"});
    var def = {pageSize:"A4", pageMargins:[40,44,40,48], content:c, defaultStyle:{font:"Montserrat", fontSize:10, color:col(P.ink)},
      footer:function(cur, tot){ return {text:"Тело знает раньше · " + cur + " / " + tot, alignment:"center", fontSize:7, color:col(P.acc), characterSpacing:1.5, margin:[0,14,0,0]}; }};
    return new Promise(function(res, rej){ try{ window.pdfMake.createPdf(def).getBlob(function(b){ download(b, fileBase() + ".pdf"); res(); }); }catch(e){ rej(e); } });
  }).catch(function(e){ if(window.console) console.warn("PDF не собрался, открываем печать", e); window.print(); });
}

/* ---------- Word ---------- */
function exportWord(){
  var P = PALS[pal];
  return loadScript("docx.umd.js").then(function(){
    var X = window.docx, kids = [];
    var run = function(t, o){ o = o || {}; o.text = t; return new X.TextRun(o); };
    var para = function(t, o){ o = o || {}; return new X.Paragraph({children:(o.runs || [run(t, {font:o.font || "Calibri", size:o.size || 22, color:o.color || P.ink, italics:o.it, bold:o.bold, characterSpacing:o.sp})]), spacing:{after:o.after || 140, before:o.before || 0, line:o.line || 300}, alignment:o.al, bullet:o.bullet, pageBreakBefore:o.pb}); };
    kids.push(para("ТОЧКА ОПОРЫ", {size:16, color:P.acc, bold:true, al:X.AlignmentType.CENTER, sp:60}));
    kids.push(para("Тело знает раньше", {font:"Georgia", size:60, color:P.main, al:X.AlignmentType.CENTER, after:40}));
    kids.push(para("Ваша Муладхара, ключ опоры и Сахасрара по дате рождения", {size:18, color:P.mute, al:X.AlignmentType.CENTER, after:80}));
    kids.push(para((R.name ? R.name + " · " : "") + R.date, {size:20, color:P.mute, al:X.AlignmentType.CENTER, after:200}));
    [["МУЛАДХАРА", R.c.mul], ["САХАСРАРА", R.c.sah]].forEach(function(pair){
      var cells = [];
      ["phys","energy","emo"].forEach(function(k){
        cells.push(new X.TableCell({children:[para(ROLE_SHORT[k].toUpperCase(), {size:14, color:P.acc, bold:true, al:X.AlignmentType.CENTER, after:40}), para(String(pair[1][k]), {font:"Georgia", size:36, color:P.main, al:X.AlignmentType.CENTER, after:20}), para(ename(pair[1][k]), {size:17, color:P.mute, al:X.AlignmentType.CENTER, after:40})], width:{size:33, type:X.WidthType.PERCENTAGE}}));
      });
      kids.push(para(pair[0], {size:16, color:P.main, bold:true, sp:40, before:160, after:60}));
      kids.push(new X.Table({rows:[new X.TableRow({children:cells})], width:{size:100, type:X.WidthType.PERCENTAGE}}));
      if(pair[0] === "МУЛАДХАРА") kids.push(para("Ключ " + R.c.mul.key + ". " + TD.k[R.c.mul.key].name, {font:"Georgia", size:26, color:P.main, al:X.AlignmentType.CENTER, before:100, after:80}));
    });
    kids.push(para(NOTE, {size:18, color:P.mute, before:200, after:200}));
    R.doc.forEach(function(s){
      kids.push(para(s.eb.toUpperCase(), {size:15, color:P.acc, bold:true, sp:40, before:0, after:60, pb:!!s.pb}));
      kids.push(para(s.t, {font:"Georgia", size:36, color:P.main, after:100}));
      s.blocks.forEach(function(b){
        switch(b.k){
          case "p":
            if(b.b) kids.push(para("", {runs:[run(b.b + " ", {font:"Calibri", size:22, bold:true, color:P.main}), run(b.t, {font:"Calibri", size:22, color:P.ink})]}));
            else kids.push(para(b.t));
            break;
          case "pi": kids.push(para(b.t, {size:19, color:P.mute, it:true})); break;
          case "small": kids.push(para(b.t, {size:17, color:P.mute})); break;
          case "h4": kids.push(para(b.t.toUpperCase(), {size:15, color:P.acc, bold:true, sp:40, before:140, after:60})); break;
          case "h5": kids.push(para(b.t, {font:"Georgia", size:28, color:P.main, before:200, after:80})); break;
          case "lvlh": kids.push(para(b.t, {font:"Georgia", size:24, color:P.main, before:200, after:80})); break;
          case "ul": case "minus": case "plus": b.items.forEach(function(x){ kids.push(para(x, {size:21, bullet:{level:0}, after:80})); }); break;
          case "ol": b.items.forEach(function(x, i){ kids.push(para((i + 1) + ". " + x, {size:21, after:80})); }); break;
          case "quote": b.items.forEach(function(x){ kids.push(para(x, {font:"Georgia", size:21, color:P.main, it:true, after:60})); }); break;
          case "phr": kids.push(para(b.t, {font:"Georgia", size:21, color:P.main, it:true})); break;
          case "lvl": b.items.forEach(function(x){ kids.push(para(x, {size:18, color:P.mute, after:60})); }); break;
          case "prac":
            kids.push(para(b.t, {font:"Georgia", size:23, color:P.main, bold:true, before:160, after:20}));
            kids.push(para(b.time.toUpperCase(), {size:14, color:P.acc, bold:true, sp:30, after:60}));
            b.steps.forEach(function(x, i){ kids.push(para((i + 1) + ". " + x, {size:21, after:60})); });
            kids.push(para("Слово-код: " + b.code, {size:19, color:P.main, it:true, after:140})); break;
          case "com":
            kids.push(para(b.t, {font:"Georgia", size:23, color:P.main, bold:true, before:160, after:20}));
            kids.push(para(b.text, {size:21, after:60}));
            kids.push(para("Слово-код: " + b.code, {size:19, color:P.main, it:true, after:140})); break;
        }
      });
    });
    kids.push(para("КЛУБ И КАНАЛ", {size:15, color:P.acc, bold:true, sp:40, after:60, pb:true}));
    kids.push(para("Клуб Точка опоры", {font:"Georgia", size:32, color:P.main, after:100}));
    kids.push(para("Обучение по подписке: девять факультетов и записанные уроки, которые можно смотреть в своём темпе."));
    kids.push(para("Подписка: https://tochka-opory.lpxl.ru/podpiska", {after:60}));
    kids.push(para("Телеграм-канал: https://t.me/nadin_matrix", {after:60}));
    kids.push(para("Бесплатный калькулятор матрицы: https://matrica.nadezhdakukhtina.ru"));
    var doc = new X.Document({sections:[{properties:{page:{margin:{top:1000, bottom:1000, left:1100, right:1100}}}, children:kids}]});
    return X.Packer.toBlob(doc);
  }).then(function(b){ download(b, fileBase() + ".docx"); });
}

/* ---------- старт ---------- */
function init(){
  var inp = $("date");
  inp.addEventListener("input", function(){
    var v = inp.value.replace(/\D/g, "").slice(0, 8), o = v;
    if(v.length > 4) o = v.slice(0,2) + "." + v.slice(2,4) + "." + v.slice(4);
    else if(v.length > 2) o = v.slice(0,2) + "." + v.slice(2);
    inp.value = o;
  });
  inp.addEventListener("keydown", function(e){ if(e.key === "Enter") go(); });
  $("go").onclick = go;
  Array.prototype.forEach.call(document.querySelectorAll(".pal button"), function(b){
    b.onclick = function(){
      pal = b.getAttribute("data-p"); document.body.setAttribute("data-pal", pal);
      Array.prototype.forEach.call(document.querySelectorAll(".pal button"), function(x){ x.classList.toggle("on", x === b); });
    };
  });
  function go(){
    var e = $("err"), o = parse(inp.value);
    if(!o){ e.textContent = "Проверьте дату: нужен формат ДД.ММ.ГГГГ, например 07.04.1991."; e.hidden = false; return; }
    e.hidden = true;
    R = {o:o, c:C.calc(o.d, o.m, o.y), date:pad(o.d) + "." + pad(o.m) + "." + o.y, name:$("name").value.trim()};
    R.doc = buildDoc();
    render();
  }
  window.TELOTEST = {parse:parse, calc:C.calc, build:function(d, m, y){ R = {o:{d:d, m:m, y:y}, c:C.calc(d, m, y), date:"", name:""}; return buildDoc(); }};
}
init();
})();
