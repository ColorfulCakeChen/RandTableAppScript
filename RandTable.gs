
//function onInstall(e)
//{
//  onOpen(e);
//}
//
//function onOpen(e)
//{
//  SpreadsheetApp.getUi().createAddonMenu()
//    .addItem("RandTable", "tt")
//    .addToUi();
//}
//
///**
// * @customFunction
// */
function tt_()
{
  Logger.log("Hi");
  //ByteArray_to_IntArray([0,1,0]);
  RandTable_01(0, false, 1, 10);
}

/**
 * Generating a random table.
 * 每個值都是介於0到((2^39) - 1)之間的整數值。
 *
 * @param {number}  seed 傳入亂數產生器的種子數值。
 *
 * @param {boolean} isSeedAddFileId
 *   傳入true，表示種子數值要再加上這個Google Spreadsheet的fileId，
 *   以便在不同試算表檔案中，產生不同的亂數序列。
 *
 * @param {number}  rowCount     傳入要產生的亂數表要有幾列。
 * @param {number}  columnCount  傳入要產生的亂數表要有幾欄。
 *
 * @param {boolean} isHexConcatenated
 *   傳入true，表示產生出來的亂數表中，要把每個數值都轉換成十六進制的數值字串(長度固定是10位數)，
 *   並且把同一列的這些數值字串，都串接在一起，使得每一列都以單一字串的形式呈現。
 *
 * @return {Array} 傳回數值陣列，或字串陣列(isHexConcatenated = true)。
 *
 * @customfunction
 */
function RandTable_int_39bits(seed, isSeedAddFileId, rowCount, columnCount, isHexConcatenated)
{
  var theRNG = RandNumberGenerator_prepare_(seed, isSeedAddFileId);

  // 因為Google Sheet的函式HEX2DEC()只能處理40 bits的整數值，而且最高位元固定用來表示正負號，
  // 所以我們只能產生39 bits的亂數整數值
  var resultTable = theRNG.randomint_array_39bits(rowCount, columnCount);  // (2016/07/16 Modified by CakeChen)

  // 把同一列的所有數值，轉換成十六進制(這樣每個數值轉換成字串後才會等長度)的數值字串，並且串接成單一字串。
  if (isHexConcatenated)
  {
    rowCount =    resultTable.length;
    columnCount = resultTable[0].length;

    var rowArray = new Array(columnCount);
    for (rowIndex = 0; rowIndex < rowCount; rowIndex++)
    {
      for (columnIndex = 0; columnIndex < columnCount; columnIndex++)
      {
        rowArray[columnIndex] = Number_ToString_Hex10_(resultTable[rowIndex][columnIndex]);
      }
      resultTable[rowIndex] = rowArray.join("");
    }
  }

  return resultTable;
}

/**
 * 傳回整數亂數陣列，陣列中的每個元素只有兩種可能的值：0或1。
 *
 * @param {number}  seed 傳入亂數產生器的種子數值。
 *
 * @param {boolean} isSeedAddFileId
 *   傳入true，表示種子數值要再加上這個Google Spreadsheet的fileId，
 *   以便在不同試算表檔案中，產生不同的亂數序列。
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
 *
 * @customfunction
 */
function RandTable_01(seed, isSeedAddFileId, rowCount, columnCount, probability, isConcatenated)
{
  var theRNG = RandNumberGenerator_prepare_(seed, isSeedAddFileId);
  var resultTable = theRNG.random01_array(rowCount, columnCount, probability, isConcatenated);
  return resultTable;
}

/**
 * 根據指定的種子，產生並初始化一個亂數產生器。
 *
 * @param {number}  seed 傳入亂數產生器的種子數值。
 *
 * @param {boolean} isSeedAddFileId
 *   傳入true，表示種子數值要再加上這個Google Spreadsheet的fileId，
 *   以便在不同試算表檔案中，產生不同的亂數序列。
 *
 * @return {XorShift_} 傳回已經初始化完畢的亂數產生器。
 */
function RandNumberGenerator_prepare_(seed, isSeedAddFileId)
{
  var seedArray = SeedArray_prepare_(seed, isSeedAddFileId);  // 準備種子數值陣列。
  var theRNG =    new XorShift_(seedArray);                   // 初始化亂數產生器。

  // Perform 20 iterations in the RNG, this prevens a short seed from generating
  // pseudo predictable number.
  theRNG.randomint_array(1, 20);  // (2016/07/16 Modified by CakeChen)

  return theRNG;
}

