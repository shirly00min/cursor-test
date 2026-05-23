/** 运行时注入微信发送能力（供审批、通知使用） */
let bridge = null;

export function setWechatBridge(api) {
  bridge = api;
}

export function getWechatBridge() {
  return bridge;
}
