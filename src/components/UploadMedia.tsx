import React, { useState, useEffect } from "react";
import { Modal, Upload, Button, message, Progress, Tag, Select } from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PictureOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import SparkMD5 from "spark-md5";

const { Dragger } = Upload;

const BASE_URL = "https://bf.show";
const UPLOAD_URL = "https://upload.inmad.cn/controller/disk/manage_media_file.php";
const CHECK_URL = `${BASE_URL}/controller/disk/manage_media_file.php?type=check`;
const INSERT_URL = `${BASE_URL}/controller/disk/manage_media_file.php?type=insert`;

const ACCEPT_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/mov",
  "video/MOV",
  "video/mpeg",
  "video/avi",
  "video/quicktime",
];
const ACCEPT_EXT = ".jpg,.jpeg,.png,.mp4,.mov,.avi,.mpeg";

type UploadStatus = "pending" | "checking" | "uploading" | "done" | "error" | "duplicate";

interface FileItem {
  uid: string;
  file: File;
  status: UploadStatus;
  percent: number;
  errorMsg?: string;
  previewUrl?: string;
}

interface CustomerItem {
  customer_id: string;
  customer_name: string;
}

interface Props {
  visible: boolean;
  ssid: string;
  customerList: CustomerItem[];
  fallbackCustomerId?: string;
  platform: string;
  resetKey?: number;
  onClose: () => void;
  onSuccess: () => void;
}

/** 分块计算 MD5，与 PHP getFileMd5 逻辑完全一致 */
function computeMd5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2097152; // 2MB
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();

    reader.onload = (e) => {
      spark.append(e.target!.result as ArrayBuffer);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };
    reader.onerror = reject;

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}