/**
 * 產生供亂數產生器使用的種子數值陣列。
 *
 * @param {number}  seed 傳入亂數產生器的種子數值整數。
 *
 * @param {boolean} isSeedAddFileId
 *   傳入true，表示種子數值要再加上這個Google Spreadsheet的fileId，
 *   以便在不同試算表檔案中，產生不同的亂數序列。
 *
 * @return {Array} 傳回具有四個元素的整數陣列。
 */
function SeedArray_prepare_(seed, isSeedAddFileId)
{
  seed = seed || 0;

  // 準備種子數值。
  var seedArray = Int_to_IntArray4_(seed);
  if (isSeedAddFileId)
  {
    var fileId = SpreadsheetApp.getActiveSpreadsheet().getId();

    // 選用MD5，只是因為它的運算結果是128 bits，正好符合XorShift的需要。
    var fileId_hash_byteArray = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, fileId);
    var fileId_hash_intArray = ByteArray_to_IntArray_(fileId_hash_byteArray);
 
    seedArray[0] += fileId_hash_intArray[0]; 
    seedArray[1] += fileId_hash_intArray[1]; 
    seedArray[2] += fileId_hash_intArray[2]; 
    seedArray[3] += fileId_hash_intArray[3]; 
  }

  // 確保有非零的種子數值。
  if (seedArray[0] || seedArray[1] || seedArray[2] || seedArray[3])
    ;   // 如果至少有一個種子數值不是零，那就不需要再調整種子數值。
  else  // 否則，種子數值全部都是零，亂數產生器永遠只會產生數值零。此時至少給一些不是零的值。
    seedArray[0] = seedArray[1] = seedArray[2] = seedArray[3] = 1;

  return seedArray;
}

/** 把正整數(64bits)分散到4個元素的數值陣列。
 * @param {number} theInteger 傳入正整數。
 * @return {Array} 傳回有4個元素的數值陣列。
 */
function Int_to_IntArray4_(theInteger)
{
  const DIVISOR_2_POW_16 = Math.pow(2, 16);  // 把64bits分成4份，每一份有64/4=16bits。

  var theQuotient = Math.abs(theInteger);    // 只能處理正整數。
  var intArray = new Array(4);
  for (var i = 0; i < intArray.length; i++)
  {
    intArray[i] = theQuotient % DIVISOR_2_POW_16;
    theQuotient = (theQuotient - intArray[i]) / DIVISOR_2_POW_16;
  }
  return intArray;
}

/**
 * 把byte array整合成integer array。(每4個byte，整合成1個integer。)
 * @param {Array} 傳入Byte[]。
 * @return {Array} 傳回Integer[]。
 */
function ByteArray_to_IntArray_(byteArray)
{
  const BIT_COUNT_PER_BYTE = 8;
  const BIT_COUNT_PER_INT = 32;
  const BYTE_COUNT_PER_INT = BIT_COUNT_PER_INT / BIT_COUNT_PER_BYTE;
  const POW_2_8 = Math.pow(2, BIT_COUNT_PER_BYTE);

  //!!! For Test
  //Logger.log(byteArray);
  //return JSON.stringify(byteArray);

  var intCount = Math.ceil(byteArray.length / BYTE_COUNT_PER_INT);
  var intArray = new Array(intCount);

  var byteArrayIndex = 0;
  for (var i = 0; i < intCount; i++)
  {
    intArray[i] = 0;

    var k = Math.min((byteArray.length - byteArrayIndex - 1), (BYTE_COUNT_PER_INT - 1));
    for (; k >= 0; k--)
    {
      // 使用乘法(而不是bitwise-shift-left operator)，是為了避免把第31 bit是1的數值，誤認為是負數。
      intArray[i] *= POW_2_8; 

      // 去掉8 bit數值的符號位元，擴展成32 bit整數。以免把大於127的數值誤認為是負數。
      var unsignedInteger = (byteArray[byteArrayIndex + k] & 0xFF);

      // 使用乘法(而不是bitwise-shift-left operator)，是為了避免把第31 bit是1的數值，誤認為是負數。
      intArray[i] += unsignedInteger;
    }
//    intArray[i] <<= 0;

    byteArrayIndex += BYTE_COUNT_PER_INT;
  }
  
  //!!! For Test
  //return intArray.length;
  return intArray;
}
