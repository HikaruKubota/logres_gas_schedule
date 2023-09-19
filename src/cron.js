/**
 * 毎日8~22時に起動するTrigger
 * 開催されている時限イベントをチェックし、通知する。
 */
const noticeTimedEventsMain = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('石回収管理表');
  const common = commonPublicFunctions();

  /**
   * 現在開催中の行を取得
   */
  const timedEventColumn = common.findColumnByHeader(sheet, '開催時間')
  const lastRow = sheet.getMaxRows();
  const timedEvents = sheet.getRange(1, timedEventColumn, lastRow, 1).getValues();

  const today = new Date()
  const nowHours = today.getHours()

  const nowTimedEventsRows = timedEvents.map((e, i) => {
    if(e == '' || e == '開催時間' || e == '常時') return undefined
    // sample: e = [8:00～8:59 / 12:00～12:59 / 20:00～20:59 / 24:00～24:59]
    const targetHours = e[0].split('/').map(ee => ee.split(':')[0])
    console.log(targetHours)
    const result = targetHours.find(ee => ee == nowHours)
    return result ? i + 1 : undefined
  }).filter(e => {
    return e
  })

  /**
   * Rowsから何が今日が期限かを取得する。
   */
  const detailColumn = common.findColumnByHeader(sheet, '詳細')
  const itemColumn = common.findColumnByHeader(sheet, '中項目')
  const nowTimedEventsDetails = nowTimedEventsRows.map((row) => {
    return {
      row: row,
      item: sheet.getRange(row, itemColumn).getValue(),
      detail: sheet.getRange(row, detailColumn).getValue()
    }
  })

  /**
   * メッセージ送信部分
   */
  const message =
`現在開催中のイベントです！

${
  nowTimedEventsDetails.length != 0 ? nowTimedEventsDetails.map(e => e.item + ' - ' + e.detail).reduce((a, c) => {
  return a + '・' + c + '\n'
  }, '') : ''
}
`
  if(nowTimedEventsDetails.length != 0) common.sendMessageToDiscord(message)
}


/**
 * 毎日5時に起動するTrigger
 * 1.期限が今日の物をDiscordに通知
 * todo: ほぼコピペで作ったため、かなりコードが被っている。
 * refactoringする。
 */
const noticeDeadlinesMain = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('石回収管理表');
  const common = commonPublicFunctions();

  /**
   * 期限が今日のRowを取得
   */
  const deadlineColumn = common.findColumnByHeader(sheet, '期限')
  const lastRow = sheet.getMaxRows();
  const deadlines = sheet.getRange(1,deadlineColumn,lastRow,1).getValues();

  const today = new Date()
  const ck = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const deadRows = deadlines.map((e, i) => {
    if(e == '' || e == '期限') return undefined
    const targetDate = new Date(e)
    const t_yyyy = targetDate.getFullYear();
    const t_mm = ('00' + targetDate.getMonth()+1).slice(-2);
    const t_dd = ('00' + targetDate.getDate()).slice(-2);
    const c_yyyy = ck.getFullYear();
    const c_mm = ('00' + ck.getMonth()+1).slice(-2);
    const c_dd = ('00' + ck.getDate()).slice(-2);
    const t = "" + t_yyyy + t_mm + t_dd
    const c = "" + c_yyyy + c_mm + c_dd
    console.log({t})
    console.log({c})
    return +t == +c ? i + 1 : undefined
  }).filter(e => {
    return e
  })

  /**
   * Rowsから何が今日が期限かを取得する。
   */
  const detailColumn = common.findColumnByHeader(sheet, '詳細')
  const itemColumn = common.findColumnByHeader(sheet, '中項目')
  const deadDetails = deadRows.map((deadRow) => {
    return {
      row: deadRow,
      item: sheet.getRange(deadRow, itemColumn).getValue(),
      detail: sheet.getRange(deadRow, detailColumn).getValue()
    }
  })

  /**
   * メッセージ送信部分
   */
  const message =
`本日、期限の物は下記となります。

${
  deadDetails.length != 0 ? deadDetails.map(e => e.item + ' - ' + e.detail).reduce((a, c) => {
  return a + '・' + c + '\n'
  }, '') : '本日、期限の物はありません。\n'
}
https://docs.google.com/spreadsheets/d/1DHWZMRe7utMagIqEP7YJr3Yqe7PrFGpsA44PXprL6ik/edit#gid=0&fvid=671968663
`
  common.sendMessageToDiscord(message)
}

