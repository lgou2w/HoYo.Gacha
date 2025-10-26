# 原神 · 千星奇域 - 颂愿

## BydMaterialExcelConfigData.json

| item_type | id     | rank_type | item_name                |
|-----------|--------|-----------|--------------------------|
| 部件形录   | 270001 | 2         | 部件形录·「尖齿短袖衫·海蓝」 |
| 套装形录   | 275016 | 4         | 套装形录·「异想街区」       |
| 装扮部件   | 260109 | 3         | 女性装扮·「炽烈长袖衫」     |
| 装扮套装   | 265044 | 5         | 女性装扮·「烛影狂欢夜」     |
| 互动动作   | 250137 | 3         | 重重点头                  |
| 互动表情   | 250430 | 3         | 强颜欢笑                  |

* 部件 - 男女区别
* 形录 - 图纸，需要耗材制作
* 部件形录 - 指定性别，图纸，制作出就是什么性别
* 套装形录 - 图纸，制作时选择指定性别制作
* 装扮部件 - 现成的指定性别的部件
* 装扮套装 - 含有多个指定性别的部件

## BeyondCostumeDrawingExcelConfigData.json

装扮 Id 为 `27xxxx` 的应该都是形录（图纸），需要这个配置文件的 `AOIDKDBCOFD` 反查找到 `26xxxx` 的部件或套装图标素材。

## BeyondPoseExcelConfigData.json

互动动作的配置文件，需要通过 `BydMaterialExcelConfigData.json` 的 Id 项的 `itemType.useParam` 反查得到。并且有男女区别。

## BeyondEmojiExcelConfigData.json

互动表情的配置文件，需要通过 `BydMaterialExcelConfigData.json` 的 Id 项的 `itemType.useParam` 反查得到。

## API

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
