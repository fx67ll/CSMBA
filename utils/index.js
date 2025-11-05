import moment from '@/node_modules/moment';
import CryptoJS from '@/node_modules/crypto-js';

// 快速排序
export function quickSort(tempArr) {
  //递归终止条件
  if (tempArr.length <= 1) {
    return tempArr;
  }
  //取基准
  var pivotIndex = Math.floor(tempArr.length / 2);
  var pivot = tempArr.splice(pivotIndex, 1);
  //分左右
  var leftArr = [];
  var rightArr = [];
  for (var i = 0; i < tempArr.length; i++) {
    if (tempArr[i] > pivot) {
      rightArr.push(tempArr[i]);
    } else {
      leftArr.push(tempArr[i]);
    }
  }
  return quickSort(leftArr).concat(pivot, quickSort(rightArr));
}

// 返回一个范围的随机整数
export function getRandomInt(min, max) {
  const minNum = parseInt(min) || 0;
  const maxNum = parseInt(max) || 1023;
  return Math.floor(Math.random() * maxNum) + minNum;
}

// 比较一个时间字符串和当前时间的天数间隔
export function diffTimeStrFromNow(timeStr) {
  // momentObj.diff(comparedMomentObj, 'units');
  // momentObj 是要比较的 Moment 对象，comparedMomentObj 是被比较的 Moment 对象，units 是可选参数，表示时间间隔的单位。
  // 以下是一些常用的时间间隔单位：
  // years-年数、months-月数、weeks-周数、days-天数、hours-小时数、minutes-分钟数、 seconds-秒数、milliseconds-毫秒数
  return moment(timeStr, 'YYYY-MM-DD HH:mm:ss').diff(moment(), 'hours');
}

// 解密函数
export function decryptString(encryptedText, key) {
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, key);
  const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedText;
}

// 判断一个数字是否在某个数字数组中至少出现过三次
export function hasNumberAppearedTwiceOrMore(arr, num) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === num) {
      count++;

      if (count >= 3) {
        return true;
      }
    }
  }
  return false;
}

// 校验两个字符串格式是否一致
function compareStringFormats(str1, str2) {
  if (str1.includes('-') && str2.includes('-')) {
    const backArr1 = str1.split('-')[1].split(',');
    const backArr2 = str2.split('-')[1].split(',');
    return backArr1.length === backArr2.length;
  }
  const backArr1 = str1.split(',');
  const backArr2 = str2.split(',');
  return backArr1.length === backArr2.length;
}

// 校验传参
function validateStr(str1, str2) {
  if (!str1 || !str2) {
    console.error('校验字符串和目标字符串均不能为空！');
    return false;
  }

  // 使用正则表达式匹配大乐透和双色球两种格式
  const patternRegexForDLTSSQ = /^(?:(?:[1-9]|[12][0-9]|3[0-5])(?:,(?:[1-9]|[12][0-9]|3[0-5])){3,5})-(?:[1-9]|1[0-6])(?:,(?:[1-9]|1[0-6]))?$/;
  // 使用正则表达式匹配排列三和排列五两种格式
  const patternRegexForPL35 = /^(?:\d(?:,\d){2}|\d(?:,\d){4})$/;
  // 使用正则表达式匹配七星彩格式
  // TO-DO
  if (
    !(patternRegexForDLTSSQ.test(str1.trim()) || patternRegexForPL35.test(str1.trim())) ||
    !(patternRegexForDLTSSQ.test(str2.trim()) || patternRegexForPL35.test(str2.trim()))
  ) {
    console.error('校验字符串格式错误，请使用 1,4,5,8,10,23-5 或者 4,7,8,10,23-4,9 格式的字符串！');
    return false;
  }

  // 校验两个字符串格式是否一致
  if (!compareStringFormats(str1, str2)) {
    console.error('校验字符串和目标字符串格式不一致！');
    return false;
  }

  return true;
}

