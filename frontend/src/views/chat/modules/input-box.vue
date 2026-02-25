<script setup lang="ts">
const chatStore = useChatStore();
const { input, list, wsStatus, wsData } = storeToRefs(chatStore);

const latestMessage = computed(() => {
  return list.value[list.value.length - 1] ?? {};
});

const isSending = computed(() => {
  return (
    latestMessage.value?.role === 'assistant' && ['loading', 'pending'].includes(latestMessage.value?.status || '')
  );
});

const sendable = computed(
  () => (!input.value.message && !isSending.value) || ['CLOSED', 'CONNECTING'].includes(wsStatus.value)
);

const promptLength = computed(() => input.value.message?.length || 0);

const statusLabel = computed(() => {
  if (wsStatus.value === 'OPEN') return '在线';
  if (wsStatus.value === 'CONNECTING') return '连接中';
  return '离线';
});

watch(wsData, val => {
  if (!val) return;

  let data: Record<string, any>;
  try {
    data = JSON.parse(val);
  } catch {
    return;
  }

  const assistant = list.value[list.value.length - 1];
  if (!assistant || assistant.role !== 'assistant') return;

  if (data.type === 'completion' && data.status === 'finished' && assistant.status !== 'error')
    assistant.status = 'finished';
  if (data.error) assistant.status = 'error';
  else if (data.chunk) {
    assistant.status = 'loading';
    assistant.content += data.chunk;
  }
});

const handleSend = async () => {
  if (isSending.value) {
    const { error, data } = await request<Api.Chat.Token>({ url: 'chat/websocket-token', baseURL: 'proxy-api' });
    if (error) return;

    chatStore.wsSend(JSON.stringify({ type: 'stop', _internal_cmd_token: data.cmdToken }));

    list.value[list.value.length - 1].status = 'finished';
    if (!latestMessage.value.content) list.value.pop();
    return;
  }

  list.value.push({
    content: input.value.message,
    role: 'user'
  });
  chatStore.wsSend(input.value.message);
  list.value.push({
    content: '',
    role: 'assistant',
    status: 'pending'
  });
  input.value.message = '';
};

const inputRef = ref();
const insertNewline = () => {
  const textarea = inputRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  input.value.message = `${input.value.message.substring(0, start)}\n${input.value.message.substring(end)}`;

  nextTick(() => {
    textarea.selectionStart = start + 1;
    textarea.selectionEnd = start + 1;
    textarea.focus();
  });
};

const handShortcut = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault();

    if (!e.shiftKey && !e.ctrlKey) {
      handleSend();
    } else insertNewline();
  }
};
</script>

<template>
  <div class="tech-input-box">
    <div class="tech-input-header">
      <div class="header-left">
        <span class="header-label">PROMPT DECK</span>
        <span class="header-tip">Enter 发送 / Shift+Enter 换行</span>
      </div>
      <span class="header-counter">{{ promptLength }}</span>
    </div>

    <textarea
      ref="inputRef"
      v-model.trim="input.message"
      placeholder="给 InferaFlow 发送消息"
      class="tech-textarea"
      @keydown="handShortcut"
    />

    <div class="tech-input-footer">
      <div class="tech-status-pill" :class="wsStatus === 'OPEN' ? 'is-online' : wsStatus === 'CONNECTING' ? 'is-syncing' : 'is-error'">
        <span class="tech-status-indicator">
          <icon-eos-icons:loading v-if="wsStatus === 'CONNECTING'" class="text-#ffaa00 text-16px" />
          <span v-else-if="wsStatus === 'OPEN'" class="tech-status-dot online" />
          <span v-else class="tech-status-dot error" />
        </span>
        <span class="status-text">{{ statusLabel }}</span>
      </div>

      <NButton
        :disabled="sendable"
        strong
        circle
        type="primary"
        class="tech-send-btn"
        @click="handleSend"
      >
        <template #icon>
          <icon-material-symbols:stop-rounded v-if="isSending" />
          <icon-guidance:send v-else />
        </template>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.tech-input-box {
  width: 100%;
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(150deg, rgba(8, 14, 26, 0.85), rgba(12, 19, 35, 0.76));
  border: 1px solid rgba(94, 234, 212, 0.24);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.28s ease;
  box-shadow: 0 10px 26px rgba(2, 8, 23, 0.34);
  font-family: var(--chat-font-body, 'Space Grotesk', 'PingFang SC', sans-serif);
}

