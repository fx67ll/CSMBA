import request from '@/utils/request'

// 查询麻将室详细
export function getMahjongRoomInfo() {
  return request({
    url: '/mahjong/room/getMahjongRoomInfoForApp/1',
    method: 'get'
  })
}
