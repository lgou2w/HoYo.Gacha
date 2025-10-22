# 原神 · 千星奇域 - 颂愿

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
