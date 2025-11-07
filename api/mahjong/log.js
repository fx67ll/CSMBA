import request from "@/utils/request";

// 查询麻将室预约记录列表
export function listMahjongReservationLog(data) {
  const pageNum = data.pageNum;
  const pageSize = data.pageSize;
  delete data.pageNum;
  delete data.pageSize
  return request({
    url: `/mahjong/reservation/log/getReservationLogListForApp?pageNum=${pageNum}&pageSize=${pageSize}`,
    method: "post",
    data: data,
  });
}

// 新增麻将室预约记录
export function addMahjongReservationLog(data) {
  return request({
    url: "/mahjong/reservation/log/addReservationLogForApp",
    method: "post",
    data: data,
  });
}

// 修改麻将室预约记录
export function editMahjongReservationLog(data) {
  return request({
    url: "/mahjong/reservation/log/editReservationLogForApp",
    method: "put",
    data: data,
  });
}
