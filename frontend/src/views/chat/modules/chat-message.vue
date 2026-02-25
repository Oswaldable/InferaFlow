<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { nextTick } from 'vue';
import { VueMarkdownIt } from 'vue-markdown-shiki';
import { formatDate } from '@/utils/common';
defineOptions({ name: 'ChatMessage' });

const props = defineProps<{
  msg: Api.Chat.Message,
  sessionId?: string
}>();

const authStore = useAuthStore();

function handleCopy(content: string) {
  navigator.clipboard.writeText(content);
  window.$message?.success('已复制');
}

const chatStore = useChatStore();

const sourceFiles = ref<Array<{fileName: string, id: string, referenceNumber: number, fileMd5?: string}>>([]);

function processSourceLinks(text: string): string {
  sourceFiles.value = [];

  const newSourcePattern = /([\(（])来源#(\d+):\s*([^|\n\r（）]+?)\s*\|\s*MD5:\s*([a-fA-F0-9]+)([\)）])/g;

  let processedText = text.replace(newSourcePattern, (_match, leftParen, sourceNum, fileName, fileMd5, rightParen) => {
    const linkClass = 'source-file-link';
    const trimmedFileName = fileName.trim();
    const trimmedMd5 = fileMd5.trim();
    const fileId = `source-file-${sourceFiles.value.length}`;
    const referenceNumber = parseInt(sourceNum, 10);

    sourceFiles.value.push({
      fileName: trimmedFileName,
      id: fileId,
      referenceNumber,
      fileMd5: trimmedMd5
    });

    const lp = leftParen === '(' ? '(' : '（';
    const rp = rightParen === ')' ? ')' : '）';

    return `${lp}来源#${sourceNum}: <span class="${linkClass}" data-file-id="${fileId}">${trimmedFileName} | MD5:${trimmedMd5.substring(0, 8)}...</span>${rp}`;
  });

  const oldSourcePattern = /([\(（])来源#(\d+):\s*([^\n\r（）]+?)([\)）])/g;

  processedText = processedText.replace(oldSourcePattern, (_match, leftParen, sourceNum, fileName, rightParen) => {
    const linkClass = 'source-file-link';
    const trimmedFileName = fileName.trim();
    const fileId = `source-file-${sourceFiles.value.length}`;
    const referenceNumber = parseInt(sourceNum, 10);

    sourceFiles.value.push({
      fileName: trimmedFileName,
      id: fileId,
      referenceNumber
    });

    const lp = leftParen || '';
    const rp = rightParen || '';

    return `${lp}来源#${sourceNum}: <span class="${linkClass}" data-file-id="${fileId}">${trimmedFileName}</span>${rp}`;
  });

  return processedText;
}

const content = computed(() => {
  chatStore.scrollToBottom?.();
  const rawContent = props.msg.content ?? '';

  if (props.msg.role === 'assistant') {
    return processSourceLinks(rawContent);
  }

  return rawContent;
});

function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (target.classList.contains('source-file-link')) {
    const fileId = target.getAttribute('data-file-id');
    if (fileId) {
      const file = sourceFiles.value.find(f => f.id === fileId);
      if (file) {
        handleSourceFileClick({
          fileName: file.fileName,
          referenceNumber: file.referenceNumber,
          fileMd5: file.fileMd5
        });
      }
    }
  }
}

async function handleSourceFileClick(fileInfo: { fileName: string, referenceNumber: number, fileMd5?: string }) {
  const { fileName, referenceNumber, fileMd5: extractedMd5 } = fileInfo;
  console.log('点击了来源文件:', fileName, '引用编号:', referenceNumber, '提取的MD5:', extractedMd5, '会话ID:', props.sessionId);

  try {
    window.$message?.loading(`正在获取文件下载链接: ${fileName}`, {
      duration: 0,
      closable: false
    });

    let targetMd5 = null;

    if (extractedMd5) {
      console.log('使用从引用中提取的MD5:', extractedMd5);
      targetMd5 = extractedMd5;
    }
    else if (props.sessionId) {
      try {
        console.log('步骤1: 通过API查询引用MD5', { sessionId: props.sessionId, referenceNumber });
        const { error: md5Error, data: md5Data } = await request<Api.Document.ReferenceMd5Response>({
          url: 'documents/reference-md5',
          params: {
            sessionId: props.sessionId,
            referenceNumber: referenceNumber.toString()
          },
          baseURL: '/proxy-api'
        });

        console.log('引用MD5查询结果:', { error: md5Error, data: md5Data });

        if (!md5Error && md5Data?.fileMd5) {
          targetMd5 = md5Data.fileMd5;
        }
      } catch (md5Err) {
        console.warn('通过API查询MD5失败:', md5Err);
      }
    }

    if (targetMd5) {
      console.log('步骤2: 使用MD5下载文件', targetMd5);
      const { error: downloadError, data: downloadData } = await request<Api.Document.DownloadResponse>({
        url: 'documents/download-by-md5',
        params: {
          fileMd5: targetMd5,
          token: authStore.token
        },
        baseURL: '/proxy-api'
      });

      console.log('文件下载结果:', { error: downloadError, data: downloadData });

      window.$message?.destroyAll();

      if (!downloadError && downloadData?.downloadUrl) {
        window.open(downloadData.downloadUrl, '_blank');
        window.$message?.success(`文件下载链接已打开: ${downloadData.fileName || fileName}`);
        return;
      }
    }

    console.log('降级方案: 使用文件名下载', fileName);
    const { error, data } = await request<Api.Document.DownloadResponse>({
      url: 'documents/download',
      params: {
        fileName: fileName,
        token: authStore.token
      },
      baseURL: '/proxy-api'
    });

    window.$message?.destroyAll();

    if (error) {
      window.$message?.error(`文件下载失败: ${error.response?.data?.message || '未知错误'}`);
      return;
    }

    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
      window.$message?.success(`文件下载链接已打开: ${data.fileName || fileName}`);
    } else {
      window.$message?.error('未能获取到下载链接');
    }
  } catch (err) {
    window.$message?.destroyAll();
    console.error('文件下载失败:', err);
    window.$message?.error(`文件下载失败: ${fileName}`);
  }
}
</script>

