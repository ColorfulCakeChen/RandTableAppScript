//
// This xorshift.gs module is copied from the following (2016/07/03):
//
// https://github.com/AndreasMadsen/xorshift
//

/* LICENSE.md

Copyright (c) 2014 Andreas Madsen & Emil Bay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * Create a pseudorandom number generator, with a seed.
 * @param {array} seed "128-bit" integer, composed of 4x32-bit
 * integers in big endian order.
 */
function XorShift_(seed) {
  // Note the extension, this === module.exports is required because
  // the `constructor` function will be used to generate new instances.
  // In that case `this` will point to the default RNG, and `this` will
  // be an instance of XorShift.
//  if (!(this instanceof XorShift) || this === module.exports) {  //!!! Remarked by CakeChen (2016/07/07)
  if (!(this instanceof XorShift_)) {    //!!! Modified by CakeChen (2016/07/07)
    return new XorShift_(seed);
  }

  if (!Array.isArray(seed) || seed.length !== 4) {
    throw new TypeError('seed must be an array with 4 numbers');
  }

  // uint64_t s = [seed ...]
  this._state0U = seed[0] | 0;
  this._state0L = seed[1] | 0;
  this._state1U = seed[2] | 0;
  this._state1L = seed[3] | 0;
}

/**
 * 傳回整數亂數陣列。陣列中的每個元素都是位元數介於33-bit到52-bit之間的JavaScript整數。
 *
 * (2016/07/16 Modified by CakeChen) 這個函式整合了陣列產生、與數值乘法，因為在試算表中，這是最常見的使用方式。
 *
 * @param {number} rowCount     傳入要產生的亂數表要有幾列。內定是1。
 * @param {number} columnCount  傳入要產生的亂數表要有幾欄。內定是1。
 *
 * @param {number} bitsCount    傳入亂數整數的有效位元數。內定是52。(必須介於33與52之間(包含33與52))。
 *
 * @return {Array} 傳回整數的數值陣列。
 */
