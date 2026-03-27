import { useState, useEffect, useCallback } from "react";
import { message } from "antd";

interface SnapMediaResult {
  apiDataList: any[];
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  fetchSnap: (
    pageNum?: number,
    pageSizeNum?: number,
    accountValue?: string,
    ssidOverride?: string,
    keywordParam?: string
  ) => Promise<void>;
}

export function useSnapMedia(
  selectedValue: string | undefined,
  ssid: string
): SnapMediaResult {
  const [apiDataList, setApiDataList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchSnap = useCallback(
    async (
      pageNum: number = page,
      pageSizeNum: number = pageSize,
      accountValue: string = selectedValue ?? "",
      ssidOverride?: string,
      keywordParam: string = ""
    ) => {
      const currentSsid = ssidOverride ?? ssid;
      if (!accountValue || !currentSsid) return;
      setLoading(true);
      try {
        const res = await fetch(`https://new.inmad.cn/feishu_interface/feishu_snapchat_media.php?`, {
          method: "POST",
          body: new URLSearchParams({
            page: String(pageNum),
            pageSize: String(pageSizeNum),
            customerId: accountValue,
            ...(keywordParam ? { name: keywordParam } : {}),
          }),
        });
        const data = await res.json();
        if (!data.data?.list?.length) {
          setApiDataList([]);
          setTotal(0);
          return;
        }
        setApiDataList(data.data.list);
        setTotal(Number(data.data.total));
        setPage(pageNum);
        setPageSize(pageSizeNum);
      } catch {
        message.error("接口调用失败");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, selectedValue, ssid]
  );

  return { apiDataList, page, pageSize, total, loading, fetchSnap };
}