// 比较购买的号码和中奖号码有几个数字相同
export function compareStringsBasic(str1, str2) {
  if (!validateStr(str1, str2)) {
    return 0;
  }
  // 对比前半区号码
  const arr1 = str1.split('-')[0].split(',');
  const arr2 = str2.split('-')[0].split(',');
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  const intersection1 = new Set([...set1].filter(x => set2.has(x)));
  const count1 = intersection1.size || 0;
  // 对比后半区号码
  const arr3 = str1.split('-')[1].split(',');
  const arr4 = str2.split('-')[1].split(',');
  const set3 = new Set(arr3);
  const set4 = new Set(arr4);
  const intersection2 = new Set([...set3].filter(x => set4.has(x)));
  const count2 = intersection2.size || 0;
  // 返回相同数字
  return count1 + count2;
}

// 判断是否是最低中奖标准
export function compareStringsCheckIsLowestReward(str1, str2) {
  if (!validateStr(str1, str2)) {
    return false;
  }
  // 对比后半区号码
  const backStr1 = str1.split('-')[1];
  const backStr2 = str2.split('-')[1];
  return backStr1 === backStr2;
}

// 返回中奖信息
export function checkLotteryResult(lotteryType, recordNumStr, winNumStr) {
  const frontNumbers = recordNumStr.split('-')[0].split(',');
  const backNumbers = recordNumStr.split('-')[1].split(',');
  const winningFrontNumbers = winNumStr.split('-')[0].split(',');
  const winningBackNumbers = winNumStr.split('-')[1].split(',');

  // console.log(lotteryType, frontNumbers, backNumbers, winningFrontNumbers, winningBackNumbers);

  const result = {
    prizeLevel: 0,
    prizeText: '',
    prizeAmount: 0,
  };

  const frontMatchCount = frontNumbers.filter(num => winningFrontNumbers.includes(num)).length;
  const backMatchCount = backNumbers.filter(num => winningBackNumbers.includes(num)).length;
  const totalMatchCount = frontMatchCount + backMatchCount;

  if (lotteryType === 1) {
    // 一等奖奖金为浮动奖金
    // 二等奖奖金为浮动奖金
    // 三等奖固定奖金10000元
    // 四等奖固定奖金3000元
    // 五等奖固定奖金300元
    // 六等奖固定奖金200元
    // 七等奖固定奖金100元
    // 八等奖固定奖金15元
    // 九等奖固定奖金5元
    switch (totalMatchCount) {
      case 7:
        result.prizeLevel = 1;
        result.prizeText = '一等奖';
        result.prizeAmount = 10000000;
        break;
      case 6:
        if (backMatchCount === 2) {
          result.prizeLevel = 4;
          result.prizeText = '四等奖';
          result.prizeAmount = 3000;
        } else if (backMatchCount === 1) {
          result.prizeLevel = 2;
          result.prizeText = '二等奖';
          result.prizeAmount = 5000000;
        }
        break;
      case 5:
        if (backMatchCount === 2) {
          result.prizeLevel = 6;
          result.prizeText = '六等奖';
          result.prizeAmount = 200;
        } else if (backMatchCount === 1) {
          result.prizeLevel = 5;
          result.prizeText = '五等奖';
          result.prizeAmount = 300;
        } else {
          result.prizeLevel = 5;
          result.prizeText = '三等奖';
          result.prizeAmount = 10000;
        }
        break;
      case 4:
        if (backMatchCount > 0) {
          result.prizeLevel = 8;
          result.prizeText = '八等奖';
          result.prizeAmount = 15;
        } else {
          result.prizeLevel = 7;
          result.prizeText = '七等奖';
          result.prizeAmount = 100;
        }
        break;
      case 3:
        result.prizeLevel = 9;
        result.prizeText = '九等奖';
        result.prizeAmount = 5;
        break;
      case 2:
        if (backMatchCount === 2) {
          result.prizeLevel = 9;
          result.prizeText = '九等奖';
          result.prizeAmount = 5;
        }
        break;
      default:
        result.prizeText = '未中奖';
        break;
    }
  }

  if (lotteryType === 2) {
    // 一等奖奖金为浮动奖金
    // 二等奖奖金为浮动奖金
    // 三等奖固定奖金3000元
    // 四等奖固定奖金200元
    // 五等奖固定奖金10元
    // 六等奖固定奖金5元
    switch (totalMatchCount) {
      case 7:
        result.prizeLevel = 1;
        result.prizeText = '一等奖';
        result.prizeAmount = 5000000;
        break;
      case 6:
        if (backMatchCount === 1) {
          result.prizeLevel = 3;
          result.prizeText = '三等奖';
          result.prizeAmount = 3000;
        } else {
          result.prizeLevel = 2;
          result.prizeText = '二等奖';
          result.prizeAmount = 100000;
        }
        break;
      case 5:
        result.prizeLevel = 4;
        result.prizeText = '四等奖';
        result.prizeAmount = 200;
        break;
      case 4:
        result.prizeLevel = 5;
        result.prizeText = '五等奖';
        result.prizeAmount = 10;
        break;
      case 3:
        if (backMatchCount === 1) {
          result.prizeLevel = 6;
          result.prizeText = '六等奖';
          result.prizeAmount = 5;
        }
        break;
      case 2:
        if (backMatchCount === 1) {
          result.prizeLevel = 6;
          result.prizeText = '六等奖';
          result.prizeAmount = 5;
        }
        break;
      case 1:
        if (backMatchCount === 1) {
          result.prizeLevel = 6;
          result.prizeText = '六等奖';
          result.prizeAmount = 5;
        }
        break;
      default:
        result.prizeText = '未中奖';
        break;
    }
  }

  // console.log(result);
  return result;
}