XorShift_.prototype.randomint_array = function(rowCount, columnCount, bitsCount)
{
  rowCount =    (isNaN(rowCount))    ?  1 : Math.max(1, rowCount);
  columnCount = (isNaN(columnCount)) ?  1 : Math.max(1, columnCount);
  bitsCount =   (isNaN(bitsCount))   ? 52 : Math.max(33, Math.min(52, bitsCount));

  // 把兩個32 bits整數t2U、t2L整合成指定位元數JavaScript整數時，需要的右移位元數、與高位遮罩。
  //
  // :: s = t2 >> (64 - bitsCount)
  //
  // 因為MakeT2_rightShift_bitCount必須介於[12,31]，所以bitsCount只能是[33,52]之間的值。
  // MakeT2_rightShift_bitCount如果小於12，會造成最後的結果d超過52 bits(IEEE754格式的最大精確位元數)。
  // MakeT2_rightShift_bitCount如果大於31，會成(t2L >>> MakeT2_rightShift_bitCount)這個運算失敗。
  //
  // MakeT2_rightShift_DWORD_Gap_bitCount是MakeT2_rightShift_bitCount與DWORD(32 bits)之間的位元數差距。
  //
  // (2016/07/23 Modified by CakeChen)
  const MakeT2_rightShift_bitCount =           64 - bitsCount;
  const MakeT2_rightShift_DWORD_Gap_bitCount = 32 - MakeT2_rightShift_bitCount;
  const MakeT2_t2U_mask =                      0xFFFFFFFF >>> MakeT2_rightShift_DWORD_Gap_bitCount;

  const POW_2_32 = Math.pow(2, 32);

  var resultTable = new Array(rowCount);
  for (var rowIndex = 0; rowIndex < rowCount; rowIndex++)
  {
    resultTable[rowIndex] = new Array(columnCount);
    for (var columnIndex = 0; columnIndex < columnCount; columnIndex++)
    {
      // uint64_t s1 = s[0]
      var s1U = this._state0U, s1L = this._state0L;
      // uint64_t s0 = s[1]
      var s0U = this._state1U, s0L = this._state1L;

      // s[0] = s0
      this._state0U = s0U;
      this._state0L = s0L;

      // - t1 = [0, 0]
      var t1U = 0, t1L = 0;
      // - t2 = [0, 0]
      var t2U = 0, t2L = 0;

      // s1 ^= s1 << 23;
      // :: t1 = s1 << 23
      var a1 = 23;
      var m1 = 0xFFFFFFFF << (32 - a1);
      t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
      t1L = s1L << a1;
      // :: s1 = s1 ^ t1
      s1U = s1U ^ t1U;
      s1L = s1L ^ t1L;

      // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
      // :: t1 = s1 ^ s0
      t1U = s1U ^ s0U;
      t1L = s1L ^ s0L;
      // :: t2 = s1 >> 17
      var a2 = 17;
      var m2 = 0xFFFFFFFF >>> (32 - a2);
      t2U = s1U >>> a2;
      t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
      // :: t1 = t1 ^ t2
      t1U = t1U ^ t2U;
      t1L = t1L ^ t2L;
      // :: t2 = s0 >> 26
      var a3 = 26;
      var m3 = 0xFFFFFFFF >>> (32 - a3);
      t2U = s0U >>> a3;
      t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
      // :: t1 = t1 ^ t2
      t1U = t1U ^ t2U;
      t1L = t1L ^ t2L;

      // s[1] = t1
      this._state1U = t1U;
      this._state1L = t1L;

      // return t1 + s0
      // :: t2 = t1 + s0
      var sumL = (t1L >>> 0) + (s0L >>> 0);
      t2U = (t1U + s0U + (sumL / 2 >>> 31)) >>> 0;
      t2L = sumL >>> 0;

      //!!! (2016/07/16 Remarked by CakeChen)
      //  // :: ret t2
      //  return [t2U, t2L];

      // 把兩個32 bits的整數t2U與t2L，整合指定為位元數的JavaScript整數。
      //
      // :: s = t2 >> (64 - bitsCount)
      //
      // (Modified by CakeChen 2016/07/23)
//!!! Remarked by CakeChen (2016/07/23)
//      // 因為a1必須介於[12,31]，所以bitsCount只能是[33,52]之間的值。
//      // a1如果小於12，會造成最後的結果d超過52 bits(IEEE754格式的最大精確位元數)。
//      // a1如果大於31，會成(t2L >>> a1)這個運算失敗。
//      //
//      // (2016/07/16 Added by CakeChen)
//      var a1 = 64 - bitsCount;  //!!! Modified by CakeChen (2016/07/07)
//      var m1 = 0xFFFFFFFF >>> (32 - a1);
//      sU = t2U >>> a1;
//      sL = (t2L >>> a1) | ((t2U & m1) << (32 - a1));
      sU = (t2U >>> MakeT2_rightShift_bitCount);
      sL = (t2L >>> MakeT2_rightShift_bitCount) | ((t2U & MakeT2_t2U_mask) << MakeT2_rightShift_DWORD_Gap_bitCount);

      // d = (sU << 32) | sL
      //
      // 因為JavaScript的bitwise operator (e.g. shift, bitwise-or)只能處理32 bits，所以只好以乘法與加法來完成。
      //
      // Added by CakeChen (2016/07/03)
      var d = (sU * POW_2_32) + sL;

      resultTable[rowIndex][columnIndex] = d;
    }
  }

  return resultTable;
};

/**
 * Returns a array of 52-bit random number as a JavaScript number. (Modified by CakeChen (2016/07/16))
 * @param {number} rowCount     傳入要產生的亂數表要有幾列。
 * @param {number} columnCount  傳入要產生的亂數表要有幾欄。
 * @return {Array}
 */
XorShift_.prototype.randomint_array_52bits = function(rowCount, columnCount)
{
  return this.randomint_array(rowCount, columnCount, 52);
};

/**
 * Returns a array of 39-bit random number as a JavaScript number. (Modified by CakeChen (2016/07/16))
 * @param {number} rowCount     傳入要產生的亂數表要有幾列。
 * @param {number} columnCount  傳入要產生的亂數表要有幾欄。
 * @return {Array}
 */
XorShift_.prototype.randomint_array_39bits = function(rowCount, columnCount) {
  return this.randomint_array(rowCount, columnCount, 39);
};

/**
 * 傳回整數亂數陣列，陣列中的每個元素只有兩種可能的值：0或1。
 *
 * @param {number} rowCount     傳入要產生的亂數表要有幾列。
 * @param {number} columnCount  傳入要產生的亂數表要有幾欄。
 *
 * @param {number} probability
 *   傳入[0,1]之間的機率值，代表產生1的機率。內定是0.5。
 *   傳入0.0，表示只會產生0。
 *   傳入1.0，表示只會產生1。
 *   傳入0.5，表示產生0與1的機會各一半。
 *   傳入0.7，表示有七成的機會產生1，三成的機會產生0。
 *
 * @param {boolean} isConcatenated
 *   傳入true，表示產生出來的亂數表中，要把每個數值都轉換成數值字串(長度固定是1位數)，
 *   並且把同一列的這些數值字串，都串接在一起，使得每一列都以單一字串的形式呈現。
 *
 * @return {Array} 傳回數值陣列，或字串陣列(isConcatenated = true)。
 */
