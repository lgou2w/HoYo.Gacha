# 原神 · 千星奇域 - 颂愿

GET https://public-operation-hk4e.mihoyo.com/gacha_info/api/getBeyondGachaLog

常驻：

```json
{
  "retcode": 0,
  "message": "OK",
  "data": {
    "total": "0",
    "list": [
      {
        "id": "1761109800000081972",
        "region": "cn_gf01",
        "uid": "",
        "schedule_id": "18",
        "item_type": "装扮形录",
        "item_id": "270857",
        "item_name": "部件形录·「典雅半身裙·叶绿」",
        "rank_type": "2",
        "is_up": "0",
        "time": "2025-10-22 13:07:45",
        "op_gacha_type": "1000"
      }
    ]
  }
}
```

活动（女）：

```json
{
  "retcode": 0,
  "message": "OK",
  "data": {
    "total": "0",
    "list": [
      {
        "id": "1761217800000176385",
        "region": "cn_gf01",
        "uid": "",
        "schedule_id": "20",
        "item_type": "装扮套装",
        "item_id": "265044",
        "item_name": "女性装扮·「烛影狂欢夜」",
        "rank_type": "5",
        "is_up": "0",
        "time": "2025-10-23 19:52:08",
        "op_gacha_type": "20021"
      },
      {
        "id": "1761217800000176285",
        "region": "cn_gf01",
        "uid": "",
        "schedule_id": "20",
        "item_type": "装扮部件",
        "item_id": "260109",
        "item_name": "女性装扮·「炽烈长袖衫」",
        "rank_type": "3",
        "is_up": "0",
        "time": "2025-10-23 19:52:08",
        "op_gacha_type": "20021"
      }
    ]
  }
}
```

官方 JS Bundle 数据：

```js
getLogList: function () {
  var e = arguments.length > 0 &&
  void 0 !== arguments[0] ? arguments[0] : {
  };
  return (0, A.get) ('/gacha_info/api/getBeyondGachaLog', e)
},
getSendFriend: function () {
  var e = arguments.length > 0 &&
  void 0 !== arguments[0] ? arguments[0] : {
  };
  return (0, A.get) ('/gacha_info/api/getSendFriend', e)
},
getGiveLogList: function () {
  var e = arguments.length > 0 &&
  void 0 !== arguments[0] ? arguments[0] : {
  };
  return (0, A.get) ('/gacha_info/api/getBeyondGachaSendLog', e)
},
getSendFriendList: function () {
  var e = arguments.length > 0 &&
  void 0 !== arguments[0] ? arguments[0] : {
  };
  return (0, A.get) ('/gacha_info/api/getSendFriendList', e)
}
```

```js
t.itemTypeArr = [
  {
    key: '1000',
    I18NKey: 'beyond_gacha_type_1000'
  },
  {
    key: '2000',
    I18NKey: 'beyond_gacha_type_2000'
  }
],
t.itemTypeNameMap = {
  1000: {
    I18NKey: 'beyond_gacha_type_1000'
  },
  2000: {
    I18NKey: 'beyond_gacha_type_2000'
  },
  20011: {
    I18NKey: 'beyond_gacha_type_20011'
  },
  20012: {
    I18NKey: 'beyond_gacha_type_20012'
  },
  20021: {
    I18NKey: 'beyond_gacha_type_20021'
  },
  20022: {
    I18NKey: 'beyond_gacha_type_20022'
  }
}
```

常驻
> https://operation-webstatic.mihoyo.com/gacha_info/hk4e/cn_gf01/f3f5090a8ec0b28f15805c9969aa6c4ec357/zh-cn.json?ts=1761089821

活动（男）
> https://operation-webstatic.mihoyo.com/gacha_info/hk4e/cn_gf01/a8d0a985efb4ed61eb2e73a86a57237bd116/zh-cn.json?ts=1761089860

活动（女）
> https://operation-webstatic.mihoyo.com/gacha_info/hk4e/cn_gf01/57016dec6b768231ba1342c01935417a799b/zh-cn.json?ts=1761089899
