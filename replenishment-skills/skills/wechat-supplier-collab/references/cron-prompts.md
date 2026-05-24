# Cron 固定提示词（粘贴到 OpenClaw Cron 任务 body）

## supplier-digest-daily（工作日 18:00）

```
【Cron: supplier-digest-daily】
请按 wechat-supplier-collab Skill §5.3，生成今日全部供应商协同日报。
supplierId: all
投递：仅对内 Markdown，不要生成 OUTBOUND_READY，不要向任何 supplier:group 会话发送。
时区：Asia/Shanghai
```

## supplier-followup-am（工作日 09:00）

```
【Cron: supplier-followup-am】
请按 wechat-supplier-collab Skill §5.5，列出：
1) 今日到期待办
2) 阻塞在采控的事项
3) 等待供应商超过 48h 未回复的事项
输出表格。不要对外发送。
```

## wechaty-health-hourly（仅 POC）

```
【Cron: wechaty-health-hourly】
请按 wechat-supplier-collab Skill §5.6 执行 health-check。
若最近 1h 无 supplier_group 入站，在报告中标注「可能 bridge 掉线或未 @」。
```
