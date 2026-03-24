import { useEffect, useState } from "react";
import { message } from "antd";

// iframe 单例，模块级创建避免重复挂载
const iframe = document.createElement("iframe");
iframe.src = "https://bf.show/feishu/plugin/snap_login/bridge.html";
iframe.style.display = "none";
document.body.appendChild(iframe);

const requestUserInfo = () => {
  iframe.contentWindow?.postMessage(
    { type: "GET_COOKIE", key: "inmad_user_info" },
    "https://bf.show"
  );
};

iframe.onload = () => {
  requestUserInfo();
};

async function checkIsLogin(ssid: string): Promise<boolean> {
  if (!ssid) return false;
  try {
    const res = await fetch(
      `https://bf.show/inc/is_login.php?ssid=${encodeURIComponent(ssid)}`
    );
    const data = await res.json();
    return data.code === 200;
  } catch {
    return false;
  }
}

interface UseLoginCheckOptions {
  /** 登录成功后的回调，ssid 作为参数传入 */
  onLoggedIn?: (ssid: string) => void;
}

export function useLoginCheck({ onLoggedIn }: UseLoginCheckOptions = {}) {
  const [ssid, setSsid] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://bf.show") return;
      const { type, data } = event.data;
      if (type !== "COOKIE_RESULT") return;

      const newSsid = data || "";
      setSsid(newSsid);

      checkIsLogin(newSsid).then((loggedIn) => {
        setChecking(false);
        if (loggedIn) {
          setModalVisible(false);
          onLoggedIn?.(newSsid);
        } else {
          setModalVisible(true);
          if (newSsid) message.warning("还未检测到登录信息，请先前往登录");
        }
      });
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onLoggedIn]);

  /** 刷新按钮：重新从 iframe 获取 cookie，message handler 处理后续 */
  const refresh = () => {
    setChecking(true);
    requestUserInfo();
  };

  return { ssid, modalVisible, checking, refresh };
}
