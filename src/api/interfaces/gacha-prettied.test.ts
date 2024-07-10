import { Businesses } from '@/api/interfaces/account'
import { GachaRecord, GachaRecordRanks } from '@/api/interfaces/gacha'
import prettiedGachaRecords from './gacha-prettied'

test('GachaRecords - Prettied', () => {
  const business = Businesses.GenshinImpact
  const uid = 100_000_000

  const records: GachaRecord[] = [
    {
      id: '1',
      business,
      uid,
      gachaType: 100,
      gachaId: null,
      rankType: GachaRecordRanks.Blue,
      count: 1,
      time: '2024-01-01 00:00:00',
      lang: 'zh-cn',
      name: '白缨枪',
      itemType: '武器',
      itemId: '13301'
    },
    {
      id: '2',
      business,
      uid,
      gachaType: 100,
      gachaId: null,
      rankType: GachaRecordRanks.Orange,
      count: 1,
      time: '2024-01-02 00:00:00',
      lang: 'zh-cn',
      name: '刻晴',
      itemType: '角色',
      itemId: '10000042'
    }
  ]

  const prettied = prettiedGachaRecords(business, uid, records)

  expect(prettied.business).toBe(business)
  expect(prettied.uid).toBe(uid)
  expect(prettied.total).toBe(records.length)
  expect(prettied.firstTime).toBe(records[0].time)
  expect(prettied.lastTime).toBe(records[1].time)
  expect(prettied.gachaTypeRecords).toHaveProperty('100', records)

  expect(prettied.categorizeds.Beginner?.total).toBe(records.length)
  expect(prettied.categorizeds.Beginner?.gachaType).toBe(100)
  expect(prettied.categorizeds.Beginner?.lastEndId).toBe(records[1].id)
  expect(prettied.categorizeds.Beginner?.metadata[GachaRecordRanks.Blue]).toStrictEqual({
    values: [records[0]],
    sum: 1,
    sumPercentage: 50
  })
  expect(prettied.categorizeds.Beginner?.metadata[GachaRecordRanks.Orange]).toStrictEqual({
    values: [{
      ...records[1],
      restricted: false,
      usedPity: 2
    }],
    sum: 1,
    sumPercentage: 50,
    sumAverage: 2,
    sumRestricted: 0,
    nextPity: 0
  })

  // TODO: More in-depth testing
})