.tech-input-box:focus-within {
  border-color: rgba(45, 212, 191, 0.42);
  box-shadow: 0 0 0 1px rgba(45, 212, 191, 0.15), 0 14px 30px rgba(2, 8, 23, 0.48);
}

.tech-input-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-label {
  font-family: var(--chat-font-display, 'Rajdhani', 'Avenir Next Condensed', 'PingFang SC', sans-serif);
  font-weight: 600;
  font-size: 11px;
  color: rgba(94, 234, 212, 0.9);
  letter-spacing: 0.16em;
}

.header-tip {
  font-family: var(--chat-font-body, 'Space Grotesk', 'PingFang SC', sans-serif);
  font-weight: 500;
  font-size: 12px;
  color: #7891ad;
}

.header-counter {
  font-family: var(--chat-font-mono, 'JetBrains Mono', Menlo, Monaco, monospace);
  font-weight: 600;
  min-width: 46px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: rgba(15, 23, 42, 0.66);
  color: #dbeafe;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.tech-textarea {
  font-family: var(--chat-font-body, 'Space Grotesk', 'PingFang SC', sans-serif);
  font-weight: 500;
  min-height: 40px;
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  cursor: text;
  color: #e2e8f0;
  caret-color: #5eead4;
  font-size: 14px;
  line-height: 1.6;
}

.tech-textarea::placeholder {
  color: #64748b;
}

.tech-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
}

.tech-status-pill {
  height: 26px;
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(15, 23, 42, 0.62);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-family: var(--chat-font-display, 'Rajdhani', 'Avenir Next Condensed', 'PingFang SC', sans-serif);
  font-weight: 600;
  font-size: 12px;
  color: #9ab1c9;
  letter-spacing: 0.04em;
}

.tech-status-pill.is-online {
  border-color: rgba(52, 211, 153, 0.45);
}

.tech-status-pill.is-online .status-text {
  color: #6ee7b7;
}

.tech-status-pill.is-syncing {
  border-color: rgba(245, 158, 11, 0.45);
}

.tech-status-pill.is-syncing .status-text {
  color: #fbbf24;
}

.tech-status-pill.is-error {
  border-color: rgba(248, 113, 113, 0.5);
}

.tech-status-pill.is-error .status-text {
  color: #fca5a5;
}

.tech-status-indicator {
  display: flex;
  align-items: center;
}

.tech-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.tech-status-dot.online {
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
}

.tech-status-dot.error {
  background: #ff3366;
  box-shadow: 0 0 8px rgba(255, 51, 102, 0.5);
  animation: error-pulse 1.5s ease-in-out infinite;
}

@keyframes error-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.tech-send-btn {
  background: linear-gradient(140deg, #14b8a6, #0ea5e9) !important;
  border: none !important;
  box-shadow: 0 0 15px rgba(20, 184, 166, 0.32);
  transition: all 0.3s ease;
  width: 42px;
  height: 42px;
}

.tech-send-btn:hover:not(:disabled) {
  box-shadow: 0 0 22px rgba(20, 184, 166, 0.48);
  transform: scale(1.05);
}

.tech-send-btn:disabled {
  background: rgba(100, 116, 139, 0.3) !important;
  box-shadow: none;
}

@media (max-width: 640px) {
  .tech-input-box {
    padding: 10px;
  }

  .tech-input-header {
    margin-bottom: 8px;
  }

  .header-tip {
    font-size: 11px;
  }
}
</style>
