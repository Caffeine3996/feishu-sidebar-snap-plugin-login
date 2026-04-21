import { useState, useCallback } from "react";
import { message } from "antd";

interface TikTokMediaResult {
  tiktokDataList: any[];
  tiktokPage: number;
  tiktokPageSize: number;
  tiktokTotal: number;
  tiktokLoading: boolean;
  fetchTikTok: (
    pageNum?: number,
    pageSizeNum?: number,
    customerIdOverride?: string,
    keywordParam?: string
  ) => Promise<void>;
}

export function useTikTokMedia(customerId: string | undefined): TikTokMediaResult {
  const [tiktokDataList, setTikTokDataList] = useState<any[]>([]);
  const [tiktokPage, setTikTokPage] = useState(1);
  const [tiktokPageSize, setTikTokPageSize] = useState(10);
  const [tiktokTotal, setTikTokTotal] = useState(0);
  const [tiktokLoading, setTikTokLoading] = useState(false);

  const fetchTikTok = useCallback(
    async (
      pageNum: number = tiktokPage,
      pageSizeNum: number = tiktokPageSize,
      customerIdOverride?: string,
      keywordParam: string = ""
    ) => {
      const currentCustomerId = customerIdOverride ?? customerId;
      if (!currentCustomerId) return;
      setTikTokLoading(true);
      try {
        const res = await fetch(`/controller/tiktok/feishu_api.php?op=get_generate_creative`, {
          method: "POST",
          credentials: "include",
          body: new URLSearchParams({
            customer_id: currentCustomerId,
            page: String(pageNum),
            page_size: String(pageSizeNum),
            ...(keywordParam ? { file_name: keywordParam } : {}),
          }),
        });
        const data = await res.json();
        if (!data.data?.list?.length) {
          setTikTokDataList([]);
          setTikTokTotal(0);
          return;
        }
        setTikTokDataList(data.data.list);
        setTikTokTotal(Number(data.data.total));
        setTikTokPage(pageNum);
        setTikTokPageSize(pageSizeNum);
      } catch {
        message.error("TikTok接口调用失败");
      } finally {
        setTikTokLoading(false);
      }
    },
    [tiktokPage, tiktokPageSize, customerId]
  );

  return { tiktokDataList, tiktokPage, tiktokPageSize, tiktokTotal, tiktokLoading, fetchTikTok };
}