<template>
  <div class="tech-message" :class="msg.role === 'assistant' ? 'is-assistant' : 'is-user'">
    <div class="tech-message-header">
      <NAvatar v-if="msg.role === 'user'" class="tech-avatar-user" :size="36" round>
        <SvgIcon icon="ph:user-circle" class="text-icon-large color-white" />
      </NAvatar>
      <NAvatar v-else class="tech-avatar-ai" :size="36" round>
        <SystemLogo class="text-6 text-white" />
      </NAvatar>
      <div class="tech-message-meta">
        <NText class="tech-message-name" :class="msg.role === 'assistant' ? 'is-ai' : 'is-user'">
          {{ msg.role === 'assistant' ? 'InferaFlow' : authStore.userInfo.username }}
        </NText>
        <NText class="tech-message-time">{{ formatDate(msg.timestamp) }}</NText>
      </div>
    </div>

    <NText v-if="msg.status === 'pending'" class="tech-message-thinking">
      <span class="tech-thinking-dots">
        <span class="tech-dot" />
        <span class="tech-dot" />
        <span class="tech-dot" />
      </span>
    </NText>
    <NText v-else-if="msg.status === 'error'" class="tech-message-error">服务器繁忙，请稍后再试</NText>
    <div v-else-if="msg.role === 'assistant'" class="tech-ai-content" @click="handleContentClick">
      <VueMarkdownIt :content="content" />
    </div>
    <NText v-else-if="msg.role === 'user'" class="tech-user-content">{{ content }}</NText>

    <div class="tech-divider" />
    <div class="tech-actions">
      <NButton quaternary size="small" class="tech-action-btn" @click="handleCopy(msg.content)">
        <template #icon>
          <icon-mynaui:copy class="text-#64748b" />
        </template>
      </NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tech-message {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  border-radius: 18px;
  padding: 14px 16px 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(155deg, rgba(12, 19, 35, 0.82), rgba(8, 14, 28, 0.7));
  box-shadow: 0 10px 26px rgba(2, 8, 23, 0.36);
  overflow: hidden;
  animation: message-appear 0.28s ease-out both;
}