XorShift_.prototype.random01_array = function(rowCount, columnCount, probability, isConcatenated)
{
  // 不能使用"probability = probability || 0.5;"來判斷，因為0(合法的參數值)會被誤判。
  probability = (isNaN(probability)) ? 0.5 : Math.max(0, Math.min(1, probability));

  const bitsCount = 52;
  const POW_2_52 =  Math.pow(2, bitsCount);
  const probabilityThreshold = POW_2_52 * probability;

  var r = this.randomint_array(rowCount, columnCount, bitsCount);

  rowCount =    r.length;
  columnCount = r[0].length;
  for (var rowIndex = 0; rowIndex < rowCount; rowIndex++)
  {
    var rowArray = r[rowIndex];
    for (var columnIndex = 0; columnIndex < columnCount; columnIndex++)
    {
      if (probabilityThreshold > rowArray[columnIndex])
        rowArray[columnIndex] = 1;
      else
        rowArray[columnIndex] = 0;
    }

    if (isConcatenated)
      r[rowIndex] = rowArray.join("");
  }

  return r;
}

//!!! (2017/07/16 Remarked by CakeChen) 把陣列產生、與數值乘法，全都整合到函式randomint()中。因為在試算表中，這是最常見的使用方式。
///**
// * Returns a 64bit random number as a 2x32bit array
// * @return {array}
// */
//XorShift_.prototype.randomint = function() {
//  // uint64_t s1 = s[0]
//  var s1U = this._state0U, s1L = this._state0L;
//  // uint64_t s0 = s[1]
//  var s0U = this._state1U, s0L = this._state1L;
//
//  // s[0] = s0
//  this._state0U = s0U;
//  this._state0L = s0L;
//
//  // - t1 = [0, 0]
//  var t1U = 0, t1L = 0;
//  // - t2 = [0, 0]
//  var t2U = 0, t2L = 0;
//
//  // s1 ^= s1 << 23;
//  // :: t1 = s1 << 23
//  var a1 = 23;
//  var m1 = 0xFFFFFFFF << (32 - a1);
//  t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
//  t1L = s1L << a1;
//  // :: s1 = s1 ^ t1
//  s1U = s1U ^ t1U;
//  s1L = s1L ^ t1L;
//
//  // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
//  // :: t1 = s1 ^ s0
//  t1U = s1U ^ s0U;
//  t1L = s1L ^ s0L;
//  // :: t2 = s1 >> 17
//  var a2 = 17;
//  var m2 = 0xFFFFFFFF >>> (32 - a2);
//  t2U = s1U >>> a2;
//  t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
//  // :: t1 = t1 ^ t2
//  t1U = t1U ^ t2U;
//  t1L = t1L ^ t2L;
//  // :: t2 = s0 >> 26
//  var a3 = 26;
//  var m3 = 0xFFFFFFFF >>> (32 - a3);
//  t2U = s0U >>> a3;
//  t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
//  // :: t1 = t1 ^ t2
//  t1U = t1U ^ t2U;
//  t1L = t1L ^ t2L;
//
//  // s[1] = t1
//  this._state1U = t1U;
//  this._state1L = t1L;
//
//  // return t1 + s0
//  // :: t2 = t1 + s0
//  var sumL = (t1L >>> 0) + (s0L >>> 0);
//  t2U = (t1U + s0U + (sumL / 2 >>> 31)) >>> 0;
//  t2L = sumL >>> 0;
//
//  // :: ret t2
//  return [t2U, t2L];
//};
//
///**
// * Returns a 33-bit to 52-bit random number as a JavaScript number.
// * (Added by CakeChen (2016/07/07))
// *
// * @param {number} bitsCount The bits count integer number between 33 and 52 (inclusive).
// * @return {number}
// */
//XorShift_.prototype.randomint_between_33_to_52_bits = function(bitsCount) {
//  // :: t2 = randomint()
//  var t2 = this.randomint();
//  var t2U = t2[0];
//  var t2L = t2[1];
//
////!!! Remarked by CakeChen (2016/07/07)
////  // :: e = UINT64_C(0x3FF) << 52
////  var eU = 0x3FF << (52 - 32);
////  var eL = 0;
//
//  // :: s = t2 >> 12
//  //
//  // 因為a1必須介於[12,31]，所以bitsCount只能是[33,52]之間的值。
//  // a1如果小於12，會造成最後的結果d超過52 bits(IEEE754格式的最大精確位元數)。
//  // a1如果大於31，會成(t2L >>> a1)這個運算失敗。
//  //
//  //!!! Modified by CakeChen (2016/07/07)
//  //
//  //var a1 = 12;            //!!! Remarked by CakeChen (2016/07/07)
//  var a1 = 64 - bitsCount;  //!!! Modified by CakeChen (2016/07/07)
//  var m1 = 0xFFFFFFFF >>> (32 - a1);
//  sU = t2U >>> a1;
//  sL = (t2L >>> a1) | ((t2U & m1) << (32 - a1));
//
//  // d = (sU << 32) | sL
//  //
//  // 因為JavaScript的bitwise operator (e.g. shift, bitwise-or)只能處理32 bits，所以只好以乘法與加法來完成。
//  //
//  // Added by CakeChen (2016/07/03)
//  var d = (sU * Math.pow(2, 32)) + sL;
//  return d;
//
////!!! Remarked by CakeChen (2016/07/07)
////  // :: x = e | s
////  var xU = eU | sU;
////  var xL = eL | sL;
////
////  // :: double d = *((double *)&x)
////  CONVERTION_BUFFER.writeUInt32BE(xU, 0, true);
////  CONVERTION_BUFFER.writeUInt32BE(xL, 4, true);
////  var d = CONVERTION_BUFFER.readDoubleBE(0, true);
////
////  // :: d - 1
////  return d - 1;
//};
//
///**
// * Returns a 52-bit random number as a JavaScript number. (Added by CakeChen (2016/07/07))
// * @return {number}
// */
//XorShift_.prototype.randomint_52bits = function() {
//  return this.randomint_between_33_to_52_bits(52);
//};
//
///**
// * Returns a 39-bit random number as a JavaScript number. (Added by CakeChen (2016/07/07))
// * @return {number}
// */
//XorShift_.prototype.randomint_39bits = function() {
//  return this.randomint_between_33_to_52_bits(39);
//};

