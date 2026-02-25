<script setup lang="tsx">
import type { UploadFileInfo } from 'naive-ui';
import { NButton, NEllipsis, NModal, NPopconfirm, NProgress, NTag, NUpload } from 'naive-ui';
import { uploadAccept } from '@/constants/common';
import { fakePaginationRequest } from '@/service/request';
import { UploadStatus } from '@/enum';
import SvgIcon from '@/components/custom/svg-icon.vue';
import FilePreview from '@/components/custom/file-preview.vue';
import UploadDialog from './modules/upload-dialog.vue';
import SearchDialog from './modules/search-dialog.vue';

const appStore = useAppStore();

const previewVisible = ref(false);
const previewFileName = ref('');
const previewFileMd5 = ref('');

function apiFn() {
  return fakePaginationRequest<Api.KnowledgeBase.List>({ url: '/documents/uploads' });
}

function renderIcon(fileName: string) {
  const ext = getFileExt(fileName);
  if (ext) {
    if (uploadAccept.split(',').includes(`.${ext}`)) return <SvgIcon localIcon={ext} class="mx-4 text-12" />;
    return <SvgIcon localIcon="dflt" class="mx-4 text-12" />;
  }
  return null;
}

function handleFilePreview(fileName: string, fileMd5: string) {
  console.log('[知识库] 点击预览按钮:', {
    fileName,
    fileMd5,
    '完整信息': { fileName, fileMd5 }
  });

  previewFileName.value = fileName;
  previewFileMd5.value = fileMd5;
  previewVisible.value = true;
}

function closeFilePreview() {
  console.log('[知识库] 关闭文件预览');
  previewVisible.value = false;
  previewFileName.value = '';
  previewFileMd5.value = '';
}