// 返回当日号码类型
export function mapLotteryNumberType(todayWeek) {
  if (todayWeek === '1' || todayWeek === '3' || todayWeek === '6') {
    return '1';
  } else if (todayWeek === '2' || todayWeek === '4' || todayWeek === '7') {
    return '2';
  } else {
    return '';
  }
}

// 按出现频次从高到低返回数字，可以指定返回数组的最大长度
export function sortNumberByFrequency(arr, maxLength) {
  // 使用对象来统计数字出现的次数
  let count = {};
  arr.forEach(num => {
    count[num] = (count[num] || 0) + 1;
  });

  // 将对象转换为数组，并按出现次数和先后顺序排序
  let sorted = Object.entries(count).sort((a, b) => {
    if (a[1] !== b[1]) {
      return b[1] - a[1]; // 按出现次数从高到低排序
    } else {
      return arr.indexOf(parseInt(a[0])) - arr.indexOf(parseInt(b[0])); // 如果出现次数相同，按先后顺序排序
    }
  });

  // 提取排序后的数字
  let result = sorted.map(item => parseInt(item[0]));

  // 根据传入的最大长度截取数组
  if (maxLength && maxLength < result.length) {
    result = result.slice(0, maxLength);
  }

  return result;
}

// 将数字数组按从小到大的顺序排列并返回
export function sortNumberByAscending(arr) {
  return arr.slice().sort((a, b) => a - b);
}