export default function UploadMedia({
  visible,
  ssid,
  customerList,
  fallbackCustomerId,
  platform,
  resetKey,
  onClose,
  onSuccess,
}: Props) {
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const selectedPlatform = platform;

  useEffect(() => {
    if (selectedCustomers.length === 0 && fallbackCustomerId && customerList.some((c) => c.customer_id === fallbackCustomerId)) {
      setSelectedCustomers([fallbackCustomerId]);
    }
  }, [customerList, fallbackCustomerId]);

  useEffect(() => {
    setSelectedCustomers([]);
  }, [platform, resetKey]);

  const effectiveCustomers = selectedCustomers.length > 0
    ? selectedCustomers
    : fallbackCustomerId ? [fallbackCustomerId] : [];

  const updateItem = (uid: string, patch: Partial<FileItem>) =>
    setFileList((prev) => prev.map((f) => (f.uid === uid ? { ...f, ...patch } : f)));

  const handleBeforeUpload = (file: File) => {
    if (!ACCEPT_TYPES.includes(file.type)) {
      message.error(`不支持的文件类型：${file.name}`);
      return Upload.LIST_IGNORE;
    }

    const uid = `${Date.now()}-${Math.random()}`;
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setFileList((prev) => [...prev, { uid, file, status: "pending", percent: 0, previewUrl }]);
    return false;
  };

  /** 单文件完整上传流程：MD5 → check → upload → insert，返回是否成功 */
  const processFile = (item: FileItem): Promise<boolean> =>
    new Promise(async (resolve) => {
      try {
        // ── Step 1: 计算 MD5 ──────────────────────────────────────
        updateItem(item.uid, { status: "checking", percent: 0 });
        const md5 = await computeMd5(item.file);

        // ── Step 2: 去重检查 ──────────────────────────────────────
        const checkBody = new FormData();
        checkBody.append("f_name", item.file.name);
        checkBody.append("f_size", String(item.file.size));
        checkBody.append("f_md5", md5);
        checkBody.append("ssid", ssid);
        effectiveCustomers.forEach((id, i) => {
          checkBody.append(`selected_customer_ids[${i}][f_platform]`, selectedPlatform);
          checkBody.append(`selected_customer_ids[${i}][customer_ids][]`, id);
        });
        const checkRes = await fetch(CHECK_URL, {
          method: "POST",
          body: checkBody,
        });
        const checkData = await checkRes.json();

        if (checkData.code === 200) {
          // 文件已存在，跳过上传
          updateItem(item.uid, { status: "duplicate", percent: 100 });
          resolve(true);
          return;
        }

        // ── Step 3: 上传文件 ──────────────────────────────────────
        const uploadUrlWithParams =
          `${UPLOAD_URL}?type=upload&ssid=${encodeURIComponent(ssid)}`;

        const uploadResult = await new Promise<any>((res, rej) => {
          const fd = new FormData();
          fd.append("upfile", item.file);
          fd.append("ssid", ssid);

          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              updateItem(item.uid, {
                status: "uploading",
                percent: Math.round((e.loaded / e.total) * 100),
              });
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                res(JSON.parse(xhr.responseText));
              } catch {
                rej(new Error("响应解析失败"));
              }
            } else {
              rej(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => rej(new Error("网络错误"));
          xhr.open("POST", uploadUrlWithParams);
          xhr.send(fd);
          updateItem(item.uid, { status: "uploading", percent: 0 });
        });

        if (!uploadResult || uploadResult.code === 201) {
          updateItem(item.uid, {
            status: "error",
            errorMsg: uploadResult?.msg || "上传失败",
          });
          resolve(false);
          return;
        }

        // ── Step 4: insert 绑定客户 ────────────────────────────────
        const { admin_id, agency_id, ...safeResult } = uploadResult.result ?? {};
        const insertBody = new FormData();
        Object.entries(safeResult).forEach(([k, v]) => insertBody.append(k, String(v)));
        insertBody.append("ssid", ssid);
        effectiveCustomers.forEach((id, i) => {
          insertBody.append(`selected_customer_ids[${i}][f_platform]`, selectedPlatform);
          insertBody.append(`selected_customer_ids[${i}][customer_ids][]`, id);
        });
        const insertRes = await fetch(INSERT_URL, {
          method: "POST",
          body: insertBody,
        });
        const insertData = await insertRes.json();

        if (insertData.code === 200) {
          updateItem(item.uid, { status: "done", percent: 100 });
          resolve(true);
        } else {
          updateItem(item.uid, { status: "error", errorMsg: insertData.msg || "入库失败" });
          resolve(false);
        }
      } catch (err: any) {
        updateItem(item.uid, { status: "error", errorMsg: err?.message || "未知错误" });
        resolve(false);
      }
    });

  const handleUploadAll = async () => {
    const pending = fileList.filter((f) => f.status === "pending" || f.status === "error");
    if (pending.length === 0) return message.warning("没有待上传的文件");
    if (effectiveCustomers.length === 0) return message.error("请选择账户");

    setUploading(true);
    const results: boolean[] = [];
    for (let i = 0; i < pending.length; i += 3) {
      const batch = await Promise.all(pending.slice(i, i + 3).map(processFile));
      results.push(...batch);
    }
    setUploading(false);

    const doneCount = results.filter(Boolean).length;
    if (doneCount > 0) {
      message.success(`${doneCount} 个文件处理成功`);
      setFileList([]);
      onSuccess();
    }
  };

  const handleRemove = (uid: string) => {
    setFileList((prev) => {
      const item = prev.find((f) => f.uid === uid);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((f) => f.uid !== uid);
    });
  };

  const handleClose = () => {
    if (uploading) return;
    fileList.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFileList([]);
    setSelectedCustomers([]);
    onClose();
  };

  const pendingCount = fileList.filter((f) => f.status === "pending" || f.status === "error").length;

  const statusTag = (item: FileItem) => {
    switch (item.status) {
      case "checking":
        return <Tag color="processing">校验中</Tag>;
      case "uploading":
        return null; // 进度条已展示
      case "done":
        return <Tag color="success">成功</Tag>;
      case "duplicate":
        return <Tag color="warning">已存在</Tag>;
      case "error":
        return <Tag color="error">{item.errorMsg || "失败"}</Tag>;
      default:
        return null;
    }
  };

  const statusIcon = (item: FileItem) => {
    if (item.status === "checking" || item.status === "uploading")
      return <LoadingOutlined style={{ color: "#1677ff" }} />;
    if (item.status === "done")
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    if (item.status === "error")
      return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
    return null;
  };

  return (
    <Modal
      title="上传素材"
      open={visible}
      onCancel={handleClose}
      width={520}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={handleClose} disabled={uploading}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleUploadAll}
            loading={uploading}
            disabled={pendingCount === 0}
          >
            上传{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
        </div>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8, fontSize: 13, color: "#595959" }}>媒体平台：</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedPlatform}</span>
      </div>
      <Select
        mode="multiple"
        style={{ width: "100%", marginBottom: 16 }}
        placeholder="选择广告账户（可多选）"
        value={selectedCustomers}
        onChange={setSelectedCustomers}
        options={customerList.map((c) => ({
          label: `${c.customer_name}(${c.customer_id})`,
          value: c.customer_id,
        }))}
        allowClear
      />
      <Dragger
        accept={ACCEPT_EXT}
        multiple
        showUploadList={false}
        beforeUpload={handleBeforeUpload}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域</p>
        <p className="ant-upload-hint">
          支持 JPG / PNG / MP4 / MOV / AVI / MPEG，上传前自动去重检查
        </p>
      </Dragger>

      {fileList.length > 0 && (
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {fileList.map((item) => {
            const isVideo = item.file.type.startsWith("video/");
            return (
              <div
                key={item.uid}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 4px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {/* 缩略图 */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    background: "#f5f5f5",
                    borderRadius: 4,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {item.previewUrl ? (
                    <>
                      <img
                        src={item.previewUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
                        }}
                      />
                      <span style={{ display: "none", fontSize: 22, color: "#bfbfbf" }}>
                        <PictureOutlined />
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 22, color: "#bfbfbf" }}>
                      {isVideo ? <PlayCircleOutlined /> : <PictureOutlined />}
                    </span>
                  )}
                </div>

                {/* 文件名 + 状态 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.file.name}
                  >
                    {item.file.name}
                  </div>
                  {item.status === "uploading" && (
                    <Progress
                      percent={item.percent}
                      size="small"
                      showInfo={false}
                      style={{ marginTop: 4, marginBottom: 0 }}
                    />
                  )}
                  <div style={{ marginTop: 2 }}>{statusTag(item)}</div>
                </div>

                {/* 状态图标 */}
                <span style={{ flexShrink: 0 }}>{statusIcon(item)}</span>

                {/* 删除 */}
                {item.status !== "uploading" && item.status !== "checking" && (
                  <DeleteOutlined
                    style={{ color: "#bbb", cursor: "pointer", flexShrink: 0 }}
                    onClick={() => handleRemove(item.uid)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