const { columns, columnChecks, data, getData, loading } = useTable({
  apiFn,
  immediate: false,
  columns: () => [
    {
      key: 'fileName',
      title: '文件名',
      minWidth: 300,
      render: row => (
        <div class="flex items-center">
          {renderIcon(row.fileName)}
          <NEllipsis lineClamp={2} tooltip>
            <span
              class="cursor-pointer text-#cbd5e1 hover:text-#00d4ff transition-colors"
              onClick={() => handleFilePreview(row.fileName, row.fileMd5)}
            >
              {row.fileName}
            </span>
          </NEllipsis>
        </div>
      )
    },
    {
      key: 'fileMd5',
      title: 'MD5',
      width: 120,
      render: row => (
        <NEllipsis tooltip>
          <span
            class="cursor-pointer text-#64748b hover:text-#00d4ff transition-colors font-mono text-3"
            onClick={() => {
              navigator.clipboard.writeText(row.fileMd5);
              window.$message?.success('MD5已复制');
            }}
            title="点击复制MD5"
          >
            {row.fileMd5.substring(0, 8)}...
          </span>
        </NEllipsis>
      )
    },
    {
      key: 'totalSize',
      title: '文件大小',
      width: 100,
      render: row => <span class="text-#94a3b8">{fileSize(row.totalSize)}</span>
    },
    {
      key: 'status',
      title: '上传状态',
      width: 100,
      render: row => renderStatus(row.status, row.progress)
    },
    {
      key: 'orgTagName',
      title: '组织标签',
      width: 150,
      ellipsis: { tooltip: true, lineClamp: 2 }
    },
    {
      key: 'isPublic',
      title: '是否公开',
      width: 100,
      render: row => (
        row.public || row.isPublic
          ? <NTag type="success" class="tech-tag-s" bordered={false}>公开</NTag>
          : <NTag type="warning" class="tech-tag-w" bordered={false}>私有</NTag>
      )
    },
    {
      key: 'createdAt',
      title: '上传时间',
      width: 100,
      render: row => <span class="text-#64748b">{dayjs(row.createdAt).format('YYYY-MM-DD')}</span>
    },
    {
      key: 'operate',
      title: '操作',
      width: 180,
      render: row => (
        <div class="flex gap-4">
          {renderResumeUploadButton(row)}
          <NButton
            type="primary"
            ghost
            size="small"
            onClick={() => handleFilePreview(row.fileName, row.fileMd5)}
          >
            预览
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.fileMd5)}>
            {{
              default: () => '确认删除当前文件吗？',
              trigger: () => (
                <NButton type="error" ghost size="small">
                  删除
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

const store = useKnowledgeBaseStore();
const { tasks } = storeToRefs(store);
onMounted(async () => {
  await getList();
});

async function getList() {
  console.log('[知识库] 开始获取文件列表');

  await getData();

  console.log('[知识库] 获取到原始数据，数量:', data.value.length);
  data.value.forEach((item, index) => {
    console.log(`[知识库] 原始数据[${index}]:`, {
      fileName: item.fileName,
      fileMd5: item.fileMd5,
      status: item.status
    });
  });

  if (data.value.length === 0) {
    tasks.value = [];
    return;
  }

  data.value.forEach((item, dataIndex) => {
    if (item.status === UploadStatus.Completed) {
      const index = tasks.value.findIndex(task => task.fileMd5 === item.fileMd5);
      if (index !== -1) {
        tasks.value[index].status = UploadStatus.Completed;
        console.log(`[知识库] 更新现有任务[${index}]:`, {
          fileName: item.fileName,
          fileMd5: item.fileMd5
        });
      } else {
        tasks.value.push(item);
        console.log(`[知识库] 添加新任务[${tasks.value.length - 1}]:`, {
          fileName: item.fileName,
          fileMd5: item.fileMd5
        });
      }
    } else if (!tasks.value.some(task => task.fileMd5 === item.fileMd5)) {
      item.status = UploadStatus.Break;
      tasks.value.push(item);
      console.log(`[知识库] 添加中断任务[${tasks.value.length - 1}]:`, {
        fileName: item.fileName,
        fileMd5: item.fileMd5
      });
    }
  });

  console.log('[知识库] 任务列表处理完成，总数:', tasks.value.length);
  tasks.value.forEach((task, index) => {
    console.log(`[知识库] 最终任务[${index}]:`, {
      fileName: task.fileName,
      fileMd5: task.fileMd5,
      status: task.status
    });
  });
}

async function handleDelete(fileMd5: string) {
  const index = tasks.value.findIndex(task => task.fileMd5 === fileMd5);

  if (index !== -1) {
    tasks.value[index].requestIds?.forEach(requestId => {
      request.cancelRequest(requestId);
    });
  }

  if (tasks.value[index].uploadedChunks && tasks.value[index].uploadedChunks.length === 0) {
    tasks.value.splice(index, 1);
    return;
  }

  const { error } = await request({ url: `/documents/${fileMd5}`, method: 'DELETE' });
  if (!error) {
    tasks.value.splice(index, 1);
    window.$message?.success('删除成功');
    await getData();
  }
}

// #region 文件上传
const uploadVisible = ref(false);
function handleUpload() {
  uploadVisible.value = true;
}
// #endregion

// #region 检索知识库
const searchVisible = ref(false);
function handleSearch() {
  searchVisible.value = true;
}
// #endregion

function renderStatus(status: UploadStatus, percentage: number) {
  if (status === UploadStatus.Completed) {
    return (
      <span class="tech-status-completed flex items-center gap-2">
        <span class="tech-status-dot-s" />
        <span class="text-#00ff88 text-12px">已完成</span>
      </span>
    );
  } else if (status === UploadStatus.Break) {
    return (
      <span class="tech-status-break flex items-center gap-2">
        <span class="tech-status-dot-e" />
        <span class="text-#ff3366 text-12px">上传中断</span>
      </span>
    );
  }
  return <NProgress percentage={percentage} processing />;
}

// #region 文件续传
function renderResumeUploadButton(row: Api.KnowledgeBase.UploadTask) {
  if (row.status === UploadStatus.Break) {
    if (row.file)
      return (
        <NButton type="primary" size="small" ghost onClick={() => resumeUpload(row)}>
          续传
        </NButton>
      );
    return (
      <NUpload
        show-file-list={false}
        default-upload={false}
        accept={uploadAccept}
        onBeforeUpload={options => onBeforeUpload(options, row)}
        class="w-fit"
      >
        <NButton type="primary" size="small" ghost>
          续传
        </NButton>
      </NUpload>
    );
  }
  return null;
}

function resumeUpload(row: Api.KnowledgeBase.UploadTask) {
  row.status = UploadStatus.Pending;
  store.startUpload();
}

async function onBeforeUpload(
  options: { file: UploadFileInfo; fileList: UploadFileInfo[] },
  row: Api.KnowledgeBase.UploadTask
) {
  const md5 = await calculateMD5(options.file.file!);
  if (md5 !== row.fileMd5) {
    window.$message?.error('两次上传的文件不一致');
    return false;
  }
  loading.value = true;
  const { error, data: progress } = await request<Api.KnowledgeBase.Progress>({
    url: '/upload/status',
    params: { file_md5: row.fileMd5 }
  });
  if (!error) {
    row.file = options.file.file!;
    row.status = UploadStatus.Pending;
    row.progress = progress.progress;
    row.uploadedChunks = progress.uploaded;
    store.startUpload();
    loading.value = false;
    return true;
  }
  loading.value = false;
  return false;
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="文件列表" :bordered="false" size="small" class="sm:flex-1-hidden tech-kb-card">
      <template #header>
        <span class="tech-card-title">文件列表</span>
      </template>
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @add="handleUpload" @refresh="getList">
          <template #prefix>
            <NButton size="small" ghost type="primary" @click="handleSearch">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              检索知识库
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        striped
        :columns="columns"
        :data="tasks"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="false"
        class="sm:h-full"
      />
    </NCard>
    <UploadDialog v-model:visible="uploadVisible" />
    <SearchDialog v-model:visible="searchVisible" />

    <!-- 文件预览弹窗 -->
    <NModal v-model:show="previewVisible" preset="card" title="文件预览" style="width: 80%; max-width: 1000px;">
      <FilePreview
        :file-name="previewFileName"
        :file-md5="previewFileMd5"
        :visible="previewVisible"
        @close="closeFilePreview"
      />
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.tech-kb-card {
  background: rgba(17, 24, 39, 0.6) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 212, 255, 0.1) !important;
  border-radius: 12px !important;
}

.tech-card-title {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  font-size: 16px;
}

.file-list-container {
  transition: width 0.3s ease;
}

:deep() {
  .n-progress-icon.n-progress-icon--as-text {
    white-space: nowrap;
  }
}

.tech-tag-s {
  background: rgba(0, 255, 136, 0.1) !important;
  color: #00ff88 !important;
  border: 1px solid rgba(0, 255, 136, 0.2) !important;
}

.tech-tag-w {
  background: rgba(255, 170, 0, 0.1) !important;
  color: #ffaa00 !important;
  border: 1px solid rgba(255, 170, 0, 0.2) !important;
}

.tech-status-dot-s {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
  display: inline-block;
}

.tech-status-dot-e {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff3366;
  box-shadow: 0 0 6px rgba(255, 51, 102, 0.5);
  display: inline-block;
  animation: error-blink 1.5s ease-in-out infinite;
}

@keyframes error-blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