.tech-message::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 10%, rgba(255, 255, 255, 0.05) 40%, transparent 68%);
  opacity: 0;
  transform: translateX(-22%);
  transition: all 0.35s ease;
  pointer-events: none;
}

.tech-message:hover::after {
  opacity: 1;
  transform: translateX(18%);
}

.tech-message.is-user {
  border-color: rgba(20, 184, 166, 0.36);
}

.tech-message.is-assistant {
  border-color: rgba(14, 165, 233, 0.3);
}

.tech-message-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tech-message-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tech-message-name {
  font-size: 14px;
  font-weight: 700;
}

.tech-message-name.is-user {
  color: #ccfbf1;
}

.tech-message-name.is-ai {
  background: linear-gradient(120deg, #5eead4, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tech-message-time {
  font-size: 12px;
  color: #64748b;
}

.tech-avatar-user {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.44), rgba(20, 184, 166, 0.2)) !important;
  border: 1px solid rgba(45, 212, 191, 0.35);
  box-shadow: 0 0 14px rgba(45, 212, 191, 0.2);
}

.tech-avatar-ai {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.38), rgba(99, 102, 241, 0.22)) !important;
  border: 1px solid rgba(125, 211, 252, 0.3);
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
}

.tech-message-thinking,
.tech-message-error {
  margin-left: 48px;
}

.tech-ai-content {
  margin-left: 48px;
  color: #d9e6f5;
  line-height: 1.72;
  border-radius: 12px;
  border: 1px solid rgba(125, 211, 252, 0.24);
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.64), rgba(12, 20, 36, 0.42));
  padding: 12px 14px;

  :deep(pre) {
    background: rgba(7, 12, 23, 0.95) !important;
    border: 1px solid rgba(94, 234, 212, 0.2);
    border-radius: 10px;
    padding: 14px;
    overflow-x: auto;
  }

  :deep(code) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  :deep(p code) {
    background: rgba(56, 189, 248, 0.12);
    color: #67e8f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
}

.tech-user-content {
  margin-left: 48px;
  color: #e6fffb;
  line-height: 1.72;
  border-radius: 12px;
  border: 1px solid rgba(45, 212, 191, 0.3);
  background: linear-gradient(140deg, rgba(15, 34, 41, 0.6), rgba(12, 23, 29, 0.44));
  padding: 12px 14px;
  white-space: pre-wrap;
}

.tech-divider {
  height: 1px;
  margin-left: 48px;
  background: linear-gradient(90deg, rgba(94, 234, 212, 0.28), transparent 68%);
}

.tech-actions {
  margin-left: 48px;
  display: flex;
  gap: 8px;
}

.tech-action-btn:hover {
  color: #67e8f9 !important;
}

.tech-thinking-dots {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 8px 0;
}

.tech-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  animation: tech-bounce 1.4s ease-in-out infinite;
}

.tech-dot:nth-child(1) { animation-delay: 0s; }
.tech-dot:nth-child(2) { animation-delay: 0.2s; }
.tech-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes tech-bounce {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
  }
}

:deep(.source-file-link) {
  color: #67e8f9;
  cursor: pointer;
  text-decoration: none;
  border-bottom: 1px dashed rgba(94, 234, 212, 0.45);
  transition: all 0.2s;
  padding: 0 2px;

  &:hover {
    color: #f59e0b;
    border-bottom-color: rgba(245, 158, 11, 0.6);
    text-shadow: 0 0 8px rgba(94, 234, 212, 0.3);
  }

  &:active {
    color: #22d3ee;
  }
}

@media (max-width: 640px) {
  .tech-message {
    padding: 11px 12px 10px;
    border-radius: 14px;
  }

  .tech-message-thinking,
  .tech-message-error,
  .tech-ai-content,
  .tech-user-content,
  .tech-divider,
  .tech-actions {
    margin-left: 0;
  }
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
