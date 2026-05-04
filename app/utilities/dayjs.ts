import dayjs from 'dayjs'
import 'dayjs/locale/en'
import zhCN from 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

// dayjs v1.11.20 Fixed the merge issue
dayjs.updateLocale(zhCN.name, {
  formats: {
    // YYYY年M月D日ddddAh点mm分 -> 24 hours
    LLLL: 'YYYY年M月D日dddd HH点mm分',
  },
})

export default dayjs
export type Dayjs = dayjs.Dayjs
