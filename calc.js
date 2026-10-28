/* Расчёт Муладхары, Сахасрары и ключей. Работает и в браузере, и в node (для проверки). */
(function(root){
"use strict";
function digs(n){ var s = 0; String(n).split("").forEach(function(c){ s += +c; }); return s; }
/* до 22: больше 22 складываем цифры, никогда не вычитаем 22 */
function r22(n){ while(n > 22){ n = digs(n); } return n; }
/* до 9: для ключей */
function r9(n){ while(n > 9){ n = digs(n); } return n; }
function row(a, b){ var c = r22(a + b); return {phys:a, energy:b, emo:c, sum:a + b + c, key:r9(a + b + c)}; }
function calc(d, m, y){
  var A = r22(d), B = m, V = r22(digs(y));
  var G = r22(A + B + V);
  return {
    A:A, B:B, V:V, G:G,
    mul: row(V, G),   /* Муладхара: физика = год, энергия = точка Г */
    sah: row(A, B)    /* Сахасрара: физика = день, энергия = месяц */
  };
}
var api = {calc:calc, r22:r22, r9:r9, digs:digs};
if(typeof module !== "undefined" && module.exports){ module.exports = api; } else { root.TeloCalc = api; }
})(this);
