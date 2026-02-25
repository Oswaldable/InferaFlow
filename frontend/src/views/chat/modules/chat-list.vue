<script setup lang="ts">
import { NScrollbar } from 'naive-ui';
import { VueMarkdownItProvider } from 'vue-markdown-shiki';
import ChatMessage from './chat-message.vue';

defineOptions({
  name: 'ChatList'
});

const chatStore = useChatStore();
const { list, sessionId } = storeToRefs(chatStore);

const loading = ref(false);
const scrollbarRef = ref<InstanceType<typeof NScrollbar>>();

watch(() => [...list.value], scrollToBottom);

function scrollToBottom() {
  setTimeout(() => {
    scrollbarRef.value?.scrollBy({
      top: 999999999999999,
      behavior: 'auto'
    });
  }, 100);
}

const range = ref<[number, number]>([dayjs().subtract(7, 'day').valueOf(), dayjs().add(1, 'day').valueOf()]);

const params = computed(() => {
  return {
    start_date: dayjs(range.value[0]).format('YYYY-MM-DD'),
    end_date: dayjs(range.value[1]).format('YYYY-MM-DD')
  };
});

watchEffect(() => {
  getList();
});

async function getList() {
  loading.value = true;
  const { error, data } = await request<Api.Chat.Message[]>({
    url: 'users/conversation',
    params: params.value
  });
  if (!error) {
    list.value = data;
  }
  loading.value = false;
}

onMounted(() => {
  chatStore.scrollToBottom = scrollToBottom;
});
</script>

<template>
  <Suspense>
    <NScrollbar ref="scrollbarRef" class="chat-list-scroll h-0 flex-auto">
      <Teleport defer to="#header-extra">
        <div class="chat-filter-wrap px-10">
          <NForm :model="params" label-placement="left" :show-feedback="false" inline class="chat-filter-form">
            <NFormItem label="时间">
              <NDatePicker v-model:value="range" type="daterange" />
            </NFormItem>
          </NForm>
        </div>
      </Teleport>
      <NSpin :show="loading" class="chat-list-spin">
        <VueMarkdownItProvider>
          <ChatMessage v-for="(item, index) in list" :key="index" :msg="item" :session-id="sessionId" />
        </VueMarkdownItProvider>
        <NEmpty v-if="!loading && !list.length" description="对话从这里开始" class="chat-empty-state" />
      </NSpin>
    </NScrollbar>
  </Suspense>
</template>

<style scoped lang="scss">
.chat-filter-wrap {
  :deep(.n-form) {
    border-radius: 12px;
    padding: 8px 12px;
    border: 1px solid rgba(94, 234, 212, 0.22);
    background: rgba(15, 23, 42, 0.54);
    backdrop-filter: blur(10px);
  }
}

.chat-list-scroll {
  border-radius: 16px;
  background: linear-gradient(170deg, rgba(8, 13, 24, 0.5), rgba(12, 19, 35, 0.28));
}

.chat-list-spin {
  min-height: 100%;
  padding: 10px 8px 14px;
}

.chat-empty-state {
  margin-top: 72px;
}

:deep(.n-form .n-form-item .n-form-item-label) {
  font-family: var(--chat-font-display, 'Rajdhani', 'Avenir Next Condensed', 'PingFang SC', sans-serif);
  font-weight: 600;
  color: #b1c0d3;
  font-size: 12px;
  letter-spacing: 0.08em;
}

:deep(.n-date-picker .n-input) {
  border-color: rgba(148, 163, 184, 0.3) !important;
  background: rgba(15, 23, 42, 0.56) !important;
}

:deep(.n-date-picker .n-input__input-el) {
  font-family: var(--chat-font-mono, 'JetBrains Mono', Menlo, Monaco, monospace);
  font-weight: 500;
  color: #dbe6f5 !important;
}

@media (max-width: 640px) {
  .chat-list-spin {
    padding: 6px 4px 8px;
  }

  .chat-filter-wrap {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