// 该方法传递两个参数，分别为上一个日期和当前日期
// 首先判断，上一个日期和当前日期是否是同年，如果不同年直接返回false，不再作其他判断
// 然后判断，当前日期是否是上一个日期的两天后，并判断两个日期之间是否有星期五的情况存在，如果有，则判断当前日期是否为上一个日期的三天后
// 最后，如果没有星期五且间隔两天，就返回true，如果有星期五且间隔三天，也返回true，其余情况返回false
export function isTwoOrThreeDaysAfterWithSameYearCheck(previousDate, currentDate) {
  if (!previousDate || !currentDate) {
    return false;
  }

  // 将输入的日期字符串转换为moment对象
  const prevDate = moment(previousDate, 'YYYY-MM-DD');
  const currDate = moment(currentDate, 'YYYY-MM-DD');

  if (!prevDate || !currDate) {
    return false;
  }

  // 首先检查年份是否相同
  if (prevDate.year() !== currDate.year()) {
    return false; // 如果年份不同，直接返回false
  }

  // 计算两个日期之间的天数差异
  const diffDays = currDate.diff(prevDate, 'days');

  // 初始化星期五的存在标志为false
  let hasFriday = false;

  // 遍历两个日期之间的每一天，检查是否存在星期五
  for (let i = 1; i < diffDays; i++) {
    if (prevDate.clone().add(i, 'days').day() === 5) {
      hasFriday = true;
      break;
    }
  }

  // 根据是否存在星期五以及日期间隔，返回相应的布尔值
  if (hasFriday && diffDays === 3) {
    // 如果存在星期五且日期间隔为三天，则返回true
    return true;
  } else if (!hasFriday && diffDays === 2) {
    // 如果不存在星期五且日期间隔为两天，则返回true
    return true;
  } else {
    // 其他所有情况返回false
    return false;
  }
}

// 1、大乐透 2、双色球 3、七星彩
export function calculateCurrentDateCode(type, currentDateStr, lastDateStr, lastNumber) {
  try {
    // 验证类型参数
    if (type !== 1 && type !== 2 && type !== 3) {
      console.error(`无效的类型参数 "${type}"。只允许 1、2 或 3。`);
      return null;
    }

    // 解析日期字符串
    const currentDate = moment(currentDateStr);
    const lastDate = moment(lastDateStr);

    // 检查日期是否有效
    if (!currentDate.isValid()) {
      console.error(`无效的当前日期格式 "${currentDateStr}"`);
      return null;
    }

    if (!lastDate.isValid()) {
      console.error(`无效的最后记录日期格式 "${lastDateStr}"`);
      return null;
    }

    // 如果当前日期等于最后记录日期，直接返回最后记录的数字
    if (currentDate.isSame(lastDate, 'day')) {
      return lastNumber;
    }

    // 如果当前日期早于最后记录日期，返回 null
    if (currentDate.isBefore(lastDate)) {
      console.error(`当前日期 (${currentDate.format('YYYY-MM-DD')}) 早于最后记录日期 (${lastDate.format('YYYY-MM-DD')})`);
      return null;
    }

    // 定义记录日的星期值
    let recordDays;
    switch (type) {
      case 1: // 周一、周三、周六
        recordDays = [1, 3, 6];
        break;
      case 2: // 周二、周四、周日
        recordDays = [2, 4, 0];
        break;
      case 3: // 周二、周五、周日
        recordDays = [2, 5, 0];
        break;
      default:
        // 这行理论上不会执行，因为前面已经验证过类型
        console.error(`未处理类型 "${type}"`);
        return null;
    }

    // 计算起始日期（最后记录日期的下一天）
    const start = lastDate.clone().add(1, 'days');
    const end = currentDate.clone();

    // 计算总天数（包含起始和结束日期）
    const totalDays = end.diff(start, 'days') + 1;

    // 计算完整周数和剩余天数
    const fullWeeks = Math.floor(totalDays / 7);
    const remainDays = totalDays % 7;

    // 完整周中的记录日数量（每周3次）
    const fullWeekRecords = fullWeeks * 3;

    // 计算剩余天数中的记录日数量
    let remainRecords = 0;
    let tempDate = start.clone();

    for (let i = 0; i < remainDays; i++) {
      const dayOfWeek = tempDate.day(); // 0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
      if (recordDays.includes(dayOfWeek)) {
        remainRecords++;
      }
      tempDate.add(1, 'day');
    }

    // 总记录次数 = 完整周记录 + 剩余天记录
    const totalRecords = parseInt(fullWeekRecords) + parseInt(remainRecords);

    // 当前数字 = 最后记录数字 + 总记录次数
    return parseInt(lastNumber) + parseInt(totalRecords);
  } catch (error) {
    // 发生任何错误时返回 null 并打印错误信息
    console.error(`计算过程中发生意外错误: ${error.message}`);
    console.error(error.stack);
    return null;
  }
}

