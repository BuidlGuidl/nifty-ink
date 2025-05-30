import { useState } from "react";
import { XOutlined } from "@ant-design/icons";
import CopyToClipboard from "react-copy-to-clipboard";

export const ShareModal = ({ modalId, shareUrl }: { modalId: string; shareUrl: string }) => {
  const [copied, setCopied] = useState(false);

  // Social share URLs
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    "Check out my drawing here:",
  )}&url=${encodeURIComponent(shareUrl)}${`&hashtags=${encodeURIComponent(
    "handmade #onchain",
  )}`}${`&via=${encodeURIComponent("NiftyInk")}`}`;

  return (
    <div>
      <input type="checkbox" id={modalId} className="modal-toggle" />
      <label htmlFor={modalId} className="modal cursor-pointer">
        <label className="modal-box relative max-w-[280px] sm:max-w-xs md:max-w-md w-full p-0 overflow-visible">
          <input className="h-0 w-0 absolute top-0 left-0" />
          <label htmlFor={modalId} className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2">
            ✕
          </label>
          <div className="flex flex-col items-center gap-2 p-2 sm:p-3">
            <div className="font-medium self-start text-lg md:text-xl mb-1">Share</div>
            <div className="flex gap-2 self-start">
              <button
                className="btn btn-circle border-none btn-sm md:btn-md bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-300"
                onClick={() => {
                  window.open(xUrl, "_blank");
                }}
              >
                <XOutlined className="text-white text-lg md:text-xl dark:text-black" />
              </button>
            </div>
            <div className="flex w-full gap-2">
              <input
                className="input input-bordered rounded-md input-sm md:input-md flex-1 text-xs md:text-md"
                value={shareUrl}
                readOnly
                onFocus={e => e.target.select()}
              />
              <CopyToClipboard
                text={shareUrl}
                onCopy={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
              >
                <button className="btn btn-primary btn-sm md:btn-md text-xs md:text-sm">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </CopyToClipboard>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
