import { useState, useCallback } from "react";
import { message } from "antd";

interface TTDMediaResult {
  ttdDataList: any[];
  ttdPage: number;
  ttdPageSize: number;
  ttdTotal: number;
  ttdLoading: boolean;
  fetchTTD: (pageNum?: number, pageSizeNum?: number, customerIdOverride?: string) => Promise<void>;
}

export function useTTDMedia(customerId: string | undefined): TTDMediaResult {
  const [ttdDataList, setTTDDataList] = useState<any[]>([]);
  const [ttdPage, setTTDPage] = useState(1);
  const [ttdPageSize, setTTDPageSize] = useState(10);
  const [ttdTotal, setTTDTotal] = useState(0);
  const [ttdLoading, setTTDLoading] = useState(false);

  const fetchTTD = useCallback(
    async (
      pageNum: number = ttdPage,
      pageSizeNum: number = ttdPageSize,
      customerIdOverride?: string
    ) => {
      const currentCustomerId = customerIdOverride ?? customerId;
      if (!currentCustomerId) return;
      setTTDLoading(true);
      try {
        const res = await fetch(
          `/controller/ttd/feishu_api.php?op=get_generate_creative`,
          {
            method: "POST",
            credentials: "include",
            body: new URLSearchParams({
              customer_id: currentCustomerId,
              type: "3",
              page: String(pageNum),
              page_size: String(pageSizeNum),
            }),
          }
        );
        const data = await res.json();
        if (!data.data?.list?.length) {
          setTTDDataList([]);
          setTTDTotal(0);
          return;
        }
        setTTDDataList(data.data.list);
        setTTDTotal(Number(data.data.total));
        setTTDPage(pageNum);
        setTTDPageSize(pageSizeNum);
      } catch {
        message.error("TTD接口调用失败");
      } finally {
        setTTDLoading(false);
      }
    },
    [ttdPage, ttdPageSize, customerId]
  );

  return { ttdDataList, ttdPage, ttdPageSize, ttdTotal, ttdLoading, fetchTTD };
}
