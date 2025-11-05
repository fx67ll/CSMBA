import request from '@/utils/request';

// 查询秘钥配置列表
export function getSecretConfig(query) {
  return request({
    url: '/secret/key/getSecretKeyConfigForApp',
    method: 'get',
    params: query,
  });
}
