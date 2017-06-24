/**
 * 把數值轉換成字串。功能與函式Number.prototype.toString()類似，但是有下列不同：
 *   - 如果傳入的數值num是負數，這個函式會傳回該數值的二補數。(亦即，傳回的字串前面不會有負號(-)。)
 *   - 傳回的字串，長度會固定是digitCount位數。(必要時，前面會補上0。)
 *
 * 限制：
 *   - num必須是整數，否則結果不可預期。(會含有小數點。)
 *   - abs(num)必須小於Math.pow(radix, digitCount)，否則結果不可預期。
 *   - digitCount必須是大於零的正整數，否則結果不可預期。
 *   - Math.pow(radix, digitCount)必須小於Math.pow(2,53)，否則結果不可預測。
 *     這是因為JavaScript是以IEEE754的格式記載數值，而該格式的最大準確位元只能表達到(Math.pow(2,53)-1)。
 *
 * @param {number} num 傳入要被轉換成字串的數值。
 * @param {number} radix 傳入要轉換成基底是幾進制的數值的字串。必須是介於2到36之間的正整數。
 * @param {number} digitCount 傳入轉換出來的字串長度要有幾位數字。
 * @return {string}
 */
function Number_ToString_ByRadix_TwosComplement_LeadingPadding_(num, radix, digitCount)
{
  return (
           (num)                          // Truncate? (not yet)
           + Math.pow(radix, digitCount)  // 如果num是負數，這可以把它轉換成二補數。
                                          // 如果num是正數(或零)，這可以在它前面補上足夠的零。
         )
         .toString(radix)                 // Convert to string 
         .slice(-digitCount)              // 擷取指定的固定位數。
         .toUpperCase()
         ;
}

/**
 * 把指定整數轉換成10位十六進制(也就是40 bits)格式的字串。
 */
function Number_ToString_Hex10_(num)
{
  return Number_ToString_ByRadix_TwosComplement_LeadingPadding_(num, 16, 10);
}