//!!! Remarked by CakeChen (2016/07/07)
///**
// * Returns a random number normalized [0, 1), just like Math.random()
// * @return {number}
// */
////var CONVERTION_BUFFER = new Buffer(8);                   // !!! Remarked by CakeChen (2016/07/03)
//var CONVERTION_BUFFER = new DataView(new ArrayBuffer(8));  // !!! Modified by CakeChen (2016/07/03)
//XorShift.prototype.random = function() {
//  // :: t2 = randomint()
//  var t2 = this.randomint();
//  var t2U = t2[0];
//  var t2L = t2[1];
//
//  // :: e = UINT64_C(0x3FF) << 52
//  var eU = 0x3FF << (52 - 32);
//  var eL = 0;
//
//  // :: s = t2 >> 12
//  var a1 = 12;
//  var m1 = 0xFFFFFFFF >>> (32 - a1);
//  sU = t2U >>> a1;
//  sL = (t2L >>> a1) | ((t2U & m1) << (32 - a1));
//
//  // :: x = e | s
//  var xU = eU | sU;
//  var xL = eL | sL;
//
//  // :: double d = *((double *)&x)
////  CONVERTION_BUFFER.writeUInt32BE(xU, 0, true);     // !!! Remarked by CakeChen (2016/07/03)
////  CONVERTION_BUFFER.writeUInt32BE(xL, 4, true);     // !!! Remarked by CakeChen (2016/07/03)
////  var d = CONVERTION_BUFFER.readDoubleBE(0, true);  // !!! Remarked by CakeChen (2016/07/03)
//  CONVERTION_BUFFER.setUint32(0, xU, false);         // !!! Modified by CakeChen (2016/07/03)
//  CONVERTION_BUFFER.setUint32(4, xL, false);         // !!! Modified by CakeChen (2016/07/03)
//  var d = CONVERTION_BUFFER.getFloat64(0, false);    // !!! Modified by CakeChen (2016/07/03)
//
//  // :: d - 1
//  return d - 1;
//};


//!!! Remarked by CakeChen (2016/07/07)
//
//// There is nothing particularly scientific about this seed, it is just
//// based on the clock.
//module.exports = new XorShift([
//  0, Date.now() / 65536,
//  0, Date.now() % 65536
//]);
//
//// Perform 20 iterations in the RNG, this prevens a short seed from generating
//// pseudo predictable number.
//(function () {
//  var rng = module.exports;
//  for (var i = 0; i < 20; i++) {
//    rng.randomint();
//  }
//})();