/**
 * 毎日3時に起動するTrigger
 * 1.期限が切れている物の期限を更新
 *  ・神獣：期限＋３日
 *  ・王国勲章：次の週末、月末
 *  ・属性試練,クロノスの試練：来月の第三水曜日
 *  ・宝石の神獣：XXXXちょっとめんどくさいので考える。次の最終週の水曜日
 *  ・六花の試練：４週間後の水曜日
 *  ・期限を更新した物は全て未完了にする。
 */
const updateDeadlinesMain = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('石回収管理表');
  const common = commonPublicFunctions();

  /**
   * 期限の切れているRowを取得
   */
  const deadlineColumn = common.findColumnByHeader(sheet, '期限')
  const lastRow = sheet.getMaxRows();
  const deadlines = sheet.getRange(1,deadlineColumn,lastRow,1).getValues();

  const today = new Date()
  const ck = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const deadRows = deadlines.map((e, i) => {
    if(e == '' || e == '期限') return undefined
    const targetDate = new Date(e)
    const t_yyyy = targetDate.getFullYear();
    const t_mm = ('00' + targetDate.getMonth()+1).slice(-2);
    const t_dd = ('00' + targetDate.getDate()).slice(-2);
    const c_yyyy = ck.getFullYear();
    const c_mm = ('00' + ck.getMonth()+1).slice(-2);
    const c_dd = ('00' + ck.getDate()).slice(-2);
    const t = "" + t_yyyy + t_mm + t_dd
    const c = "" + c_yyyy + c_mm + c_dd
    console.log({t})
    console.log({c})
    return +t <= +c ? i + 1 : undefined
  }).filter(e => {
    return e
  })

  /**
   * 期限切れのRowから何が期限切れかを取得する。
   * 9月3日
   * 詳細に被りがないため、詳細の文言で判定する。
   */
  const classificationColumn = common.findColumnByHeader(sheet, '分類')
  const itemColumn = common.findColumnByHeader(sheet, '中項目')
  const detailColumn = common.findColumnByHeader(sheet, '詳細')

  const deadDetails = deadRows.map((deadRow) => {
    return {
      row: deadRow,
      classification: sheet.getRange(deadRow, classificationColumn).getValue(),
      item: sheet.getRange(deadRow, itemColumn).getValue(),
      detail: sheet.getRange(deadRow, detailColumn).getValue()
    }
  })

  /**
   * 更新処理呼び出し
   */
  updateDeadlines(sheet, deadDetails, deadlineColumn)

  /**
   * メッセージ送信部分
   */
  const message =
`スケジュールを更新します。
下記が更新対象です。

${
  deadDetails.length != 0 ? deadDetails.map(e => e.item + ' - ' + e.detail).reduce((a, c) => {
  return a + '・' + c + '\n'
  }, '') : '更新対象はありません。\n'
}
https://docs.google.com/spreadsheets/d/1DHWZMRe7utMagIqEP7YJr3Yqe7PrFGpsA44PXprL6ik/edit#gid=0&fvid=671968663
`
  common.sendMessageToDiscord(message)
}

/**
 * 更新処理呼び出し部分
 */
const updateDeadlines = (sheet, deadDetails, deadlineColumn) => {
  deadDetails.forEach(e => {
    if(e.item === '神獣討伐令' && e.detail === '神獣') updateDivineBastsDeadline(sheet, e.row, deadlineColumn)
    if(e.item === '王国勲章' && e.detail === 'ウィークリー') updateRoyalOrderWeeklyDeadline(sheet, e.row, deadlineColumn)
    if(e.item === '六花の試練 part1' || e.item === '六花の試練 part2') {
      updateTheSixFlowerTrialsDeadline(sheet, e.row, deadlineColumn)
      updateTheSixFlowerTrialsStatus(sheet, e.item)
    }
    if(e.item === '属性の試練' || e.item === 'クロノスの試練') updateAttributesDeadline(sheet, e.row, deadlineColumn)
    if(e.classification === 'イベント') updateEventDeadline(sheet, e.row, deadlineColumn)
  })
}

/**
 * 神獣締め切り更新
 */
const updateDivineBastsDeadline = (sheet, row, column) => {
  const deadline = new Date(sheet.getRange(row, column).getValue())
  const updateDeadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate() + 3)
  sheet.getRange(row, column).setValue(updateDeadline)

  updateState(sheet, row)
}

/**
 * 王国勲章ウィークリー締め切り更新
 * 月曜日に更新なので締め切りは日曜日
 */