/**
 * 从富文本中提取图片并预览
 * @param {string} richText - 富文本字符串
 * @param {number} [startIndex=0] - 初始显示的图片索引，默认0
 */
export function previewImagesFromRichText(richText, startIndex = 0) {
  if (!richText || typeof richText !== 'string') {
    console.error('请传入有效的富文本字符串');
    return;
  }

  // 提取富文本中所有img标签的src属性
  const imgReg = /<img[^>]+src=["']([^"']+)["']/gi;
  const imageUrls = [];
  let match;

  // 循环匹配所有图片地址
  while ((match = imgReg.exec(richText)) !== null) {
    if (match[1]) {
      imageUrls.push(match[1]);
    }
  }

  if (imageUrls.length === 0) {
    uni.showToast({
      title: '富文本没有解析出图片标签！',
      icon: 'none',
      duration: 1998,
    });
    return;
  }

  // 处理初始索引，确保在有效范围内
  const currentIndex = Math.max(0, Math.min(startIndex, imageUrls.length - 1));
  const currentUrl = imageUrls[currentIndex];

  // 预览图片
  uni.previewImage({
    urls: imageUrls,
    current: currentUrl,
    indicator: 'number',
    loop: true,
    longPressActions: {
      itemList: ['保存图片'],
      success: function (res) {
        if (res.tapIndex === 0) {
          // 检查相册权限
          checkPhotoPermission(() => {
            saveImageToAlbum(res.url);
          });
        }
      },
      fail: function (err) {
        console.error('长按操作失败', err);
      },
    },
    fail: function (err) {
      console.error('预览图片失败', err);
      uni.showToast({
        title: '预览图片失败',
        icon: 'none',
      });
    },
  });
}

/**
 * 检查并申请相册权限
 * @param {Function} success - 权限获取成功后的回调
 */
function checkPhotoPermission(success) {
  uni.getSetting({
    success: res => {
      // 检查是否有相册写入权限
      if (!res.authSetting['scope.writePhotosAlbum']) {
        // 申请权限
        uni.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => {
            success();
          },
          fail: () => {
            // 用户拒绝授权，引导去设置页面开启
            uni.showModal({
              title: '权限提示',
              content: '需要开启相册权限才能保存图片',
              confirmText: '去设置',
              cancelText: '取消',
              success: modalRes => {
                if (modalRes.confirm) {
                  uni.openSetting({
                    success: settingRes => {
                      // 检查用户是否在设置中开启了权限
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        success();
                      } else {
                        uni.showToast({
                          title: '未开启相册权限，无法保存',
                          icon: 'none',
                        });
                      }
                    },
                  });
                }
              },
            });
          },
        });
      } else {
        // 已有权限，直接执行操作
        success();
      }
    },
    fail: err => {
      console.error('获取权限设置失败', err);
      uni.showToast({
        title: '获取权限失败',
        icon: 'none',
      });
    },
  });
}

/**
 * 保存图片到相册
 * @param {string} imageUrl - 图片地址
 */
function saveImageToAlbum(imageUrl) {
  // 先下载图片到本地
  uni.downloadFile({
    url: imageUrl,
    success: downloadRes => {
      if (downloadRes.statusCode === 200) {
        // 保存图片到相册
        uni.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath,
          success: () => {
            uni.showToast({
              title: '图片保存成功',
              icon: 'success',
            });
          },
          fail: err => {
            console.error('保存图片失败', err);
            uni.showToast({
              title: '保存图片失败',
              icon: 'none',
            });
          },
        });
      } else {
        console.error('下载图片失败', downloadRes);
        uni.showToast({
          title: '下载图片失败',
          icon: 'none',
        });
      }
    },
    fail: err => {
      console.error('下载图片请求失败', err);
      uni.showToast({
        title: '下载图片失败',
        icon: 'none',
      });
    },
  });
}