const updateRoyalOrderWeeklyDeadline = (sheet, row, column) => {
  const common = commonPublicFunctions();

  const updateDeadline = common.getFirstDayOfTheNextWeek()
  sheet.getRange(row, column).setValue(updateDeadline)

  updateState(sheet, row)
}

/**
 * 属性の試練、クロノスの試練更新
 */
const updateAttributesDeadline = (sheet, row, column) => {
  const common = commonPublicFunctions();

  const updateDeadline = common.getThirdWednesdayOfTheNextMonth()
  sheet.getRange(row, column).setValue(updateDeadline)

  updateState(sheet, row)
}

/**
 * 宝石の守護神更新
 */


/**
 * 六花の試練更新
 * 期限の更新部分
 * 2週間ごとに切り替わる。
 * 期限が切れた行が次期限切れになるのは4週間後
 */
const updateTheSixFlowerTrialsDeadline = (sheet, row, column) => {
  const common = commonPublicFunctions();

  const updateDeadline = common.getTuesdayOfThe4WeeksLater()
  sheet.getRange(row, column).setValue(updateDeadline)
}

/**
 * 六花の試練更新
 * ステータスの更新部分
 * Part1が期限切れならPart2
 * Part2が期限切れならPart1を未完了とする。
 */
const updateTheSixFlowerTrialsStatus = (sheet, item) => {
  const common = commonPublicFunctions();
  const targetItemLabel = item === '六花の試練 part1' ?
    '六花の試練 part2' :
    item === '六花の試練 part2' ?
      '六花の試練 part1' : undefined
  if(!targetItemLabel) return

  // 未完了にするカラムのrowを取得する。
  const itemColumn = common.findColumnByHeader(sheet, '中項目')
  const lastRow = sheet.getMaxRows();
  const targetRows = sheet.getRange(1,itemColumn,lastRow,1).getValues().map((e, i) => {
    return e === targetItemLabel ? i + 1 : undefined
  }).filter(e => {
    return e
  })

  targetRows.forEach(row => {
    updateState(sheet, row)
  })
}

/**
 * 追憶のデイリー試練更新
 */

/**
 * Event更新
 * 期限の欄を空欄にするだけ
 */
const updateEventDeadline = (sheet, row, column) => {
  sheet.getRange(row, column).setValue('')
}

// 未完了に変更
const updateState = (sheet, row) => {
  const common = commonPublicFunctions();

  // 更新する対象を定義
  const targets = ['おちゃ', 'おちゃ2nd']
  targets.forEach((e) => {
    const targetColumn = common.findColumnByHeader(sheet, e)
    sheet.getRange(row, targetColumn).setValue('未完了')
  })
}


/**
 * cron系
 */
function getTriggers(){
  const common = commonPublicFunctions();

  // 8~23
  const times = Array.from({ length: 16}, (e, index) => index + 8);
  const noticeTimedEventsTriggers = times.map(time => {
    return {
      taskName: 'noticeTimedEventsMain',
      schedule: {
        date: common.getCurrentDate(),
        hours: time,
        minutes: 0,
      }
    }
  })

  const triggers = [
    {
      taskName: 'updateDeadlinesMain',
      schedule: {
        date: common.getCurrentDate(),
        hours: 3,
        minutes: 0,
      }
    },
    {
      taskName: 'noticeDeadlinesMain',
      schedule: {
        date: common.getCurrentDate(),
        hours: 5,
        minutes: 0,
      }
    },
  ].concat(noticeTimedEventsTriggers);

  console.log(triggers)

  return triggers;
}

function setTrigger(){
  const triggers = getTriggers();

  deleteTriggers(triggers);
  const time = new Date();
  for(trigger of triggers){
    time.setFullYear(trigger.schedule.date.getFullYear());
    time.setMonth(trigger.schedule.date.getMonth());
    time.setDate(trigger.schedule.date.getDate());
    time.setHours(trigger.schedule.hours);
    time.setMinutes(trigger.schedule.minutes);
    ScriptApp.newTrigger(trigger.taskName).timeBased().at(time).create();
    Utilities.sleep(1000)
  };
}

function deleteTriggers(crons) {
  const triggers = ScriptApp.getProjectTriggers();
  for(trigger of triggers){
    for(cron of crons){
      if(trigger.getHandlerFunction() == cron.taskName){
        ScriptApp.deleteTrigger(trigger);
      }
      Utilities.sleep(1000)
    }
  }
}